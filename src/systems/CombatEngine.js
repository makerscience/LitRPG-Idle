// CombatEngine — core combat module. No Phaser dependency.
// All callbacks reference CombatEngine.method() by name to avoid `this` binding issues.

import Store from './Store.js';
import TimeEngine from './TimeEngine.js';
import BossManager from './BossManager.js';
import Progression from './Progression.js';
import { D, Decimal } from './BigNum.js';
import { createScope, emit, EVENTS } from '../events.js';
import { COMBAT_V2, STANCES, STANCE_IDS, STANCE_SWITCH_PAUSE_MS } from '../config.js';
import { getZoneScaling } from '../data/areas.js';
import { getEnemyById } from '../data/enemies.js';
import { pickRandomEncounter } from '../data/encounters.js';
import UpgradeManager from './UpgradeManager.js';
import TerritoryManager from './TerritoryManager.js';
import {
  getEffectiveMaxHp, getBaseDamage, getCritChance, getEffectiveDef, getPlayerAutoAttackInterval, getHpRegen, getEnemyHitChance,
} from './ComputedStats.js';

let scope = null;
let forcedCritMultiplier = null;
let _playerDead = false;

// ── Bulwark shield (ephemeral, not saved) ──
let _shieldHp = 0;
let _shieldTimerId = null;

// ── Rapid Strikes timer tracking (populated in Phase 3) ──
let _rapidStrikeTimerIds = new Set();

// ── Encounter runtime ──
let encounter = null;
let _idCounter = 0;
function _generateId(prefix) {
  return `${prefix}_${++_idCounter}`;
}

const CombatEngine = {
  init() {
    // Initialize BossManager
    BossManager.init();

    scope = createScope();

    // Register auto-attack ticker (enabled by default — it's an idle game)
    TimeEngine.register(
      'combat:autoAttack',
      () => CombatEngine.playerAttack(),
      getPlayerAutoAttackInterval(),
      true,
    );

    // Re-register auto-attack when speed upgrade purchased
    scope.on(EVENTS.UPG_PURCHASED, (data) => {
      if (data.upgradeId === 'auto_attack_speed') {
        TimeEngine.register(
          'combat:autoAttack',
          () => CombatEngine.playerAttack(),
          getPlayerAutoAttackInterval(),
          true,
        );
      }
    });

    // Re-register auto-attack when equipment changes (atkSpeed from gear may change)
    scope.on(EVENTS.INV_ITEM_EQUIPPED, () => {
      TimeEngine.register(
        'combat:autoAttack',
        () => CombatEngine.playerAttack(),
        getPlayerAutoAttackInterval(),
        true,
      );
    });

    // Player HP regen — fires every 1s
    TimeEngine.register(
      'combat:playerRegen',
      () => CombatEngine._regenPlayerHp(),
      1000,
      true,
    );

    // Subscribe to player death
    scope.on(EVENTS.COMBAT_PLAYER_DIED, () => {
      CombatEngine._onPlayerDeath();
    });

    // On level-up, restore HP to new max
    scope.on(EVENTS.PROG_LEVEL_UP, () => {
      Store.resetPlayerHp();
    });

    // Re-register auto-attack when territory attack speed buff is claimed
    scope.on(EVENTS.TERRITORY_CLAIMED, (data) => {
      if (data.buff.key === 'autoAttackSpeed') {
        TimeEngine.register(
          'combat:autoAttack',
          () => CombatEngine.playerAttack(),
          getPlayerAutoAttackInterval(),
          true,
        );
      }
    });

    // Stance switch: pause auto-attacks + cancel Rapid Strikes if leaving Flurry
    scope.on(EVENTS.STANCE_CHANGED, ({ stanceId, previousStance }) => {
      // 1. Cancel Rapid Strikes if leaving Flurry
      if (previousStance === 'flurry') {
        CombatEngine.cancelRapidStrikes();
      }

      // 2. Pause auto-attacks for STANCE_SWITCH_PAUSE_MS
      TimeEngine.unregister('combat:autoAttack');
      TimeEngine.scheduleOnce('combat:stancePause', () => {
        // Guard: don't restart if player died during the pause
        if (_playerDead) return;
        TimeEngine.register(
          'combat:autoAttack',
          () => CombatEngine.playerAttack(),
          getPlayerAutoAttackInterval(),
          true,
        );
      }, STANCE_SWITCH_PAUSE_MS);
    });

    // Subscribe to zone changes — spawn new enemy (not boss)
    scope.on(EVENTS.WORLD_ZONE_CHANGED, () => {
      TimeEngine.unregister('combat:spawnDelay');
      if (encounter) {
        CombatEngine._onEncounterEnd('zone_change');
      }
      CombatEngine.spawnEnemy();
    });

    // Spawn first enemy
    CombatEngine.spawnEnemy();
  },

  destroy() {
    BossManager.destroy();
    CombatEngine._clearEncounterTimers();
    CombatEngine._clearShield();
    CombatEngine.cancelRapidStrikes();
    TimeEngine.unregister('combat:autoAttack');
    TimeEngine.unregister('combat:stancePause');
    TimeEngine.unregister('combat:spawnDelay');
    TimeEngine.unregister('combat:bossDefeatedDelay');
    TimeEngine.unregister('combat:playerRegen');
    TimeEngine.unregister('combat:playerRespawn');
    scope?.destroy();
    scope = null;
    encounter = null;
  },

  // ── Encounter member builder and timer helpers ──

  /**
   * Build one EnemyRuntime from scaled enemy/boss data.
   * @param {object} enemyData - Scaled stats (hp as number/string, attack, defense, etc.)
   * @param {number} slot - Visual slot index (0-based)
   * @param {object} opts - { isBoss, isAdd, attackSpeedMult }
   */
  _buildMember(enemyData, slot, opts = {}) {
    const effectiveAtkSpeed = (enemyData.attackSpeed ?? 1.0) * (opts.attackSpeedMult ?? 1.0);
    return {
      instanceId: _generateId('mem'),
      slot,
      enemyId: enemyData.id,
      name: enemyData.name,
      hp: D(enemyData.hp),
      maxHp: D(enemyData.hp),
      attack: enemyData.attack,
      attackSpeed: effectiveAtkSpeed,
      defense: enemyData.defense ?? 0,
      accuracy: enemyData.accuracy ?? 80,
      armorPen: enemyData.armorPen ?? 0,
      dot: enemyData.dot ?? null,
      regen: enemyData.regen ?? 0,
      enrage: enemyData.enrage ?? null,
      thorns: enemyData.thorns ?? 0,
      _enraged: false,
      lootTable: enemyData.lootTable,
      goldDrop: String(enemyData.goldDrop),
      xpDrop: String(enemyData.xpDrop),
      isBoss: opts.isBoss || false,
      isAdd: opts.isAdd || false,
      baseEnemyId: enemyData.baseEnemyId ?? null,
      alive: true,
    };
  },

  /**
   * Build an EncounterRuntime from an array of built members and the source template.
   */
  _createEncounterRuntime(members, template, type) {
    const memberById = new Map();
    for (const m of members) memberById.set(m.instanceId, m);
    return {
      id: _generateId('enc'),
      templateId: template?.id ?? null,
      type,
      members,
      memberById,
      targetId: null,
      activeTimerIds: new Set(),
      bossMemberId: null,
      attackSpeedMult: template?.attackSpeedMult ?? 1.0,
      rewardMult: template?.rewardMult ?? 1.0,
      lootBonus: template?.lootBonus ?? { dropChanceMult: 1.0, rarityBoost: 0 },
      attackLockCount: 0,
    };
  },

  /**
   * Shared startup for both spawn paths.
   * Sets encounter state, registers timers, emits events.
   */
  _startEncounter(enc) {
    encounter = enc;
    enc.targetId = enc.members[0].instanceId;

    // Per-member attack + DoT timers (staggered so they don't all fire at once)
    for (let i = 0; i < enc.members.length; i++) {
      CombatEngine._registerMemberTimers(enc.members[i], i);
    }

    // Emit encounter started with full member list
    emit(EVENTS.COMBAT_ENCOUNTER_STARTED, {
      encounterId: enc.id,
      templateId: enc.templateId,
      type: enc.type,
      memberCount: enc.members.length,
      members: enc.members.map(m => ({
        instanceId: m.instanceId,
        slot: m.slot,
        enemyId: m.enemyId,
        name: m.name,
        maxHp: m.maxHp,
        isBoss: m.isBoss,
        armorPen: m.armorPen,
        dot: m.dot,
        regen: m.regen,
        enrage: m.enrage,
        thorns: m.thorns,
        attackSpeed: m.attackSpeed,
        defense: m.defense ?? 0,
        baseEnemyId: m.baseEnemyId ?? null,
      })),
    });
  },

  /** Register attack + DoT timers for a single encounter member.
   *  staggerIndex offsets the first attack so grouped enemies don't all swing at once. */
  _registerMemberTimers(member, staggerIndex = 0) {
    if (!encounter) return;
    const speed = member.attackSpeed;
    const interval = Math.max(400, Math.floor(COMBAT_V2.baseAttackIntervalMs / speed));
    const atkKey = `enc:${encounter.id}:atk:${member.instanceId}`;
    // Stagger: each subsequent enemy delays its first attack by a fraction of the interval
    const staggerOffset = staggerIndex > 0 ? -Math.floor(interval * staggerIndex / encounter.members.length) : 0;
    TimeEngine.register(atkKey, () => CombatEngine.enemyAttack(member.instanceId), interval, true, staggerOffset);
    encounter.activeTimerIds.add(atkKey);

    if (member.dot) {
      const dotKey = `enc:${encounter.id}:dot:${member.instanceId}`;
      let dotTickCount = 0;
      TimeEngine.register(dotKey, () => {
        CombatEngine._applyIncomingDamage(member.dot, 'dot');
        dotTickCount++;
        emit(EVENTS.COMBAT_DOT_TICK, {
          damage: member.dot,
          tickNumber: dotTickCount,
          encounterId: encounter.id,
          instanceId: member.instanceId,
          slot: member.slot,
        });
      }, 1000, true);
      encounter.activeTimerIds.add(dotKey);
    }

    if (member.regen > 0) {
      const regenKey = `enc:${encounter.id}:regen:${member.instanceId}`;
      TimeEngine.register(regenKey, () => {
        if (!member.alive) return;
        const before = member.hp;
        member.hp = Decimal.min(member.hp.plus(member.regen), member.maxHp);
        const healed = member.hp.minus(before).toNumber();
        if (healed > 0) {
          emit(EVENTS.COMBAT_ENEMY_REGEN, {
            amount: healed,
            remainingHp: member.hp,
            maxHp: member.maxHp,
            encounterId: encounter.id,
            instanceId: member.instanceId,
            slot: member.slot,
          });
        }
      }, 1000, true);
      encounter.activeTimerIds.add(regenKey);
    }
  },

  /** Unregister attack + DoT + regen timers for a single member. */
  _unregisterMemberTimers(member) {
    if (!encounter) return;
    const atkKey = `enc:${encounter.id}:atk:${member.instanceId}`;
    const dotKey = `enc:${encounter.id}:dot:${member.instanceId}`;
    const regenKey = `enc:${encounter.id}:regen:${member.instanceId}`;
    TimeEngine.unregister(atkKey);
    TimeEngine.unregister(dotKey);
    TimeEngine.unregister(regenKey);
    encounter.activeTimerIds.delete(atkKey);
    encounter.activeTimerIds.delete(dotKey);
    encounter.activeTimerIds.delete(regenKey);
  },

  /** Unregister all timers owned by the current encounter. */
  _clearEncounterTimers() {
    if (!encounter) return;
    for (const timerId of encounter.activeTimerIds) {
      TimeEngine.unregister(timerId);
    }
    encounter.activeTimerIds.clear();
  },

  /** Enable or disable all encounter timers (used during player death). */
  _setEncounterTimersEnabled(enabled) {
    if (!encounter) return;
    for (const timerId of encounter.activeTimerIds) {
      TimeEngine.setEnabled(timerId, enabled);
    }
  },

  /** Spawn a regular enemy using encounter templates + zone scaling. */
  spawnEnemy() {
    const state = Store.getState();
    const area = state.currentArea;
    const zone = state.currentZone;

    // Pick a weighted random encounter template for this area+zone
    const encTemplate = pickRandomEncounter(area, zone);
    if (!encTemplate) return;

    // Build members array — scale each member's stats by zone
    const members = encTemplate.members.map((memberId, slotIndex) => {
      const enemyTemplate = getEnemyById(memberId);
      if (!enemyTemplate) return null;

      const atkScale = getZoneScaling(zone, 'atk');
      const scaledData = {
        ...enemyTemplate,
        hp: D(enemyTemplate.hp).times(getZoneScaling(zone, 'hp')).floor().toString(),
        attack: Math.floor(enemyTemplate.attack * atkScale),
        goldDrop: D(enemyTemplate.goldDrop).times(getZoneScaling(zone, 'gold')).floor().toString(),
        xpDrop: D(enemyTemplate.xpDrop).times(getZoneScaling(zone, 'xp')).floor().toString(),
        regen: enemyTemplate.regen ? Math.floor(enemyTemplate.regen * atkScale) : 0,
        thorns: enemyTemplate.thorns ? Math.floor(enemyTemplate.thorns * atkScale) : 0,
      };

      return CombatEngine._buildMember(scaledData, slotIndex, {
        attackSpeedMult: encTemplate.attackSpeedMult,
      });
    }).filter(Boolean);

    if (members.length === 0) return;

    const enc = CombatEngine._createEncounterRuntime(members, encTemplate, 'normal');
    CombatEngine._startEncounter(enc);
  },

  /** Spawn a boss enemy (called by BossManager via BossChallenge UI). */
  spawnBoss(bossTemplate) {
    // Cancel any pending spawn
    TimeEngine.unregister('combat:spawnDelay');

    // End current encounter properly so GameScene clears all enemy slots
    if (encounter) {
      CombatEngine._onEncounterEnd('boss_challenge');
    }

    // Build boss member — no zone scaling (boss stats are hand-authored)
    const bossMember = CombatEngine._buildMember(bossTemplate, 0, { isBoss: true });

    const enc = CombatEngine._createEncounterRuntime([bossMember], null, 'boss');
    enc.bossMemberId = bossMember.instanceId;
    CombatEngine._startEncounter(enc);
  },

  /** Power Smash — active ability dealing smashMultiplier × base click damage. */
  powerSmashAttack(smashMultiplier) {
    const target = CombatEngine.getTargetMember();
    if (!target) return;

    const state = Store.getState();
    const { damage, isCrit } = CombatEngine.getPlayerDamage(state, true);
    const smashDamage = damage.times(smashMultiplier).floor();

    target.hp = Decimal.max(target.hp.minus(smashDamage), 0);

    emit(EVENTS.COMBAT_ENEMY_DAMAGED, {
      enemyId: target.enemyId,
      amount: smashDamage,
      isCrit,
      isPowerSmash: true,
      remainingHp: target.hp,
      maxHp: target.maxHp,
      encounterId: encounter?.id ?? null,
      instanceId: target.instanceId,
      slot: target.slot,
    });

    if (target.hp.lte(0)) {
      CombatEngine._onMemberDeath(target.instanceId);
    } else {
      CombatEngine._checkEnrage(target);
    }

    // Thorns: reflect damage to player (triggers even if target died)
    CombatEngine._applyThorns(target);
  },

  playerAttack(isClick = false) {
    const target = CombatEngine.getTargetMember();
    if (!target) return;

    const state = Store.getState();
    let { damage, isCrit } = CombatEngine.getPlayerDamage(state, isClick);

    if (isClick) {
      damage = damage.mul(COMBAT_V2.clickDamageScalar);
    }

    target.hp = Decimal.max(target.hp.minus(damage), 0);

    emit(EVENTS.COMBAT_ENEMY_DAMAGED, {
      enemyId: target.enemyId,
      amount: damage,
      isCrit,
      isClick,
      remainingHp: target.hp,
      maxHp: target.maxHp,
      encounterId: encounter?.id ?? null,
      instanceId: target.instanceId,
      slot: target.slot,
    });

    if (target.hp.lte(0)) {
      CombatEngine._onMemberDeath(target.instanceId);
    } else {
      CombatEngine._checkEnrage(target);
    }

    // Thorns: reflect damage to player (triggers even if target died)
    CombatEngine._applyThorns(target);
  },

  getPlayerDamage(state, isClick = false) {
    const str = getBaseDamage();
    const target = CombatEngine.getTargetMember();
    const enemyDef = target?.defense ?? 0;
    const rawDamage = COMBAT_V2.playerDamage(str, enemyDef);

    const prestigeMult = state.prestigeMultiplier;
    const clickDmgMult = isClick ? UpgradeManager.getMultiplier('clickDamage') : 1;
    const critChance = getCritChance();

    // Forced crit from FirstCrackDirector consumes the override
    let isCrit;
    let critMult;
    if (forcedCritMultiplier != null) {
      isCrit = true;
      critMult = forcedCritMultiplier;
      forcedCritMultiplier = null;
    } else {
      isCrit = Math.random() < critChance;
      const baseCritMult = state.flags.crackTriggered ? 10 : (COMBAT_V2.critMultiplier ?? 2);
      critMult = isCrit ? baseCritMult : 1;
    }

    const stance = STANCES[state.currentStance] || STANCES.power;
    const stanceMult = isClick ? 1 : stance.damageMult;

    const damage = D(rawDamage).times(clickDmgMult).times(prestigeMult).times(critMult)
      .times(TerritoryManager.getBuffMultiplier('baseDamage')).times(stanceMult).floor();
    return { damage, isCrit };
  },

  setForcedCrit(mult) {
    forcedCritMultiplier = mult;
  },

  // ── Encounter selectors ──

  /** Returns the active EncounterRuntime or null. */
  getEncounter() {
    return encounter;
  },

  /** Returns the EnemyRuntime currently targeted, or null. */
  getTargetMember() {
    if (!encounter) return null;
    return encounter.memberById.get(encounter.targetId) ?? null;
  },

  /** Returns array of alive EnemyRuntime members. */
  getLivingMembers() {
    if (!encounter) return [];
    return encounter.members.filter(m => m.alive);
  },

  /** Map lookup by instanceId. */
  getMemberByInstanceId(id) {
    if (!encounter) return null;
    return encounter.memberById.get(id) ?? null;
  },

  /** True if there is a living target. */
  hasTarget() {
    if (!encounter) return false;
    const target = encounter.memberById.get(encounter.targetId);
    return target?.alive === true;
  },

  /** Set the current target to a living member. Emits COMBAT_TARGET_CHANGED. */
  setTarget(instanceId) {
    if (!encounter) return;
    const member = encounter.memberById.get(instanceId);
    if (!member || !member.alive) return;
    encounter.targetId = instanceId;
    emit(EVENTS.COMBAT_TARGET_CHANGED, {
      encounterId: encounter.id,
      instanceId: member.instanceId,
      slot: member.slot,
      enemyId: member.enemyId,
    });
  },

  // ── Enrage check ──

  /** One-time enrage trigger when a member's HP drops below threshold. */
  _checkEnrage(member) {
    if (!member.enrage || member._enraged) return;
    const ratio = member.hp.div(member.maxHp).toNumber();
    if (ratio >= member.enrage.threshold) return;

    member._enraged = true;
    member.attack = Math.floor(member.attack * member.enrage.atkMult);
    member.attackSpeed *= member.enrage.speedMult;

    // Re-register attack timer with boosted speed
    if (encounter) {
      const atkKey = `enc:${encounter.id}:atk:${member.instanceId}`;
      const interval = Math.max(400, Math.floor(COMBAT_V2.baseAttackIntervalMs / member.attackSpeed));
      TimeEngine.register(atkKey, () => CombatEngine.enemyAttack(member.instanceId), interval, true);
    }

    emit(EVENTS.COMBAT_ENEMY_ENRAGED, {
      enemyId: member.enemyId,
      name: member.name,
      encounterId: encounter?.id ?? null,
      instanceId: member.instanceId,
      slot: member.slot,
    });
  },

  // ── Thorns reflection ──

  /** Apply thorns damage to the player after a hit. Bypasses DEF. */
  _applyThorns(member) {
    if (!member.thorns || member.thorns <= 0) return;
    Store.damagePlayer(member.thorns);
    emit(EVENTS.COMBAT_THORNS_DAMAGE, {
      amount: member.thorns,
      encounterId: encounter?.id ?? null,
      instanceId: member.instanceId,
      slot: member.slot,
    });
  },

  // ── Incoming damage pipeline ──

  /**
   * Unified incoming damage: stance DR → Bulwark absorb → Store.damagePlayer.
   * @param {number} rawDamage - Pre-mitigation damage
   * @param {string} _source - 'attack' | 'dot' (for future logging/analysis)
   */
  _applyIncomingDamage(rawDamage, _source) {
    const state = Store.getState();
    const stance = STANCES[state.currentStance] || STANCES.power;

    // 1. Stance damage reduction (Fortress)
    let dmg = rawDamage * (1 - stance.damageReduction);

    // 2. Bulwark shield absorb
    if (_shieldHp > 0) {
      if (dmg <= _shieldHp) {
        _shieldHp -= dmg;
        return; // fully absorbed
      }
      dmg -= _shieldHp;
      _shieldHp = 0;
      CombatEngine._clearShield();
    }

    // 3. Apply remaining damage to player
    if (dmg > 0) {
      Store.damagePlayer(dmg);
    }
  },

  /**
   * Activate Rapid Strikes — 5 hits at 200ms spacing using auto-attack damage.
   * Each hit targets the current live target; whiffs if no target exists.
   */
  activateRapidStrikes() {
    const castId = _generateId('rapid');
    for (let i = 0; i < 5; i++) {
      const timerId = `ability:rapid:${castId}:${i}`;
      _rapidStrikeTimerIds.add(timerId);
      TimeEngine.scheduleOnce(timerId, () => {
        _rapidStrikeTimerIds.delete(timerId);
        // Whiff silently if no living target (spawn-delay gap)
        if (!CombatEngine.hasTarget()) return;
        CombatEngine.playerAttack(false);
      }, 200 * (i + 1));
    }
  },

  /** Cancel all active Rapid Strikes timers. */
  cancelRapidStrikes() {
    for (const timerId of _rapidStrikeTimerIds) {
      TimeEngine.unregister(timerId);
    }
    _rapidStrikeTimerIds.clear();
  },

  /** Activate Bulwark absorb shield. */
  activateShield(amount, durationMs) {
    _shieldHp = amount;
    // Clear any existing shield timer
    if (_shieldTimerId) {
      TimeEngine.unregister(_shieldTimerId);
    }
    _shieldTimerId = 'combat:shieldExpiry';
    TimeEngine.scheduleOnce(_shieldTimerId, () => {
      _shieldHp = 0;
      _shieldTimerId = null;
    }, durationMs);

    emit(EVENTS.BULWARK_ACTIVATED, { shieldHp: amount, durationMs });
  },

  /** Current shield HP (0 if no shield). */
  getShieldHp() {
    return _shieldHp;
  },

  /** Clear shield state (on death, encounter end, etc.). */
  _clearShield() {
    _shieldHp = 0;
    if (_shieldTimerId) {
      TimeEngine.unregister(_shieldTimerId);
      _shieldTimerId = null;
    }
  },

  enemyAttack(instanceId) {
    // Look up attacker by instanceId, fall back to target member for safety
    const member = instanceId
      ? CombatEngine.getMemberByInstanceId(instanceId)
      : CombatEngine.getTargetMember();
    if (!member?.alive) return;

    const accuracy = member.accuracy ?? 80;
    const hitChance = getEnemyHitChance(accuracy);
    emit(EVENTS.COMBAT_ENEMY_ATTACKED, {
      enemyId: member.enemyId,
      name: member.name,
      accuracy,
      hitChance,
      encounterId: encounter?.id ?? null,
      instanceId: member.instanceId,
      slot: member.slot,
    });
    if (Math.random() > hitChance) {
      emit(EVENTS.COMBAT_ENEMY_DODGED, {
        enemyId: member.enemyId,
        name: member.name,
        accuracy,
        hitChance,
        dodgeChance: 1 - hitChance,
        encounterId: encounter?.id ?? null,
        instanceId: member.instanceId,
        slot: member.slot,
      });
      return;
    }
    const playerDef = getEffectiveDef();
    const armorPen = member.armorPen ?? 0;
    const damage = COMBAT_V2.enemyDamage(member.attack, playerDef, armorPen);
    CombatEngine._applyIncomingDamage(damage, 'attack');
  },

  _regenPlayerHp() {
    const regenAmount = getHpRegen();
    Store.healPlayer(regenAmount);
  },

  /** Delegates to ComputedStats.getEffectiveMaxHp(). Kept for backward compat. */
  getEffectiveMaxHp() {
    return getEffectiveMaxHp();
  },

  /** True while player is dead and waiting to respawn. */
  isPlayerDead() {
    return _playerDead;
  },

  _onPlayerDeath() {
    _playerDead = true;
    CombatEngine._clearShield();
    CombatEngine.cancelRapidStrikes();
    // Pause combat
    TimeEngine.setEnabled('combat:autoAttack', false);
    TimeEngine.setEnabled('combat:playerRegen', false);

    // If fighting a boss, cancel the boss fight
    if (encounter?.type === 'boss') {
      BossManager.cancelBoss();
    }

    // End the encounter properly so GameScene clears all enemy slots
    CombatEngine._onEncounterEnd('player_death');

    // Respawn after delay
    TimeEngine.scheduleOnce('combat:playerRespawn', () => {
      _playerDead = false;
      Store.resetPlayerHp();
      TimeEngine.setEnabled('combat:autoAttack', true);
      TimeEngine.setEnabled('combat:playerRegen', true);
      // Don't spawn a regular enemy if a boss fight was started during the death window
      if (!BossManager.isBossActive()) {
        CombatEngine.spawnEnemy();
      }
    }, COMBAT_V2.playerDeathRespawnDelay);
  },

  _onMemberDeath(instanceId) {
    if (!encounter) return;
    const member = encounter.memberById.get(instanceId);
    if (!member || !member.alive) return;

    // 1. Mark dead, stop this member's timers
    member.alive = false;
    CombatEngine._unregisterMemberTimers(member);

    // 2. Grant per-member rewards (gold, XP, kill counts) scaled by encounter rewardMult
    Progression.grantKillRewards(member, encounter.rewardMult);

    // 3. Emit kill event with full encounter context
    emit(EVENTS.COMBAT_ENEMY_KILLED, {
      enemyId: member.enemyId,
      name: member.name,
      lootTable: member.lootTable,
      isBoss: member.isBoss,
      encounterId: encounter.id,
      instanceId: member.instanceId,
      slot: member.slot,
      lootBonus: encounter.lootBonus,
    });

    // 4. Boss killed → immediate encounter end
    if (member.instanceId === encounter.bossMemberId) {
      CombatEngine._onEncounterEnd('boss_killed');
      return;
    }

    // 5. Retarget if dead member was current target
    if (encounter.targetId === instanceId) {
      const living = CombatEngine.getLivingMembers();
      if (living.length === 0) {
        CombatEngine._onEncounterEnd('cleared');
        return;
      }
      // Lowest-slot living member becomes new target
      living.sort((a, b) => a.slot - b.slot);
      const next = living[0];
      encounter.targetId = next.instanceId;
      emit(EVENTS.COMBAT_TARGET_CHANGED, {
        encounterId: encounter.id,
        instanceId: next.instanceId,
        slot: next.slot,
        enemyId: next.enemyId,
      });
    } else {
      // Non-target died — check if encounter is fully cleared
      if (CombatEngine.getLivingMembers().length === 0) {
        CombatEngine._onEncounterEnd('cleared');
      }
    }
  },

  _onEncounterEnd(reason) {
    if (!encounter) return;
    const enc = encounter;

    // 1. Clear all remaining encounter timers + any active Rapid Strikes
    CombatEngine._clearEncounterTimers();
    CombatEngine.cancelRapidStrikes();

    // 2. Despawn remaining alive members (boss adds) — no rewards
    for (const m of enc.members) {
      if (m.alive) {
        m.alive = false;
        emit(EVENTS.COMBAT_ENEMY_KILLED, {
          enemyId: m.enemyId, name: m.name,
          lootTable: m.lootTable, isBoss: m.isBoss,
          encounterId: enc.id, instanceId: m.instanceId,
          slot: m.slot, despawned: true,
        });
      }
    }

    // 3. Null state before emitting (prevent stale reads)
    encounter = null;

    // 4. Emit encounter ended
    emit(EVENTS.COMBAT_ENCOUNTER_ENDED, {
      encounterId: enc.id,
      type: enc.type,
      reason,
    });

    // 5. Reason-specific scheduling
    if (reason === 'cleared') {
      const state = Store.getState();
      Store.incrementZoneClearKills(state.currentArea, state.currentZone);
      TimeEngine.scheduleOnce('combat:spawnDelay', () => {
        CombatEngine.spawnEnemy();
      }, COMBAT_V2.spawnDelay);
    } else if (reason === 'boss_killed') {
      TimeEngine.scheduleOnce('combat:bossDefeatedDelay', () => {
        BossManager.onBossDefeated();
      }, 500);
    }
    // 'zone_change', 'player_death': no scheduling (Phase 7 wires these)
  },
};

export default CombatEngine;

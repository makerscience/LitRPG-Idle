// BossManager — handles boss challenge state, generates boss templates, tracks kill thresholds.
// Boss fights are triggered by clicking the "Challenge Boss" button, not automatically.

import Store from './Store.js';
import { createScope, emit, EVENTS } from '../events.js';
import { D } from './BigNum.js';
import {
  getArea, getBossType, getBossKillThreshold, getZoneScaling,
  getStrongestEnemy, getBossDropMultiplier, BOSS_TYPES, AREAS,
} from '../data/areas.js';

let scope = null;
let activeBoss = null;       // Currently active boss enemy (or null)
let bossDefeated = false;    // Was the boss just defeated this zone?

const BossManager = {
  init() {
    scope = createScope();

    // Check boss threshold after kills (counting is handled by Progression)
    scope.on(EVENTS.COMBAT_ENEMY_KILLED, (data) => {
      if (data.isBoss) return;
      BossManager._checkThreshold();
    });

    // Reset boss state on zone/area navigation
    scope.on(EVENTS.WORLD_ZONE_CHANGED, () => {
      BossManager.cancelBoss();
    });
  },

  destroy() {
    scope?.destroy();
    scope = null;
    activeBoss = null;
    bossDefeated = false;
  },

  /** Check if the kill threshold for the current zone's boss is met. */
  _checkThreshold() {
    const state = Store.getState();
    const area = state.currentArea;
    const zone = state.currentZone;
    const progress = state.areaProgress[area];
    if (!progress) return;

    // Already defeated this zone's boss
    if (progress.bossesDefeated.includes(zone)) return;

    const kills = progress.zoneClearKills[zone] || 0;
    const threshold = getBossKillThreshold(zone);

    if (kills >= threshold) {
      emit(EVENTS.BOSS_CHALLENGE_READY, { area, zone, kills, threshold });
    }
  },

  /** Is the boss challenge available for the current zone? */
  isChallengeReady() {
    const state = Store.getState();
    const area = state.currentArea;
    const zone = state.currentZone;
    const progress = state.areaProgress[area];
    if (!progress) return false;
    if (progress.bossesDefeated.includes(zone)) return false;

    const kills = progress.zoneClearKills[zone] || 0;
    const threshold = getBossKillThreshold(zone);
    return kills >= threshold;
  },

  /** Generate a boss template for the current zone. Returns an enemy-like object. */
  generateBossTemplate() {
    const state = Store.getState();
    const area = state.currentArea;
    const zone = state.currentZone;
    const bossType = getBossType(area, zone);
    const baseEnemy = getStrongestEnemy(area, zone);

    if (!baseEnemy) return null;

    const zoneScale = getZoneScaling(zone);
    const baseHp = Number(baseEnemy.hp) * zoneScale;
    const baseAtk = baseEnemy.attack * zoneScale;

    const bossHp = Math.floor(baseHp * bossType.hpMult);
    const bossAtk = Math.floor(baseAtk * bossType.atkMult);
    const dropMult = getBossDropMultiplier(bossType);
    const bossGold = Math.floor(Number(baseEnemy.goldDrop) * zoneScale * dropMult);
    const bossXp = Math.floor(Number(baseEnemy.xpDrop) * zoneScale * dropMult);

    // Boss name prefix
    let prefix;
    if (bossType === BOSS_TYPES.AREA) {
      const areaData = getArea(area);
      prefix = `${areaData.name} Guardian`;
    } else if (bossType === BOSS_TYPES.ELITE) {
      prefix = `Elite ${baseEnemy.name}`;
    } else {
      prefix = `${baseEnemy.name} Alpha`;
    }

    return {
      id: `boss_a${area}z${zone}`,
      name: prefix,
      hp: String(bossHp),
      attack: bossAtk,
      goldDrop: String(bossGold),
      xpDrop: String(bossXp),
      isBoss: true,
      bossType,
      baseEnemyId: baseEnemy.id,
      sprites: baseEnemy.sprites || null,
      spriteSize: (() => {
        const base = baseEnemy.spriteSize || { w: 200, h: 250 };
        return { w: base.w * bossType.sizeMult, h: base.h * bossType.sizeMult };
      })(),
      spriteOffsetY: baseEnemy.spriteOffsetY || 0,
      lootTable: baseEnemy.lootTable || [],
    };
  },

  /** Start the boss fight. Returns the boss template or null. */
  startBoss() {
    if (!BossManager.isChallengeReady()) return null;
    if (activeBoss) return null;

    const template = BossManager.generateBossTemplate();
    if (!template) return null;

    activeBoss = template;
    bossDefeated = false;
    emit(EVENTS.BOSS_SPAWNED, {
      area: Store.getState().currentArea,
      zone: Store.getState().currentZone,
      bossType: template.bossType,
      name: template.name,
    });
    return template;
  },

  /** Called when the boss is killed. Handles zone/area advancement. */
  onBossDefeated() {
    if (!activeBoss) return;

    const state = Store.getState();
    const area = state.currentArea;
    const zone = state.currentZone;
    const bossType = activeBoss.bossType;
    const areaData = getArea(area);

    // Record boss defeated
    Store.recordBossDefeated(area, zone);
    bossDefeated = true;

    emit(EVENTS.BOSS_DEFEATED, {
      area, zone, bossType,
      name: activeBoss.name,
    });

    // Area boss defeated → unlock next area
    if (bossType === BOSS_TYPES.AREA) {
      emit(EVENTS.AREA_BOSS_DEFEATED, { area, name: areaData.name });

      // Unlock next area
      const nextArea = area + 1;
      if (AREAS[nextArea]) {
        Store.setFurthestArea(nextArea);
        Store.advanceAreaZone(nextArea, 1);
      }
    }

    // Advance to next zone within area (if not the last zone)
    if (zone < areaData.zoneCount) {
      const nextZone = zone + 1;
      Store.advanceAreaZone(area, nextZone);
      // Auto-navigate to next zone
      Store.setAreaZone(area, nextZone);
    }

    activeBoss = null;
  },

  /** Cancel an active boss fight (e.g., player navigates away). */
  cancelBoss() {
    activeBoss = null;
    bossDefeated = false;
  },

  /** Is a boss fight currently active? */
  isBossActive() {
    return activeBoss !== null;
  },

  /** Get the active boss template (or null). */
  getActiveBoss() {
    return activeBoss;
  },

  /** Was the boss just defeated (for UI feedback)? */
  wasBossDefeated() {
    return bossDefeated;
  },

  /** Get current zone's kill progress toward boss threshold. */
  getZoneProgress() {
    const state = Store.getState();
    const area = state.currentArea;
    const zone = state.currentZone;
    const progress = state.areaProgress[area];
    if (!progress) return { kills: 0, threshold: 10, ratio: 0, defeated: false };

    const kills = progress.zoneClearKills[zone] || 0;
    const threshold = getBossKillThreshold(zone);
    const defeated = progress.bossesDefeated.includes(zone);

    return {
      kills,
      threshold,
      ratio: Math.min(1, kills / threshold),
      defeated,
    };
  },

  /** Get boss type label for the current zone. */
  getCurrentBossLabel() {
    const state = Store.getState();
    return getBossType(state.currentArea, state.currentZone).label;
  },
};

export default BossManager;

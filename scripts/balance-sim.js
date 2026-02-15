#!/usr/bin/env node
// Balance Simulation — standalone Node ESM script.
// Imports game data directly and simulates zone-by-zone idle progression.
// Usage: npm run balance:sim

// ── Imports ────────────────────────────────────────────────────────────
import { ENEMIES } from '../src/data/enemies.js';
import { BOSSES } from '../src/data/bosses.js';
import { ITEMS } from '../src/data/items.js';
import { AREAS, getZoneScaling, getBossKillThreshold } from '../src/data/areas.js';
import { PROGRESSION_V2, COMBAT_V2 } from '../src/config.js';
import { getAllUpgrades } from '../src/data/upgrades.js';

// ── Tuning Overrides (adjust these, rerun to iterate) ─────────────────
// Set to 1.0 to use raw data values. Multipliers applied BEFORE zone scaling.
const TUNE = {
  enemyAtkMult: 1.0,      // multiply all enemy ATK by this
  enemyXpMult: 1.0,       // multiply all enemy XP by this
  bossAtkMult: 1.0,       // multiply all boss ATK by this
  bossXpMult: 1.0,        // multiply all boss XP by this
  goldMult: 1.0,          // multiply all gold drops by this
  bossGoldMult: 1.0,      // multiply boss gold drops by this
  bossClickRate: 5,       // assumed clicks per second during boss fights
};

// ── Constants (hardcoded to avoid Store/Phaser dependencies) ───────────
const SLOT_UNLOCK_ZONES = {
  main_hand: 1, chest: 1, head: 1,
  legs: 6, boots: 9, gloves: 17, amulet: 22,
};

const EQUIP_TO_ITEM_SLOT = {
  main_hand: 'weapon', chest: 'body', head: 'head',
  legs: 'legs', boots: 'boots', gloves: 'gloves', amulet: 'amulet',
};

const STARTING = PROGRESSION_V2.startingStats;
const GROWTH = PROGRESSION_V2.statGrowthPerLevel;

// ── Player State ───────────────────────────────────────────────────────
const player = {
  level: 1,
  xp: 0,
  str: STARTING.str,
  def: STARTING.def,
  hp: STARTING.hp,
  regen: STARTING.regen,
  gold: 0,
  equipped: {},           // equipSlotId → item object (with statBonuses)
  upgradeLevels: {},      // upgradeId → level
};

// ── Helpers ────────────────────────────────────────────────────────────

function xpForLevel(level) {
  return PROGRESSION_V2.xpForLevel(level);
}

function levelUp() {
  player.level++;
  player.str += GROWTH.str;
  player.def += GROWTH.def;
  player.hp += GROWTH.hp;
  player.regen += GROWTH.regen;
}

function addXp(amount) {
  player.xp += amount;
  while (player.xp >= xpForLevel(player.level)) {
    player.xp -= xpForLevel(player.level);
    levelUp();
  }
}

function getEquipStatSum(statKey) {
  let sum = 0;
  for (const item of Object.values(player.equipped)) {
    if (item && item.statBonuses[statKey]) sum += item.statBonuses[statKey];
  }
  return sum;
}

// Note: flat upgrade bonuses (battle_hardening) are already added to player.str
// in purchaseUpgrade(), so we do NOT add getUpgradeFlatBonus here (matches real game).
function getEffectiveStr() {
  return player.str + getEquipStatSum('str');
}

function getEffectiveDef() {
  return player.def + getEquipStatSum('def');
}

function getEffectiveMaxHp() {
  return player.hp + getEquipStatSum('hp');
}

function getEffectiveRegen() {
  return player.regen + getEquipStatSum('regen');
}

function getAtkSpeed() {
  return COMBAT_V2.playerBaseAtkSpeed + getEquipStatSum('atkSpeed');
}

function getAutoAttackInterval() {
  const speed = getAtkSpeed();
  const baseInterval = 2000 / speed;
  const speedBonus = getUpgradeMultiplier('autoAttackSpeed') - 1;
  return Math.max(400, Math.floor(baseInterval * (1 - speedBonus)));
}

// ── Upgrade helpers ────────────────────────────────────────────────────

const ALL_UPGRADES = getAllUpgrades();

function getUpgradeMultiplier(target) {
  let sum = 0;
  for (const u of ALL_UPGRADES) {
    if (u.effect.type === 'multiplier' && u.effect.target === target) {
      const lvl = player.upgradeLevels[u.id] || 0;
      sum += lvl * u.effect.valuePerLevel;
    }
  }
  return 1 + sum;
}

function getUpgradeFlatBonus(target) {
  let sum = 0;
  for (const u of ALL_UPGRADES) {
    if (u.effect.type === 'flat' && u.effect.target === target) {
      const lvl = player.upgradeLevels[u.id] || 0;
      sum += lvl * u.effect.valuePerLevel;
    }
  }
  return sum;
}

function purchaseUpgrade(upgradeId) {
  const u = ALL_UPGRADES.find(u => u.id === upgradeId);
  if (!u) return false;
  const lvl = player.upgradeLevels[u.id] || 0;
  if (lvl >= u.maxLevel) return false;
  if (u.currency !== 'gold') return false;
  const cost = u.costFormula(lvl);
  if (player.gold < cost) return false;
  player.gold -= cost;
  player.upgradeLevels[u.id] = lvl + 1;
  // Apply flat stat bonus immediately
  if (u.effect.type === 'flat' && ['str', 'def', 'hp', 'regen'].includes(u.effect.target)) {
    player[u.effect.target] += u.effect.valuePerLevel;
  }
  return true;
}

// Priority: battle_hardening > auto_attack_speed > gold_find > sharpen_blade
const UPGRADE_PRIORITY = ['battle_hardening', 'auto_attack_speed', 'gold_find', 'sharpen_blade'];

function buyUpgrades() {
  let bought = true;
  while (bought) {
    bought = false;
    for (const uid of UPGRADE_PRIORITY) {
      if (purchaseUpgrade(uid)) bought = true;
    }
  }
}

// ── Combat Math ────────────────────────────────────────────────────────

function playerDamage(enemyDef) {
  const str = getEffectiveStr();
  return COMBAT_V2.playerDamage(str, enemyDef);
}

function enemyDamage(atk, armorPen) {
  const def = getEffectiveDef();
  return COMBAT_V2.enemyDamage(atk, def, armorPen);
}

/**
 * Compute TTK (time to kill enemy) and TTD (time to die) for a given enemy.
 * Returns { ttk, ttd, survivalRatio }.
 */
function combatStats(enemyHp, enemyAtk, enemyAtkSpeed, enemyDef, enemyArmorPen, enemyDot, clickRate = 0) {
  // Player DPS
  const dmgPerHit = playerDamage(enemyDef);
  const atkInterval = getAutoAttackInterval() / 1000; // seconds
  const autoDps = dmgPerHit / atkInterval;

  // Click DPS (active play, e.g. boss fights)
  const clickDmgMult = getUpgradeMultiplier('clickDamage');
  const clickDps = clickRate > 0 ? dmgPerHit * clickDmgMult * clickRate : 0;
  const playerDps = autoDps + clickDps;

  // Time to kill
  const ttk = enemyHp / playerDps;

  // Enemy DPS
  const dmgPerEnemyHit = enemyDamage(enemyAtk, enemyArmorPen);
  const enemyInterval = Math.max(0.4, 2 / enemyAtkSpeed);
  const enemyDps = dmgPerEnemyHit / enemyInterval;

  // DoT is flat, bypasses defense
  const dotDps = enemyDot || 0;
  const totalEnemyDps = enemyDps + dotDps;

  // Effective HP = actual HP + regen over the fight
  const maxHp = getEffectiveMaxHp();
  const regen = getEffectiveRegen();

  // Net DPS taken
  const netDps = Math.max(totalEnemyDps - regen, 0.01);

  // Time to die
  const ttd = maxHp / netDps;

  return {
    ttk: Math.round(ttk * 100) / 100,
    ttd: Math.round(ttd * 100) / 100,
    survivalRatio: Math.round((ttd / ttk) * 100) / 100,
    playerDps: Math.round(playerDps * 10) / 10,
    enemyDps: Math.round(totalEnemyDps * 10) / 10,
  };
}

// ── Gear Equipping ─────────────────────────────────────────────────────

/** Get best common item for a given equip slot available at globalZone. */
function getBestCommonItem(equipSlotId, globalZone) {
  const itemSlot = EQUIP_TO_ITEM_SLOT[equipSlotId];
  if (!itemSlot) return null;

  const candidates = Object.values(ITEMS).filter(item =>
    item.slot === itemSlot &&
    item.rarity === 'common' &&
    globalZone >= item.zones[0] && globalZone <= item.zones[1]
  );

  if (candidates.length === 0) return null;

  // Pick best by primary stat: str for weapons, def for armor, regen for amulet
  return candidates.sort((a, b) => {
    if (itemSlot === 'weapon') return b.statBonuses.str - a.statBonuses.str;
    if (itemSlot === 'amulet') return b.statBonuses.regen - a.statBonuses.regen;
    return b.statBonuses.def - a.statBonuses.def;
  })[0];
}

function equipBestGear(globalZone) {
  for (const [slotId, unlockZone] of Object.entries(SLOT_UNLOCK_ZONES)) {
    if (globalZone < unlockZone) continue;
    const best = getBestCommonItem(slotId, globalZone);
    if (best) {
      player.equipped[slotId] = best;
    }
  }
}

// ── Zone Enemies ───────────────────────────────────────────────────────

function getEnemiesForGlobalZone(globalZone) {
  return ENEMIES.filter(e => globalZone >= e.zones[0] && globalZone <= e.zones[1]);
}

function getAreaLocalZone(globalZone) {
  for (const area of Object.values(AREAS)) {
    const end = area.zoneStart + area.zoneCount - 1;
    if (globalZone >= area.zoneStart && globalZone <= end) {
      return { areaId: area.id, localZone: globalZone - area.zoneStart + 1 };
    }
  }
  return { areaId: 1, localZone: 1 };
}

// ── Main Simulation Loop ──────────────────────────────────────────────

const results = [];
const GDD_CHECKPOINTS = {
  5: { label: 'Area 1 exit', level: 7, hp: 177, str: 25, def: 24 },
  15: { label: 'Area 2 exit', level: 18, hp: 370, str: 45, def: 46 },
  30: { label: 'Area 3 exit', level: 35, hp: 690, str: 97, def: 90 },
};

console.log('');
console.log('══════════════════════════════════════════════════════════════════════════════');
console.log('  BALANCE SIMULATION — Idle RPG Vertical Slice (Zones 1-30)');
console.log('══════════════════════════════════════════════════════════════════════════════');
console.log('');
console.log('Assumptions:');
console.log('  • Common gear only (no uncommons)');
console.log(`  • Idle for enemies, active clicking (${TUNE.bossClickRate}/s) for bosses`);
console.log('  • No crits, no prestige, no territory buffs');
console.log('  • Optimal upgrade purchasing (Battle Hardening > Atk Speed > Gold Find > Sharpen)');
console.log('  • Player grinds exactly boss threshold kills per zone');
console.log('');
console.log('Tuning overrides:');
console.log(`  • Enemy ATK ×${TUNE.enemyAtkMult}, XP ×${TUNE.enemyXpMult}, Gold ×${TUNE.goldMult}`);
console.log(`  • Boss ATK ×${TUNE.bossAtkMult}, XP ×${TUNE.bossXpMult}, Gold ×${TUNE.bossGoldMult}`);
console.log('');

for (let globalZone = 1; globalZone <= 30; globalZone++) {
  const { areaId, localZone } = getAreaLocalZone(globalZone);
  const hpScale = getZoneScaling(localZone, 'hp');
  const atkScale = getZoneScaling(localZone, 'atk');
  const goldScale = getZoneScaling(localZone, 'gold');
  const xpScale = getZoneScaling(localZone, 'xp');
  const killThreshold = getBossKillThreshold(localZone);
  const boss = BOSSES.find(b => b.zone === globalZone);
  const enemies = getEnemiesForGlobalZone(globalZone);

  // Equip best gear at zone start
  equipBestGear(globalZone);

  // Grind enemies to hit boss threshold
  if (enemies.length > 0) {
    // Average enemy stats (scaled)
    let totalHp = 0, totalAtk = 0, totalAtkSpd = 0, totalDef = 0, totalArmorPen = 0, totalDot = 0;
    let totalGold = 0, totalXp = 0;
    for (const e of enemies) {
      totalHp += Math.floor(e.hp * hpScale);
      totalAtk += Math.floor(e.attack * TUNE.enemyAtkMult * atkScale);
      totalAtkSpd += e.attackSpeed;
      totalDef += e.defense || 0;
      totalArmorPen += e.armorPen || 0;
      totalDot += e.dot || 0;
      totalGold += Math.floor(e.goldDrop * TUNE.goldMult * goldScale);
      totalXp += Math.floor(e.xpDrop * TUNE.enemyXpMult * xpScale);
    }
    const n = enemies.length;
    const avgHp = totalHp / n;
    const avgAtk = totalAtk / n;
    const avgAtkSpd = totalAtkSpd / n;
    const avgDef = totalDef / n;
    const avgArmorPen = totalArmorPen / n;
    const avgDot = totalDot / n;
    const avgGold = totalGold / n;
    const avgXp = totalXp / n;

    // Grind kills
    const goldMult = getUpgradeMultiplier('goldMultiplier');
    for (let k = 0; k < killThreshold; k++) {
      addXp(Math.floor(avgXp));
      player.gold += Math.floor(avgGold * goldMult);
    }

    // Buy upgrades after grinding
    buyUpgrades();

    // Re-equip after upgrades (level-ups may have happened)
    equipBestGear(globalZone);

    // Combat stats vs average enemy
    const enemyCombat = combatStats(avgHp, avgAtk, avgAtkSpd, avgDef, avgArmorPen, avgDot);

    // Add boss XP and gold
    if (boss) {
      addXp(Math.floor(boss.xpDrop * TUNE.bossXpMult));
      player.gold += Math.floor(boss.goldDrop * TUNE.bossGoldMult * getUpgradeMultiplier('goldMultiplier'));
      buyUpgrades();
      equipBestGear(globalZone);
    }

    // Boss combat stats
    let bossResult = null;
    if (boss) {
      bossResult = combatStats(
        boss.hp, Math.floor(boss.attack * TUNE.bossAtkMult), boss.attackSpeed,
        boss.defense || 0, boss.armorPen || 0, boss.dot || 0,
        TUNE.bossClickRate,
      );
    }

    const row = {
      zone: globalZone,
      area: areaId,
      localZone,
      level: player.level,
      str: getEffectiveStr(),
      def: getEffectiveDef(),
      hp: getEffectiveMaxHp(),
      regen: Math.round(getEffectiveRegen() * 10) / 10,
      atkSpd: Math.round(getAtkSpeed() * 100) / 100,
      atkInterval: getAutoAttackInterval(),
      enemyTTK: enemyCombat.ttk,
      enemyTTD: enemyCombat.ttd,
      enemySurvival: enemyCombat.survivalRatio,
      bossName: boss ? boss.name : '-',
      bossTTK: bossResult ? bossResult.ttk : '-',
      bossTTD: bossResult ? bossResult.ttd : '-',
      bossWin: bossResult ? (bossResult.survivalRatio >= 1 ? 'Y' : 'N') : '-',
      bossSurvival: bossResult ? bossResult.survivalRatio : '-',
      gold: Math.floor(player.gold),
      upgrades: { ...player.upgradeLevels },
    };

    results.push(row);
  }
}

// ── Output ─────────────────────────────────────────────────────────────

// Zone table
const header = 'Zone | Lvl | STR  | DEF  |  HP  | Regen | AtkMs | eTTK  | eTTD  | eSurv | Boss                       | bTTK   | bTTD   | Win | bSurv | Gold';
const sep    = '-----|-----|------|------|------|-------|-------|-------|-------|-------|----------------------------|--------|--------|-----|-------|------';
console.log(header);
console.log(sep);

for (const r of results) {
  const bName = typeof r.bossName === 'string' ? r.bossName.padEnd(26) : '-'.padEnd(26);
  const line = [
    String(r.zone).padStart(4),
    String(r.level).padStart(3),
    String(r.str).padStart(4),
    String(r.def).padStart(4),
    String(r.hp).padStart(4),
    String(r.regen).padStart(5),
    String(r.atkInterval).padStart(5),
    String(r.enemyTTK).padStart(5),
    String(r.enemyTTD).padStart(5),
    String(r.enemySurvival).padStart(5),
    ' ' + bName,
    String(r.bossTTK).padStart(6),
    String(r.bossTTD).padStart(6),
    String(r.bossWin).padStart(3),
    String(r.bossSurvival).padStart(5),
    String(r.gold).padStart(5),
  ].join(' | ');
  console.log(line);
}

// ── GDD Checkpoint Comparison ──────────────────────────────────────────
console.log('');
console.log('══════════════════════════════════════════════════════════════════════════════');
console.log('  GDD CHECKPOINT COMPARISON');
console.log('══════════════════════════════════════════════════════════════════════════════');

for (const [zone, cp] of Object.entries(GDD_CHECKPOINTS)) {
  const r = results.find(r => r.zone === parseInt(zone));
  if (!r) continue;
  console.log('');
  console.log(`  Zone ${zone}: ${cp.label}`);
  console.log(`    Level:  actual=${r.level}  target~${cp.level}  (${pctDiff(r.level, cp.level)})`);
  console.log(`    STR:    actual=${r.str}  target~${cp.str}  (${pctDiff(r.str, cp.str)})`);
  console.log(`    DEF:    actual=${r.def}  target~${cp.def}  (${pctDiff(r.def, cp.def)})`);
  console.log(`    HP:     actual=${r.hp}  target~${cp.hp}  (${pctDiff(r.hp, cp.hp)})`);
}

// ── Boss Summary ───────────────────────────────────────────────────────
console.log('');
console.log('══════════════════════════════════════════════════════════════════════════════');
console.log('  BOSS PASS/FAIL SUMMARY');
console.log('══════════════════════════════════════════════════════════════════════════════');

let passCount = 0, failCount = 0;
for (const r of results) {
  if (r.bossWin === 'Y') passCount++;
  else if (r.bossWin === 'N') failCount++;
}
console.log(`  Passed: ${passCount}/30    Failed: ${failCount}/30`);
console.log('');

const failures = results.filter(r => r.bossWin === 'N');
if (failures.length > 0) {
  console.log('  FAILED BOSSES:');
  for (const f of failures) {
    console.log(`    Zone ${f.zone}: ${f.bossName} — survival ratio ${f.bossSurvival}x (need >=1.0)`);
  }
}

// Final boss detail
const finalBoss = results.find(r => r.zone === 30);
if (finalBoss) {
  console.log('');
  console.log(`  FINAL BOSS: ${finalBoss.bossName}`);
  console.log(`    Survival ratio: ${finalBoss.bossSurvival}x  (target: 1.1-2.0x tight win)`);
  console.log(`    TTK: ${finalBoss.bossTTK}s  TTD: ${finalBoss.bossTTD}s`);
  console.log(`    Player: Lv${finalBoss.level} STR=${finalBoss.str} DEF=${finalBoss.def} HP=${finalBoss.hp} Regen=${finalBoss.regen}`);
}

// ── Upgrade Levels ─────────────────────────────────────────────────────
console.log('');
console.log('  FINAL UPGRADE LEVELS:');
for (const uid of UPGRADE_PRIORITY) {
  console.log(`    ${uid}: ${player.upgradeLevels[uid] || 0}`);
}

console.log('');
console.log('══════════════════════════════════════════════════════════════════════════════');

function pctDiff(actual, target) {
  const diff = ((actual - target) / target * 100).toFixed(1);
  return diff >= 0 ? `+${diff}%` : `${diff}%`;
}

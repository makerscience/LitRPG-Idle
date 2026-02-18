#!/usr/bin/env node
// Balance Simulation — standalone Node ESM script.
// Usage: npm run balance:sim

import { ENEMIES } from '../src/data/enemies.js';
import { BOSSES } from '../src/data/bosses.js';
import { ITEMS } from '../src/data/items.js';
import { AREAS, getZoneScaling, getBossKillThreshold } from '../src/data/areas.js';
import { PROGRESSION_V2, COMBAT_V2 } from '../src/config.js';
import { getAllUpgrades } from '../src/data/upgrades.js';

const TUNE = {
  enemyAtkMult: 1.0,
  enemyXpMult: 1.0,
  bossAtkMult: 1.0,
  bossXpMult: 1.0,
  goldMult: 1.0,
  bossGoldMult: 1.0,
  bossClickRate: 5,
};

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
const ALL_UPGRADES = getAllUpgrades();
const UPGRADE_PRIORITY = ['battle_hardening', 'auto_attack_speed', 'gold_find', 'sharpen_blade'];

function createPlayer() {
  return {
    level: 1,
    xp: 0,
    str: STARTING.str,
    def: STARTING.def,
    hp: STARTING.hp,
    regen: STARTING.regen,
    agi: STARTING.agi,
    gold: 0,
    equipped: {},
    upgradeLevels: {},
  };
}

function xpForLevel(level) {
  return PROGRESSION_V2.xpForLevel(level);
}

function levelUp(player) {
  player.level++;
  player.str += GROWTH.str;
  player.def += GROWTH.def;
  player.hp += GROWTH.hp;
  player.regen += GROWTH.regen;
  player.agi += GROWTH.agi;
}

function addXp(player, amount) {
  player.xp += amount;
  while (player.xp >= xpForLevel(player.level)) {
    player.xp -= xpForLevel(player.level);
    levelUp(player);
  }
}

function getUpgradeMultiplier(player, target) {
  let sum = 0;
  for (const u of ALL_UPGRADES) {
    if (u.effect.type === 'multiplier' && u.effect.target === target) {
      const lvl = player.upgradeLevels[u.id] || 0;
      sum += lvl * u.effect.valuePerLevel;
    }
  }
  return 1 + sum;
}

function purchaseUpgrade(player, upgradeId) {
  const u = ALL_UPGRADES.find(x => x.id === upgradeId);
  if (!u) return false;
  const lvl = player.upgradeLevels[u.id] || 0;
  if (lvl >= u.maxLevel) return false;
  if (u.currency !== 'gold') return false;
  const cost = u.costFormula(lvl);
  if (player.gold < cost) return false;
  player.gold -= cost;
  player.upgradeLevels[u.id] = lvl + 1;
  if (u.effect.type === 'flat' && ['str', 'def', 'hp', 'regen', 'agi'].includes(u.effect.target)) {
    player[u.effect.target] += u.effect.valuePerLevel;
  }
  return true;
}

function buyUpgrades(player) {
  let bought = true;
  while (bought) {
    bought = false;
    for (const uid of UPGRADE_PRIORITY) {
      if (purchaseUpgrade(player, uid)) bought = true;
    }
  }
}

function getEquipStatSum(player, statKey) {
  let sum = 0;
  for (const item of Object.values(player.equipped)) {
    if (item && item.statBonuses[statKey]) sum += item.statBonuses[statKey];
  }
  return sum;
}

function getEffectiveStr(player) { return player.str + getEquipStatSum(player, 'str'); }
function getEffectiveDef(player) { return player.def + getEquipStatSum(player, 'def'); }
function getEffectiveMaxHp(player) { return player.hp + getEquipStatSum(player, 'hp'); }
function getEffectiveRegen(player) { return player.regen + getEquipStatSum(player, 'regen'); }
function getEffectiveAgi(player) { return player.agi + getEquipStatSum(player, 'agi'); }
function getEvadeRating(player) { return COMBAT_V2.evadeRating(getEffectiveAgi(player)); }

function getAtkSpeed(player) {
  return COMBAT_V2.playerBaseAtkSpeed + getEquipStatSum(player, 'atkSpeed');
}

function getAutoAttackInterval(player) {
  const speed = getAtkSpeed(player);
  const baseInterval = 2000 / speed;
  const speedBonus = getUpgradeMultiplier(player, 'autoAttackSpeed') - 1;
  return Math.max(400, Math.floor(baseInterval * (1 - speedBonus)));
}

function playerDamage(player, enemyDef) {
  return COMBAT_V2.playerDamage(getEffectiveStr(player), enemyDef);
}

function enemyDamage(player, atk, armorPen) {
  return COMBAT_V2.enemyDamage(atk, getEffectiveDef(player), armorPen);
}

function combatStats(player, enemyHp, enemyAtk, enemyAtkSpeed, enemyDef, enemyArmorPen, enemyDot, enemyAccuracy, clickRate = 0) {
  const dmgPerHit = playerDamage(player, enemyDef);
  const atkInterval = getAutoAttackInterval(player) / 1000;
  const autoDps = dmgPerHit / atkInterval;
  const clickDmgMult = getUpgradeMultiplier(player, 'clickDamage');
  const clickDps = clickRate > 0 ? dmgPerHit * clickDmgMult * clickRate : 0;
  const playerDps = autoDps + clickDps;
  const ttk = enemyHp / Math.max(playerDps, 0.01);

  const dmgPerEnemyHit = enemyDamage(player, enemyAtk, enemyArmorPen);
  const enemyInterval = Math.max(0.4, 2 / enemyAtkSpeed);
  const rawEnemyDps = dmgPerEnemyHit / enemyInterval;
  const hitChance = COMBAT_V2.enemyHitChance(enemyAccuracy || 80, getEvadeRating(player));
  const dotDps = enemyDot || 0;
  const totalEnemyDps = (rawEnemyDps * hitChance) + dotDps;

  const maxHp = getEffectiveMaxHp(player);
  const regen = getEffectiveRegen(player);
  const netDps = Math.max(totalEnemyDps - regen, 0.01);
  const ttd = maxHp / netDps;

  return {
    ttk: Math.round(ttk * 100) / 100,
    ttd: Math.round(ttd * 100) / 100,
    survivalRatio: Math.round((ttd / ttk) * 100) / 100,
    hitChance: Math.round(hitChance * 1000) / 1000,
    dodgeChance: Math.round((1 - hitChance) * 1000) / 1000,
  };
}

function getArmorScore(item, policy) {
  const b = item.statBonuses;
  if (policy === 'agi') {
    return (b.agi || 0) * 2 + (b.atkSpeed || 0) * 25 + (b.def || 0) * 0.5 + (b.hp || 0) * 0.05 + (b.regen || 0) * 4;
  }
  return (b.def || 0) * 2 + (b.hp || 0) * 0.1 + (b.regen || 0) * 5 + (b.agi || 0) * 0.25;
}

function getBestCommonItem(equipSlotId, globalZone, policy) {
  const itemSlot = EQUIP_TO_ITEM_SLOT[equipSlotId];
  if (!itemSlot) return null;

  const candidates = Object.values(ITEMS).filter(item =>
    item.slot === itemSlot &&
    globalZone >= item.zones[0] && globalZone <= item.zones[1]
  );

  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => {
    if (itemSlot === 'weapon') return (b.statBonuses.str || 0) - (a.statBonuses.str || 0);
    if (itemSlot === 'amulet') {
      if (policy === 'agi') return (b.statBonuses.agi || 0) - (a.statBonuses.agi || 0) || (b.statBonuses.regen || 0) - (a.statBonuses.regen || 0);
      return (b.statBonuses.regen || 0) - (a.statBonuses.regen || 0) || (b.statBonuses.def || 0) - (a.statBonuses.def || 0);
    }
    return getArmorScore(b, policy) - getArmorScore(a, policy);
  })[0];
}

function equipBestGear(player, globalZone, policy) {
  for (const [slotId, unlockZone] of Object.entries(SLOT_UNLOCK_ZONES)) {
    if (globalZone < unlockZone) continue;
    const best = getBestCommonItem(slotId, globalZone, policy);
    if (best) player.equipped[slotId] = best;
  }
}

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

function runSimulation(policyName, gearPolicy) {
  const player = createPlayer();
  const results = [];

  for (let globalZone = 1; globalZone <= 30; globalZone++) {
    const { areaId, localZone } = getAreaLocalZone(globalZone);
    const hpScale = getZoneScaling(localZone, 'hp');
    const atkScale = getZoneScaling(localZone, 'atk');
    const goldScale = getZoneScaling(localZone, 'gold');
    const xpScale = getZoneScaling(localZone, 'xp');
    const killThreshold = getBossKillThreshold(localZone);
    const boss = BOSSES.find(b => b.zone === globalZone);
    const enemies = getEnemiesForGlobalZone(globalZone);

    equipBestGear(player, globalZone, gearPolicy);
    if (enemies.length === 0) continue;

    let totalHp = 0, totalAtk = 0, totalAtkSpd = 0, totalDef = 0, totalArmorPen = 0, totalDot = 0, totalAcc = 0;
    let totalGold = 0, totalXp = 0;
    for (const e of enemies) {
      totalHp += Math.floor(e.hp * hpScale);
      totalAtk += Math.floor(e.attack * TUNE.enemyAtkMult * atkScale);
      totalAtkSpd += e.attackSpeed;
      totalDef += e.defense || 0;
      totalArmorPen += e.armorPen || 0;
      totalDot += e.dot || 0;
      totalAcc += e.accuracy || 80;
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
    const avgAcc = totalAcc / n;
    const avgGold = totalGold / n;
    const avgXp = totalXp / n;

    const goldMult = getUpgradeMultiplier(player, 'goldMultiplier');
    for (let k = 0; k < killThreshold; k++) {
      addXp(player, Math.floor(avgXp));
      player.gold += Math.floor(avgGold * goldMult);
    }

    buyUpgrades(player);
    equipBestGear(player, globalZone, gearPolicy);

    const enemyCombat = combatStats(player, avgHp, avgAtk, avgAtkSpd, avgDef, avgArmorPen, avgDot, avgAcc);

    if (boss) {
      addXp(player, Math.floor(boss.xpDrop * TUNE.bossXpMult));
      player.gold += Math.floor(boss.goldDrop * TUNE.bossGoldMult * getUpgradeMultiplier(player, 'goldMultiplier'));
      buyUpgrades(player);
      equipBestGear(player, globalZone, gearPolicy);
    }

    let bossResult = null;
    if (boss) {
      bossResult = combatStats(
        player,
        boss.hp,
        Math.floor(boss.attack * TUNE.bossAtkMult),
        boss.attackSpeed,
        boss.defense || 0,
        boss.armorPen || 0,
        boss.dot || 0,
        boss.accuracy || 90,
        TUNE.bossClickRate,
      );
    }

    results.push({
      policy: policyName,
      zone: globalZone,
      level: player.level,
      str: getEffectiveStr(player),
      def: getEffectiveDef(player),
      agi: getEffectiveAgi(player),
      evade: Math.round(getEvadeRating(player)),
      enemyHitPct: Math.round(enemyCombat.hitChance * 1000) / 10,
      enemyDodgePct: Math.round(enemyCombat.dodgeChance * 1000) / 10,
      enemySurvival: enemyCombat.survivalRatio,
      bossName: boss ? boss.name : '-',
      bossSurvival: bossResult ? bossResult.survivalRatio : '-',
      bossWin: bossResult ? (bossResult.survivalRatio >= 1 ? 'Y' : 'N') : '-',
    });
  }

  return results;
}

function printPolicyTable(policyName, rows) {
  console.log('');
  console.log(`Policy: ${policyName}`);
  console.log('Zone | Lvl | STR | DEF | AGI | EVA | Hit% | Dod% | eSurv | Boss                      | bSurv | Win');
  console.log('-----|-----|-----|-----|-----|-----|------|------|-------|---------------------------|-------|----');
  for (const r of rows) {
    const bossName = typeof r.bossName === 'string' ? r.bossName.padEnd(25) : '-'.padEnd(25);
    console.log([
      String(r.zone).padStart(4),
      String(r.level).padStart(3),
      String(r.str).padStart(3),
      String(r.def).padStart(3),
      String(r.agi).padStart(3),
      String(r.evade).padStart(3),
      String(r.enemyHitPct.toFixed(1)).padStart(5),
      String(r.enemyDodgePct.toFixed(1)).padStart(5),
      String(r.enemySurvival).padStart(5),
      ` ${bossName}`,
      String(r.bossSurvival).padStart(5),
      String(r.bossWin).padStart(3),
    ].join(' | '));
  }
}

function printSummary(policyName, rows) {
  const bosses = rows.filter(r => r.bossWin === 'Y' || r.bossWin === 'N');
  const pass = bosses.filter(r => r.bossWin === 'Y').length;
  const fail = bosses.length - pass;
  const z1 = rows.find(r => r.zone === 1);
  const z5 = rows.find(r => r.zone === 5);
  const z10 = rows.find(r => r.zone === 10);
  console.log('');
  console.log(`Summary (${policyName})`);
  console.log(`  Boss passes: ${pass}/${bosses.length}  fails: ${fail}`);
  if (z1) console.log(`  Zone 1 dodge: ${z1.enemyDodgePct.toFixed(1)}%`);
  if (z5) console.log(`  Zone 5 dodge: ${z5.enemyDodgePct.toFixed(1)}%`);
  if (z10) console.log(`  Zone 10 dodge: ${z10.enemyDodgePct.toFixed(1)}%`);
}

const defRows = runSimulation('DEF', 'def');
const agiRows = runSimulation('AGI', 'agi');

console.log('');
console.log('============================================================');
console.log(' BALANCE SIMULATION (Accuracy vs Agility)');
console.log('============================================================');
console.log('Assumptions: best available authored gear, no prestige/territory, active boss clicking.');

printPolicyTable('DEF-priority gear', defRows);
printSummary('DEF-priority gear', defRows);

printPolicyTable('AGI-priority gear', agiRows);
printSummary('AGI-priority gear', agiRows);

const defFinal = defRows.find(r => r.zone === 30);
const agiFinal = agiRows.find(r => r.zone === 30);
if (defFinal && agiFinal) {
  console.log('');
  console.log('Final Zone Comparison (Zone 30)');
  console.log(`  DEF policy: dodge=${defFinal.enemyDodgePct.toFixed(1)}% bossSurv=${defFinal.bossSurvival}`);
  console.log(`  AGI policy: dodge=${agiFinal.enemyDodgePct.toFixed(1)}% bossSurv=${agiFinal.bossSurvival}`);
}

console.log('');

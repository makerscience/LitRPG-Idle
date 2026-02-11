// ComputedStats — pure functions that compute derived stats from state + system queries.
// No state mutation, no events — just math. Eliminates duplicate formulas across systems.

import Store from './Store.js';
import UpgradeManager from './UpgradeManager.js';
import TerritoryManager from './TerritoryManager.js';
import InventorySystem from './InventorySystem.js';
import { D } from './BigNum.js';
import { DAMAGE_FORMULAS, COMBAT } from '../config.js';

/** Effective STR after territory buffs. */
export function getEffectiveStr() {
  const state = Store.getState();
  return state.playerStats.str + TerritoryManager.getBuffValue('flatStr');
}

/** Effective VIT after territory buffs. */
export function getEffectiveVit() {
  const state = Store.getState();
  return state.playerStats.vit + TerritoryManager.getBuffValue('flatVit');
}

/** Max HP after all buffs (VIT * hpPerVit * territory maxHp multiplier). */
export function getEffectiveMaxHp() {
  const effectiveVit = getEffectiveVit();
  return D(effectiveVit * COMBAT.playerHpPerVit).times(TerritoryManager.getBuffMultiplier('maxHp'));
}

/** Base damage from STR formula + weapon, before multipliers. */
export function getBaseDamage() {
  const str = getEffectiveStr();
  const wpnDmg = InventorySystem.getEquippedWeaponDamage();
  return DAMAGE_FORMULAS.mortal(str, wpnDmg);
}

/** Effective damage per hit after all multipliers (prestige, upgrades, territory). */
export function getEffectiveDamage() {
  const state = Store.getState();
  const baseDmg = getBaseDamage();
  const clickDmgMult = UpgradeManager.getMultiplier('clickDamage');
  const prestigeMult = state.prestigeMultiplier;
  const territoryDmgMult = TerritoryManager.getBuffMultiplier('baseDamage');
  return Math.floor(baseDmg * clickDmgMult * prestigeMult * territoryDmgMult);
}

/** Crit chance from base + upgrades + territory. */
export function getCritChance() {
  return COMBAT.critChance +
    UpgradeManager.getFlatBonus('critChance') +
    TerritoryManager.getBuffValue('critChance');
}

/** Crit multiplier (10x after crack, normal otherwise). */
export function getCritMultiplier() {
  const state = Store.getState();
  return state.flags.crackTriggered ? 10 : COMBAT.critMultiplier;
}

/** Auto-attack interval in ms (delegates to UpgradeManager which includes territory). */
export function getAutoAttackInterval() {
  return UpgradeManager.getAutoAttackInterval();
}

/** Total gold multiplier from upgrades, prestige, and territory. */
export function getGoldMultiplier() {
  const state = Store.getState();
  return UpgradeManager.getMultiplier('goldMultiplier') *
    state.prestigeMultiplier *
    TerritoryManager.getBuffMultiplier('goldGain');
}

/** Total XP multiplier from prestige and territory. */
export function getXpMultiplier() {
  const state = Store.getState();
  return state.prestigeMultiplier * TerritoryManager.getBuffMultiplier('xpGain');
}

/** HP regen per second after all buffs. */
export function getHpRegen() {
  const maxHp = getEffectiveMaxHp();
  const regenMult = TerritoryManager.getBuffMultiplier('hpRegen');
  return maxHp.times(COMBAT.playerRegenPercent).times(regenMult);
}

/** Full computed stats object for UI display. */
export function getAllStats() {
  const state = Store.getState();
  return {
    effectiveStr: getEffectiveStr(),
    effectiveVit: getEffectiveVit(),
    effectiveMaxHp: getEffectiveMaxHp(),
    baseDamage: getBaseDamage(),
    effectiveDamage: getEffectiveDamage(),
    critChance: getCritChance(),
    critMultiplier: getCritMultiplier(),
    autoAttackInterval: getAutoAttackInterval(),
    goldMultiplier: getGoldMultiplier(),
    xpMultiplier: getXpMultiplier(),
    hpRegen: getHpRegen(),
    weaponDamage: InventorySystem.getEquippedWeaponDamage(),
    prestigeMultiplier: state.prestigeMultiplier,
  };
}

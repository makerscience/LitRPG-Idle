// UpgradeManager — purchase logic + multiplier aggregation for upgrades.
// Pure data-reader: CombatEngine applies the multipliers during damage computation.

import Store from './Store.js';
import { D } from './BigNum.js';
import { emit, EVENTS } from '../events.js';
import { COMBAT_V2 } from '../config.js';
import { getUpgrade, getAllUpgrades } from '../data/upgrades.js';
import TerritoryManager from './TerritoryManager.js';

const RESPEC_UNLOCK_LEVEL = 5;
const RESPEC_BASE_GOLD_COST = 300;
const RESPEC_GROWTH_PER_LEVEL = 1.2;

const FLAT_STAT_TARGETS = new Set(['str', 'def', 'hp', 'regen', 'agi']);

function getSkillPointUpgrades() {
  return getAllUpgrades().filter((u) => u.currency === 'skillPoints');
}

function getSpentCostForUpgrade(upgrade, level) {
  let total = 0;
  const capped = Math.max(0, Math.floor(level || 0));
  for (let i = 0; i < capped; i++) {
    total += Number(upgrade.costFormula(i)) || 0;
  }
  return total;
}

const UpgradeManager = {
  getLevel(upgradeId) {
    const state = Store.getState();
    return state.purchasedUpgrades[upgradeId] || 0;
  },

  canPurchase(upgradeId) {
    const upgrade = getUpgrade(upgradeId);
    if (!upgrade) return false;

    const level = this.getLevel(upgradeId);
    if (level >= upgrade.maxLevel) return false;

    if (upgrade.requires && this.getLevel(upgrade.requires) < 1) return false;

    if (upgrade.requiresFlag) {
      const state = Store.getState();
      if (!state.flags[upgrade.requiresFlag]) return false;
    }

    const cost = D(upgrade.costFormula(level));
    const state = Store.getState();

    if (upgrade.currency === 'gold') {
      return state.gold.gte(cost);
    }
    if (upgrade.currency === 'skillPoints') {
      return state.skillPoints >= upgrade.costFormula(level);
    }
    if (upgrade.currency === 'glitchFragments') {
      return state.glitchFragments.gte(cost);
    }
    return false;
  },

  getCost(upgradeId) {
    const upgrade = getUpgrade(upgradeId);
    if (!upgrade) return 0;
    const level = this.getLevel(upgradeId);
    return upgrade.costFormula(level);
  },

  purchase(upgradeId) {
    if (!this.canPurchase(upgradeId)) return false;

    const upgrade = getUpgrade(upgradeId);
    const cost = upgrade.costFormula(this.getLevel(upgradeId));

    // Deduct currency
    if (upgrade.currency === 'gold') {
      Store.spendGold(cost);
    } else if (upgrade.currency === 'skillPoints') {
      if (!Store.spendSkillPoints(cost)) return false;
    } else if (upgrade.currency === 'glitchFragments') {
      Store.spendFragments(cost);
    }

    // Increment level
    const newLevel = Store.upgradeLevel(upgradeId);

    // Apply immediate flat stat bonus (e.g. STR)
    if (upgrade.effect.type === 'flat' && ['str', 'def', 'hp', 'regen', 'agi'].includes(upgrade.effect.target)) {
      Store.addFlatStat(upgrade.effect.target, upgrade.effect.valuePerLevel);
    }

    emit(EVENTS.UPG_PURCHASED, {
      upgradeId,
      name: upgrade.name,
      level: newLevel,
      category: upgrade.category,
    });

    return true;
  },

  /** Aggregate all multiplier-type upgrades for a given target. Returns 1 + sum. */
  getMultiplier(target) {
    let sum = 0;
    for (const upgrade of getAllUpgrades()) {
      if (upgrade.effect.type === 'multiplier' && upgrade.effect.target === target) {
        const level = this.getLevel(upgrade.id);
        sum += level * upgrade.effect.valuePerLevel;
      }
    }
    return 1 + sum;
  },

  /** Aggregate all flat-type upgrades for a given target. */
  getFlatBonus(target) {
    let sum = 0;
    for (const upgrade of getAllUpgrades()) {
      if (upgrade.effect.type === 'flat' && upgrade.effect.target === target) {
        const level = this.getLevel(upgrade.id);
        sum += level * upgrade.effect.valuePerLevel;
      }
    }
    return sum;
  },

  /** Computed auto-attack interval, floored at 200ms. */
  getAutoAttackInterval() {
    const speedBonus = this.getMultiplier('autoAttackSpeed') - 1; // strip the base 1
    const territoryBonus = TerritoryManager.getBuffValue('autoAttackSpeed');
    const baseInterval = Math.floor(1000 / COMBAT_V2.playerBaseAtkSpeed);
    const interval = baseInterval * (1 - speedBonus - territoryBonus);
    return Math.max(200, interval);
  },

  hasUpgrade(upgradeId) {
    return this.getLevel(upgradeId) >= 1;
  },

  isVisible(upgradeId) {
    const upgrade = getUpgrade(upgradeId);
    if (!upgrade) return false;
    if (!upgrade.requiresFlag) return true;
    return !!Store.getState().flags[upgrade.requiresFlag];
  },

  getSkillRespecUnlockLevel() {
    return RESPEC_UNLOCK_LEVEL;
  },

  isSkillRespecUnlocked(state = Store.getState()) {
    const level = state?.playerStats?.level || 1;
    const tutorialDone = !!state?.flags?.enhanceTutorialCompleted;
    return level >= RESPEC_UNLOCK_LEVEL && tutorialDone;
  },

  getSkillRespecCost(level = Store.getState().playerStats.level, state = Store.getState()) {
    const playerLevel = Math.max(1, Math.floor(Number(level) || 1));
    const tutorialDone = !!state?.flags?.enhanceTutorialCompleted;
    if (playerLevel < RESPEC_UNLOCK_LEVEL || !tutorialDone) return Infinity;
    const steps = playerLevel - RESPEC_UNLOCK_LEVEL;
    return Math.floor(RESPEC_BASE_GOLD_COST * (RESPEC_GROWTH_PER_LEVEL ** steps));
  },

  getSkillRespecRefundPoints() {
    const state = Store.getState();
    let refund = 0;
    for (const upgrade of getSkillPointUpgrades()) {
      const level = state.purchasedUpgrades[upgrade.id] || 0;
      if (level <= 0) continue;
      refund += getSpentCostForUpgrade(upgrade, level);
    }
    return refund;
  },

  canRespecSkills() {
    const state = Store.getState();
    if (!this.isSkillRespecUnlocked(state)) return false;
    const refund = this.getSkillRespecRefundPoints();
    if (refund <= 0) return false;
    const cost = this.getSkillRespecCost(state.playerStats.level);
    return Number.isFinite(cost) && state.gold.gte(D(cost));
  },

  respecSkills() {
    const state = Store.getState();
    if (!this.isSkillRespecUnlocked(state)) return false;

    const refund = this.getSkillRespecRefundPoints();
    if (refund <= 0) return false;

    const cost = this.getSkillRespecCost(state.playerStats.level);
    if (!Number.isFinite(cost) || !state.gold.gte(D(cost))) return false;

    const currentPurchased = { ...state.purchasedUpgrades };
    const nextPurchased = { ...currentPurchased };

    for (const upgrade of getSkillPointUpgrades()) {
      const level = currentPurchased[upgrade.id] || 0;
      if (level <= 0) continue;

      if (upgrade.effect?.type === 'flat' && FLAT_STAT_TARGETS.has(upgrade.effect.target)) {
        const delta = (Number(upgrade.effect.valuePerLevel) || 0) * level;
        if (delta !== 0) {
          Store.addFlatStat(upgrade.effect.target, -delta);
        }
      }

      delete nextPurchased[upgrade.id];
    }

    Store.setPurchasedUpgrades(nextPurchased);
    Store.spendGold(cost);
    Store.addSkillPoints(refund);
    Store.clampPlayerHpToMax();

    emit(EVENTS.UPG_PURCHASED, {
      upgradeId: 'skill_respec',
      name: 'Skill Respec',
      level: 1,
      category: 'system',
    });

    return true;
  },
};

export default UpgradeManager;

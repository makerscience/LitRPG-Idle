// SystemLog — scrollable green monospace log in the right 320px panel.
// Uses ScrollableLog base class for container/mask/scroll handling.

import ScrollableLog from './ScrollableLog.js';
import { on, EVENTS } from '../events.js';
import { format } from '../systems/BigNum.js';
import { LAYOUT, COLORS, UI, LOOT, PRESTIGE } from '../config.js';
import { getItem, getScaledItem } from '../data/items.js';
import { getUpgrade } from '../data/upgrades.js';
import { getCheat } from '../data/cheats.js';
import { getArea } from '../data/areas.js';
import OfflineProgress from '../systems/OfflineProgress.js';
import Store from '../systems/Store.js';

export default class SystemLog extends ScrollableLog {
  constructor(scene) {
    const lp = LAYOUT.logPanel;
    super(scene, {
      x: lp.x, y: lp.y, width: lp.w, height: lp.h,
      maxLines: UI.logMaxLines,
      headerText: 'SYSTEM LOG',
    });

    this._currentEnemyName = '';

    // Subscribe to events
    this._unsubs.push(on(EVENTS.COMBAT_ENEMY_SPAWNED, (data) => {
      this._currentEnemyName = data.name;
      if (data.armorPen > 0) {
        const penPct = Math.round(data.armorPen * 100);
        this.addLine(`\u26A0 ${data.name} has ${penPct}% Armor Penetration`, 'warning');
      }
      if (data.dot) {
        this.addLine(`\u26A0 ${data.name} deals ${data.dot} dmg/sec (bypasses defense)`, 'warning');
      }
    }));

    this._unsubs.push(on(EVENTS.COMBAT_DOT_TICK, (data) => {
      if (data.tickNumber % 5 === 0) {
        this.addLine(`Blight: -${data.damage} HP`, 'dot');
      }
    }));


    this._unsubs.push(on(EVENTS.PROG_LEVEL_UP, (data) => {
      this.addLine(`LEVEL UP! You are now Lv.${data.level}`, 'levelUp');
    }));

    this._unsubs.push(on(EVENTS.WORLD_ZONE_CHANGED, (data) => {
      const areaData = data.area ? getArea(data.area) : null;
      const areaName = areaData?.name || `Area ${data.area}`;
      this.addLine(`Entered ${areaName} \u2014 Zone ${data.zone}`, 'zoneChange');
    }));

    this._unsubs.push(on(EVENTS.BOSS_DEFEATED, (data) => {
      this.addLine(`BOSS DEFEATED: ${data.name}!`, 'system');
    }));

    this._unsubs.push(on(EVENTS.AREA_BOSS_DEFEATED, (data) => {
      this.addLine(`AREA CLEARED: ${data.name}! Next area unlocked.`, 'prestige');
    }));

    this._unsubs.push(on(EVENTS.LOOT_DROPPED, (data) => {
      const item = getItem(data.itemId);
      const name = item ? item.name : data.itemId;
      const rarity = data.rarity ? data.rarity.charAt(0).toUpperCase() + data.rarity.slice(1) : 'Common';
      const countStr = data.count > 1 ? `${data.count}x ` : '';
      this.addLine(`Dropped: ${countStr}${name} (${rarity})`, 'loot', COLORS.rarity[data.rarity]);
    }));

    this._unsubs.push(on(EVENTS.INV_ITEM_EQUIPPED, (data) => {
      const scaled = getScaledItem(data.itemId);
      if (!scaled) return;
      const b = scaled.statBonuses;
      const parts = [];
      // For weapons, atk === str — show ATK only to avoid redundancy
      if (b.atk) parts.push(`+${b.atk} ATK`);
      else if (b.str) parts.push(`+${b.str} STR`);
      if (b.def) parts.push(`+${b.def} DEF`);
      if (b.hp) parts.push(`+${b.hp} HP`);
      if (b.regen) parts.push(`+${b.regen} Regen`);
      if (b.atkSpeed) parts.push(`+${b.atkSpeed} AtkSpd`);
      const statStr = parts.length > 0 ? ` [${parts.join(', ')}]` : '';
      this.addLine(`Equipped ${scaled.name}${statStr}`, 'loot');
    }));

    this._unsubs.push(on(EVENTS.INV_ITEM_SOLD, (data) => {
      const item = getItem(data.itemId);
      const name = item ? item.name : data.itemId;
      this.addLine(`Sold ${data.count}x ${name} for ${data.goldGained} Gold`, 'gold');
    }));

    this._unsubs.push(on(EVENTS.INV_FULL, () => {
      this.addLine('Inventory full!', 'default');
    }));

    this._unsubs.push(on(EVENTS.UPG_PURCHASED, (data) => {
      const upgrade = getUpgrade(data.upgradeId);
      const name = upgrade ? upgrade.name : data.upgradeId;
      this.addLine(`Purchased ${name} (Lv.${data.level})`, 'system');
    }));

    this._unsubs.push(on(EVENTS.ECON_FRAGMENTS_GAINED, (data) => {
      this.addLine(`+${format(data.amount)} Glitch Fragment`, 'loot');
    }));

    this._unsubs.push(on(EVENTS.INV_ITEM_MERGED, (data) => {
      const source = getItem(data.itemId);
      const target = getItem(data.targetItemId);
      const srcName = source ? source.name : data.itemId;
      const tgtName = target ? target.name : data.targetItemId;
      const consumed = data.merges * LOOT.mergeThreshold;
      this.addLine(`Merged ${consumed}x ${srcName} → ${data.merges}x ${tgtName}`, 'loot');
    }));

    this._unsubs.push(on(EVENTS.CHEAT_UNLOCKED, (data) => {
      const cheat = getCheat(data.cheatId);
      const name = cheat ? cheat.name : data.cheatId;
      this.addLine(`CHEAT UNLOCKED: ${name}`, 'system');
    }));

    this._unsubs.push(on(EVENTS.CHEAT_TOGGLED, (data) => {
      const cheat = getCheat(data.cheatId);
      const name = cheat ? cheat.name : data.cheatId;
      const status = data.active ? 'ACTIVATED' : 'DEACTIVATED';
      this.addLine(`Cheat ${name}: ${status}`, 'system');
    }));

    this._unsubs.push(on(EVENTS.PRESTIGE_AVAILABLE, () => {
      this.addLine('PRESTIGE available! Press [P] or click the button.', 'prestige');
    }));

    this._unsubs.push(on(EVENTS.PRESTIGE_PERFORMED, (data) => {
      const mult = PRESTIGE.multiplierFormula(data.count);
      this.addLine(`PRESTIGE #${data.count}! Multiplier: x${mult.toFixed(2)}`, 'prestige');
    }));

    this._unsubs.push(on(EVENTS.TERRITORY_CLAIMED, (data) => {
      this.addLine(`Territory claimed: ${data.name} [${data.buff.label}]`, 'system');
    }));

    this._unsubs.push(on(EVENTS.WATERSKIN_USED, (data) => {
      this.addLine(`Drank from waterskin: +${data.healAmount} HP`, 'system');
    }));

    this._unsubs.push(on(EVENTS.POWER_SMASH_USED, (data) => {
      this.addLine(`Power Smash! (${data.multiplier.toFixed(1)}x damage)`, 'combat');
    }));

    this._unsubs.push(on(EVENTS.PROG_LEVEL_UP, (data) => {
      if (data.level === 3) {
        this.addLine('Power Smash unlocked!', 'loot');
      }
    }));

    // ── Welcome message (first launch) ──────────────────────────────
    const offlineResult = OfflineProgress.getLastResult();
    if (!offlineResult && Store.getState().totalKills === 0) {
      this.addLine('Welcome to the Harsh Threshold. Survive.', 'system');
    }

    // ── Offline progress summary ──────────────────────────────────
    if (offlineResult) {
      let summary = `Welcome back! +${format(offlineResult.goldGained)} Gold, +${format(offlineResult.xpGained)} XP`;
      if (offlineResult.fragmentsGained > 0) {
        summary += `, +${offlineResult.fragmentsGained} Fragments`;
      }
      if (offlineResult.levelsGained > 0) {
        summary += ` (${offlineResult.levelsGained} level-up${offlineResult.levelsGained > 1 ? 's' : ''})`;
      }
      summary += ` (away ${offlineResult.durationText})`;
      this.addLine(summary, 'prestige');
      OfflineProgress.clearResult();
    }
  }

  _getLineStyle(line) {
    return { fontSize: '11px', fontStyle: 'normal', color: line.color };
  }


  addLine(text, type = 'default', colorOverride = null) {
    const now = new Date();
    const ts = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
    const color = colorOverride || COLORS.logText[type] || COLORS.logText.default;
    this._addLineData({ text: `${ts} ${text}`, color });
  }
}

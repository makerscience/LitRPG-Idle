// StatsPanel — modal overlay showing all player stats in one place.
// Toggle via STATS button or C key. Two-column layout: base/combat left, economy/progression right.

import Phaser from 'phaser';
import { on, EVENTS } from '../events.js';
import { LAYOUT, COMBAT, DAMAGE_FORMULAS, PRESTIGE } from '../config.js';
import Store from '../systems/Store.js';
import CombatEngine from '../systems/CombatEngine.js';
import UpgradeManager from '../systems/UpgradeManager.js';
import TerritoryManager from '../systems/TerritoryManager.js';
import InventorySystem from '../systems/InventorySystem.js';
import { format } from '../systems/BigNum.js';

const PANEL_W = 720;
const PANEL_H = 480;

export default class StatsPanel {
  constructor(scene) {
    this.scene = scene;
    this._unsubs = [];
    this._isOpen = false;

    this._modalObjects = [];
    this._dynamicObjects = [];

    this._cx = LAYOUT.gameArea.x + LAYOUT.gameArea.w / 2;
    this._cy = LAYOUT.gameArea.y + LAYOUT.gameArea.h / 2;

    this._createToggleButton();
    this._createModal();
    this._hideModal();

    // Keyboard toggle: C key
    this._cKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this._cKey.on('down', () => this._toggle());

    // Subscribe to events that require refresh
    this._unsubs.push(on(EVENTS.PROG_LEVEL_UP, () => this._refresh()));
    this._unsubs.push(on(EVENTS.UPG_PURCHASED, () => this._refresh()));
    this._unsubs.push(on(EVENTS.TERRITORY_CLAIMED, () => this._refresh()));
    this._unsubs.push(on(EVENTS.STATE_CHANGED, () => this._refresh()));
    this._unsubs.push(on(EVENTS.SAVE_LOADED, () => this._refresh()));
    this._unsubs.push(on(EVENTS.PRESTIGE_PERFORMED, () => this._refresh()));
    this._unsubs.push(on(EVENTS.INV_ITEM_EQUIPPED, () => this._refresh()));
    this._unsubs.push(on(EVENTS.INV_ITEM_SOLD, () => this._refresh()));
  }

  _createToggleButton() {
    const bb = LAYOUT.bottomBar;
    const bx = bb.x + bb.w / 2 + 200;
    const by = bb.y + bb.h / 2;

    this._statsBtn = this.scene.add.text(bx, by, 'STATS [C]', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this._statsBtn.on('pointerdown', () => this._toggle());
    this._statsBtn.on('pointerover', () => this._statsBtn.setStyle({ backgroundColor: '#555555' }));
    this._statsBtn.on('pointerout', () => this._statsBtn.setStyle({ backgroundColor: '#333333' }));
  }

  _createModal() {
    const ga = LAYOUT.gameArea;

    // Backdrop
    this._backdrop = this.scene.add.rectangle(
      ga.x + ga.w / 2, ga.y + ga.h / 2, ga.w, ga.h, 0x000000, 0.7
    );
    this._backdrop.setInteractive();
    this._backdrop.on('pointerdown', (pointer) => {
      const px = pointer.x;
      const py = pointer.y;
      const left = this._cx - PANEL_W / 2;
      const right = this._cx + PANEL_W / 2;
      const top = this._cy - PANEL_H / 2;
      const bottom = this._cy + PANEL_H / 2;
      if (px < left || px > right || py < top || py > bottom) {
        this._close();
      }
    });
    this._modalObjects.push(this._backdrop);

    // Panel background
    this._panelBg = this.scene.add.rectangle(this._cx, this._cy, PANEL_W, PANEL_H, 0x1a1a2e);
    this._panelBg.setStrokeStyle(2, 0x444444);
    this._modalObjects.push(this._panelBg);

    // Title
    this._title = this.scene.add.text(this._cx, this._cy - PANEL_H / 2 + 20, 'CHARACTER STATS', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this._modalObjects.push(this._title);

    // Close button
    const closeX = this._cx + PANEL_W / 2 - 20;
    const closeY = this._cy - PANEL_H / 2 + 20;
    this._closeBtn = this.scene.add.text(closeX, closeY, 'X', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ef4444', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this._closeBtn.on('pointerdown', () => this._close());
    this._modalObjects.push(this._closeBtn);

    // Separator between columns
    this._sepLine = this.scene.add.rectangle(this._cx, this._cy, 1, PANEL_H - 30, 0x444444);
    this._modalObjects.push(this._sepLine);
  }

  _toggle() {
    if (this._isOpen) {
      this._close();
    } else {
      this._open();
    }
  }

  _open() {
    // Mutual exclusion — close other panels if open
    if (this.scene.inventoryPanel?._isOpen) this.scene.inventoryPanel._close();
    if (this.scene.upgradePanel?._isOpen) this.scene.upgradePanel._close();
    if (this.scene.prestigePanel?._isOpen) this.scene.prestigePanel._close();
    if (this.scene.settingsPanel?._isOpen) this.scene.settingsPanel._close();

    this._isOpen = true;
    this._showModal();
    this._refresh();
  }

  _close() {
    this._isOpen = false;
    this._hideModal();
  }

  _showModal() {
    for (const obj of this._modalObjects) obj.setVisible(true);
  }

  _hideModal() {
    for (const obj of this._modalObjects) obj.setVisible(false);
    this._clearDynamic();
  }

  _clearDynamic() {
    for (const obj of this._dynamicObjects) obj.destroy();
    this._dynamicObjects = [];
  }

  _refresh() {
    if (!this._isOpen) return;
    this._clearDynamic();

    const state = Store.getState();
    const leftX = this._cx - PANEL_W / 2 + 20;
    const rightX = this._cx + 14;

    // Left column — BASE STATS + COMBAT
    this._renderLeftColumn(leftX, state);

    // Right column — ECONOMY + PROGRESSION
    this._renderRightColumn(rightX, state);
  }

  _renderLeftColumn(startX, state) {
    let y = this._cy - PANEL_H / 2 + 50;

    // BASE STATS section
    y = this._renderSection(startX, y, 'BASE STATS', this._getBaseStatRows(state));

    // COMBAT section
    y += 8;
    this._renderSection(startX, y, 'COMBAT', this._getCombatRows(state));
  }

  _renderRightColumn(startX, state) {
    let y = this._cy - PANEL_H / 2 + 50;

    // ECONOMY section
    y = this._renderSection(startX, y, 'ECONOMY', this._getEconomyRows(state));

    // PROGRESSION section
    y += 8;
    this._renderSection(startX, y, 'PROGRESSION', this._getProgressionRows(state));
  }

  _getBaseStatRows(state) {
    const ps = state.playerStats;
    const territoryStr = TerritoryManager.getBuffValue('flatStr');
    const territoryVit = TerritoryManager.getBuffValue('flatVit');

    const strVal = territoryStr > 0
      ? `${ps.str + territoryStr}  (${ps.str} + ${territoryStr})`
      : `${ps.str}`;
    const vitVal = territoryVit > 0
      ? `${ps.vit + territoryVit}  (${ps.vit} + ${territoryVit})`
      : `${ps.vit}`;

    return [
      { label: 'LEVEL', value: `${ps.level}`, desc: 'Increases STR, VIT, LUCK on level up.' },
      { label: 'STR', value: strVal, desc: 'Scales base damage dealt to enemies.' },
      { label: 'VIT', value: vitVal, desc: 'Each point gives 10 max HP.' },
      { label: 'LUCK', value: `${ps.luck}`, desc: 'Affects loot drop rolls and rarity chances.' },
    ];
  }

  _getCombatRows(state) {
    const str = state.playerStats.str + TerritoryManager.getBuffValue('flatStr');
    const wpnDmg = InventorySystem.getEquippedWeaponDamage();
    const baseDmg = DAMAGE_FORMULAS.mortal(str, wpnDmg);

    const clickDmgMult = UpgradeManager.getMultiplier('clickDamage');
    const prestigeMult = state.prestigeMultiplier;
    const territoryDmgMult = TerritoryManager.getBuffMultiplier('baseDamage');
    const effDmg = Math.floor(baseDmg * clickDmgMult * prestigeMult * territoryDmgMult);

    const maxHp = CombatEngine.getEffectiveMaxHp();
    const regenMult = TerritoryManager.getBuffMultiplier('hpRegen');
    const hpRegen = maxHp.times(COMBAT.playerRegenPercent).times(regenMult);

    const critChance = COMBAT.critChance + UpgradeManager.getFlatBonus('critChance') + TerritoryManager.getBuffValue('critChance');
    const critMult = state.flags.crackTriggered ? 10 : COMBAT.critMultiplier;

    const atkSpeed = (1000 / UpgradeManager.getAutoAttackInterval()).toFixed(2);

    return [
      { label: 'MAX HP', value: format(maxHp), desc: 'VIT x 10, scaled by territory buffs.' },
      { label: 'HP REGEN', value: `${format(hpRegen)}/s`, desc: '2% of max HP/s, boosted by buffs.' },
      { label: 'BASE DMG', value: `${Math.floor(baseDmg)}`, desc: `STR x 1.2 + weapon ATK (${wpnDmg}).` },
      { label: 'EFF. DMG', value: `${effDmg}`, desc: 'Damage per hit after all multipliers.' },
      { label: 'CRIT %', value: `${(critChance * 100).toFixed(1)}%`, desc: 'Chance each attack is a critical hit.' },
      { label: 'CRIT MULT', value: `${critMult}x`, desc: 'Damage multiplier on critical hits.' },
      { label: 'ATK SPEED', value: `${atkSpeed}/s`, desc: 'Auto-attacks per second.' },
    ];
  }

  _getEconomyRows(state) {
    const goldMult = UpgradeManager.getMultiplier('goldMultiplier') * state.prestigeMultiplier * TerritoryManager.getBuffMultiplier('goldGain');
    const xpMult = state.prestigeMultiplier * TerritoryManager.getBuffMultiplier('xpGain');

    return [
      { label: 'GOLD MULT', value: `x${goldMult.toFixed(2)}`, desc: 'Total gold multiplier from all sources.' },
      { label: 'XP MULT', value: `x${xpMult.toFixed(2)}`, desc: 'Total XP multiplier from all sources.' },
      { label: 'GOLD', value: format(state.gold), desc: 'Spent on upgrades and territories.' },
      { label: 'FRAGMENTS', value: format(state.glitchFragments), desc: 'Used for exploit upgrades.' },
    ];
  }

  _getProgressionRows(state) {
    const ps = state.playerStats;
    const xpPct = ps.xpToNext.gt(0)
      ? ps.xp.div(ps.xpToNext).times(100).toFixed(1)
      : '0.0';

    const prestigeCount = state.prestigeCount;
    const currentMult = PRESTIGE.multiplierFormula(prestigeCount).toFixed(2);
    const nextMult = PRESTIGE.multiplierFormula(prestigeCount + 1).toFixed(2);

    const conqueredCount = TerritoryManager.getConqueredCount();

    return [
      { label: 'XP', value: `${format(ps.xp)} / ${format(ps.xpToNext)}`, desc: `${xpPct}% to next level.` },
      { label: 'TOTAL KILLS', value: `${state.totalKills}`, desc: 'Enemies defeated this prestige cycle.' },
      { label: 'PRESTIGE', value: `#${prestigeCount} (x${currentMult})`, desc: `Next: x${nextMult}.` },
      { label: 'TERRITORIES', value: `${conqueredCount} conquered`, desc: 'Permanent buffs from the Overworld Map.' },
    ];
  }

  /**
   * Render a section with header and rows. Returns the Y position after the last row.
   */
  _renderSection(x, y, title, rows) {
    // Section header
    const header = this.scene.add.text(x, y, `-- ${title} --`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#818cf8',
    });
    this._dynamicObjects.push(header);
    y += 22;

    for (const row of rows) {
      // Label
      const label = this.scene.add.text(x + 4, y, row.label, {
        fontFamily: 'monospace', fontSize: '11px', color: '#a1a1aa',
      });
      this._dynamicObjects.push(label);

      // Value
      const value = this.scene.add.text(x + 100, y, row.value, {
        fontFamily: 'monospace', fontSize: '11px', color: '#ffffff',
      });
      this._dynamicObjects.push(value);

      // Description
      const desc = this.scene.add.text(x + 4, y + 14, row.desc, {
        fontFamily: 'monospace', fontSize: '9px', color: '#6b7280',
      });
      this._dynamicObjects.push(desc);

      y += 30;
    }

    return y;
  }

  destroy() {
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
    this._clearDynamic();
    for (const obj of this._modalObjects) obj.destroy();
    this._modalObjects = [];
    if (this._statsBtn) { this._statsBtn.destroy(); this._statsBtn = null; }
    if (this._cKey) { this._cKey.destroy(); this._cKey = null; }
  }
}

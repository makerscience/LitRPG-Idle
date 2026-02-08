// PrestigePanel — modal overlay for prestige confirmation.
// Toggle via PRESTIGE button or P key. Shows keeps/resets/gains + two-click confirm.

import Phaser from 'phaser';
import { on, EVENTS } from '../events.js';
import { LAYOUT, COLORS, PRESTIGE } from '../config.js';
import Store from '../systems/Store.js';
import PrestigeManager from '../systems/PrestigeManager.js';
import { format } from '../systems/BigNum.js';

const PANEL_W = 700;
const PANEL_H = 480;

export default class PrestigePanel {
  constructor(scene) {
    this.scene = scene;
    this._unsubs = [];
    this._isOpen = false;
    this._confirmPending = false;
    this._confirmTimer = null;

    // All modal objects for bulk show/hide
    this._modalObjects = [];
    this._dynamicObjects = [];

    // Panel center
    this._cx = LAYOUT.gameArea.x + LAYOUT.gameArea.w / 2;
    this._cy = LAYOUT.gameArea.y + LAYOUT.gameArea.h / 2;

    this._createToggleButton();
    this._createModal();
    this._hideModal();

    // Keyboard toggle: P key
    this._pKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this._pKey.on('down', () => {
      if (PrestigeManager.canPrestige()) this._toggle();
    });

    // Show button when prestige becomes available
    this._unsubs.push(on(EVENTS.PRESTIGE_AVAILABLE, () => {
      this._presBtn.setVisible(true);
    }));

    // Close modal on prestige performed
    this._unsubs.push(on(EVENTS.PRESTIGE_PERFORMED, () => {
      if (this._isOpen) this._close();
    }));

    // On save loaded, check visibility
    this._unsubs.push(on(EVENTS.SAVE_LOADED, () => {
      this._presBtn.setVisible(PrestigeManager.canPrestige());
    }));

    // Initial visibility check
    this._presBtn.setVisible(PrestigeManager.canPrestige());
  }

  _createToggleButton() {
    const bb = LAYOUT.bottomBar;
    const bx = bb.x + bb.w / 2 + 240;
    const by = bb.y + bb.h / 2;

    this._presBtn = this.scene.add.text(bx, by, 'PRESTIGE [P]', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#f59e0b',
      backgroundColor: '#333333',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this._presBtn.on('pointerdown', () => this._toggle());
    this._presBtn.on('pointerover', () => this._presBtn.setStyle({ backgroundColor: '#555555' }));
    this._presBtn.on('pointerout', () => this._presBtn.setStyle({ backgroundColor: '#333333' }));
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
    this._panelBg.setStrokeStyle(2, 0xf59e0b);
    this._modalObjects.push(this._panelBg);

    // Title
    this._title = this.scene.add.text(this._cx, this._cy - PANEL_H / 2 + 20, 'PRESTIGE', {
      fontFamily: 'monospace', fontSize: '18px', color: '#f59e0b', fontStyle: 'bold',
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
  }

  _toggle() {
    if (this._isOpen) {
      this._close();
    } else {
      this._open();
    }
  }

  _open() {
    if (!PrestigeManager.canPrestige()) return;

    // Mutual exclusion — close other panels
    if (this.scene.inventoryPanel?._isOpen) this.scene.inventoryPanel._close();
    if (this.scene.upgradePanel?._isOpen) this.scene.upgradePanel._close();
    if (this.scene.settingsPanel?._isOpen) this.scene.settingsPanel._close();

    this._isOpen = true;
    this._confirmPending = false;
    this._showModal();
    this._refresh();
  }

  _close() {
    this._isOpen = false;
    this._confirmPending = false;
    if (this._confirmTimer) {
      clearTimeout(this._confirmTimer);
      this._confirmTimer = null;
    }
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
    const leftX = this._cx - PANEL_W / 2 + 30;
    const rightX = this._cx + 30;
    const centerX = this._cx;
    let topY = this._cy - PANEL_H / 2 + 55;

    // ── Left column: KEEPS (green) ──
    this._addText(leftX, topY, '-- KEEPS --', '#22c55e', '14px', true);
    const keeps = [
      'Equipped Gear',
      'Inventory Items',
      `Glitch Fragments (${format(state.glitchFragments)})`,
      'Unlocked Cheats',
      'Active Cheats',
      'Titles',
      'Crack Progress',
    ];
    let y = topY + 28;
    for (const line of keeps) {
      this._addText(leftX + 10, y, `+ ${line}`, '#22c55e', '12px');
      y += 22;
    }

    // ── Right column: RESETS (red) ──
    this._addText(rightX, topY, '-- RESETS --', '#ef4444', '14px', true);
    const goldRetained = state.gold.times(PRESTIGE.goldRetention).floor();
    const resets = [
      'Zone → 1',
      `Gold: ${format(state.gold)} → ${format(goldRetained)} (keep 10%)`,
      'Level → 1 / Stats → Starting',
      'All Upgrades → Reset',
      `Kill Count: ${state.totalKills} → 0`,
    ];
    y = topY + 28;
    for (const line of resets) {
      this._addText(rightX + 10, y, `- ${line}`, '#ef4444', '12px');
      y += 22;
    }

    // ── Center: GAINS (gold) ──
    const gainsY = topY + 200;
    this._addText(centerX, gainsY, '-- GAINS --', '#f59e0b', '14px', true, true);

    const currentCount = state.prestigeCount;
    const nextCount = currentCount + 1;
    const currentMult = currentCount > 0 ? PRESTIGE.multiplierFormula(currentCount).toFixed(2) : '1.00';
    const nextMult = PRESTIGE.multiplierFormula(nextCount).toFixed(2);

    this._addText(centerX, gainsY + 30, `Prestige #${currentCount} → #${nextCount}`, '#f59e0b', '13px', false, true);
    this._addText(centerX, gainsY + 52, `Multiplier: x${currentMult} → x${nextMult}`, '#f59e0b', '13px', false, true);
    this._addText(centerX, gainsY + 74, `(Applies to Damage, Gold, and XP)`, '#888888', '11px', false, true);
    this._addText(centerX, gainsY + 96, `Gold retained: ${format(goldRetained)}`, '#eab308', '12px', false, true);

    // ── CONFIRM button (two-click safeguard) ──
    const btnY = this._cy + PANEL_H / 2 - 50;
    const btnLabel = this._confirmPending ? '!! ARE YOU SURE? !!' : 'CONFIRM PRESTIGE';
    const btnColor = this._confirmPending ? '#ef4444' : '#f59e0b';
    const btnBg = this._confirmPending ? '#4a1515' : '#333333';

    const confirmBtn = this.scene.add.text(centerX, btnY, btnLabel, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: btnColor,
      backgroundColor: btnBg,
      padding: { x: 24, y: 8 },
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    confirmBtn.on('pointerdown', () => {
      if (this._confirmPending) {
        // Second click — execute prestige
        this._confirmPending = false;
        if (this._confirmTimer) {
          clearTimeout(this._confirmTimer);
          this._confirmTimer = null;
        }
        PrestigeManager.performPrestige();
      } else {
        // First click — arm confirmation
        this._confirmPending = true;
        this._refresh();
        this._confirmTimer = setTimeout(() => {
          this._confirmPending = false;
          if (this._isOpen) this._refresh();
        }, 3000);
      }
    });

    confirmBtn.on('pointerover', () => confirmBtn.setStyle({ backgroundColor: '#555555' }));
    confirmBtn.on('pointerout', () => confirmBtn.setStyle({ backgroundColor: btnBg }));
    this._dynamicObjects.push(confirmBtn);
  }

  _addText(x, y, text, color, fontSize = '12px', bold = false, centered = false) {
    const obj = this.scene.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize,
      color,
      fontStyle: bold ? 'bold' : 'normal',
    });
    if (centered) obj.setOrigin(0.5);
    this._dynamicObjects.push(obj);
    return obj;
  }

  destroy() {
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
    this._clearDynamic();
    for (const obj of this._modalObjects) obj.destroy();
    this._modalObjects = [];
    if (this._presBtn) { this._presBtn.destroy(); this._presBtn = null; }
    if (this._pKey) { this._pKey.destroy(); this._pKey = null; }
    if (this._confirmTimer) { clearTimeout(this._confirmTimer); this._confirmTimer = null; }
  }
}

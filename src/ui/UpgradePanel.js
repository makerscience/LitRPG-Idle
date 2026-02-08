// UpgradePanel — modal overlay for purchasing upgrades.
// Toggle via UPGRADES button or U key. Legit upgrades on left, exploit on right.

import Phaser from 'phaser';
import { on, emit, EVENTS } from '../events.js';
import { LAYOUT, COLORS } from '../config.js';
import Store from '../systems/Store.js';
import UpgradeManager from '../systems/UpgradeManager.js';
import { getUpgradesByCategory } from '../data/upgrades.js';
import { format } from '../systems/BigNum.js';
import { FAILED_PURCHASE } from '../data/dialogue.js';

const PANEL_W = 750;
const PANEL_H = 500;

export default class UpgradePanel {
  constructor(scene) {
    this.scene = scene;
    this._unsubs = [];
    this._isOpen = false;
    this._lastFailedPurchaseTime = 0;

    // All modal objects for bulk show/hide
    this._modalObjects = [];
    this._dynamicObjects = [];

    // Panel center
    this._cx = LAYOUT.gameArea.x + LAYOUT.gameArea.w / 2;
    this._cy = LAYOUT.gameArea.y + LAYOUT.gameArea.h / 2;

    this._createToggleButton();
    this._createModal();
    this._hideModal();

    // Keyboard toggle: U key
    this._uKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U);
    this._uKey.on('down', () => this._toggle());

    // Subscribe to events that require refresh
    this._unsubs.push(on(EVENTS.UPG_PURCHASED, () => this._refresh()));
    this._unsubs.push(on(EVENTS.STATE_CHANGED, () => this._refresh()));
    this._unsubs.push(on(EVENTS.SAVE_LOADED, () => this._refresh()));
  }

  _createToggleButton() {
    const bb = LAYOUT.bottomBar;
    const bx = bb.x + bb.w / 2 + 80;
    const by = bb.y + bb.h / 2;

    this._upgBtn = this.scene.add.text(bx, by, 'UPGRADES [U]', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this._upgBtn.on('pointerdown', () => this._toggle());
    this._upgBtn.on('pointerover', () => this._upgBtn.setStyle({ backgroundColor: '#555555' }));
    this._upgBtn.on('pointerout', () => this._upgBtn.setStyle({ backgroundColor: '#333333' }));
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
    this._title = this.scene.add.text(this._cx, this._cy - PANEL_H / 2 + 20, 'UPGRADES', {
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

    // Separator between legit and exploit columns
    this._sepLine = this.scene.add.rectangle(this._cx, this._cy, 1, PANEL_H - 30, 0x444444);
    this._modalObjects.push(this._sepLine);

    // Column headers
    const leftX = this._cx - PANEL_W / 2 + 20;
    const rightX = this._cx + 20;

    this._legitHeader = this.scene.add.text(leftX, this._cy - PANEL_H / 2 + 50, '-- Standard --', {
      fontFamily: 'monospace', fontSize: '13px', color: '#818cf8',
    });
    this._modalObjects.push(this._legitHeader);

    this._exploitHeader = this.scene.add.text(rightX, this._cy - PANEL_H / 2 + 50, '-- Exploits --', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ef4444',
    });
    this._modalObjects.push(this._exploitHeader);
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
    if (this.scene.inventoryPanel?._isOpen) {
      this.scene.inventoryPanel._close();
    }
    if (this.scene.prestigePanel?._isOpen) {
      this.scene.prestigePanel._close();
    }
    if (this.scene.settingsPanel?._isOpen) {
      this.scene.settingsPanel._close();
    }
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

    // Render legit upgrades (left column)
    this._renderColumn(getUpgradesByCategory('legit'), this._cx - PANEL_W / 2 + 20, state);

    // Render exploit upgrades (right column) — only after crack
    if (state.flags.crackTriggered) {
      this._exploitHeader.setVisible(true);
      this._renderColumn(getUpgradesByCategory('exploit'), this._cx + 20, state);
    } else {
      this._exploitHeader.setVisible(false);
    }
  }

  _renderColumn(upgrades, startX, state) {
    let y = this._cy - PANEL_H / 2 + 75;

    for (const upgrade of upgrades) {
      const level = UpgradeManager.getLevel(upgrade.id);
      const isMaxed = level >= upgrade.maxLevel;
      const cost = isMaxed ? 0 : UpgradeManager.getCost(upgrade.id);
      const canBuy = UpgradeManager.canPurchase(upgrade.id);

      // Name + level
      const levelStr = isMaxed ? 'MAX' : `Lv.${level}/${upgrade.maxLevel}`;
      const nameText = this.scene.add.text(startX, y, `${upgrade.name} [${levelStr}]`, {
        fontFamily: 'monospace', fontSize: '12px',
        color: upgrade.category === 'exploit' ? '#ef4444' : '#ffffff',
      });
      this._dynamicObjects.push(nameText);

      // Description
      const descText = this.scene.add.text(startX, y + 16, upgrade.description, {
        fontFamily: 'monospace', fontSize: '10px', color: '#888888',
      });
      this._dynamicObjects.push(descText);

      // Cost + BUY button
      if (!isMaxed) {
        const currLabel = upgrade.currency === 'gold' ? 'Gold' : 'Fragments';
        const costStr = `${cost} ${currLabel}`;

        const buyColor = canBuy ? '#22c55e' : '#555555';
        const buyBg = canBuy ? '#333333' : '#222222';

        const buyBtn = this.scene.add.text(startX + 260, y + 4, `[BUY] ${costStr}`, {
          fontFamily: 'monospace', fontSize: '11px', color: buyColor,
          backgroundColor: buyBg, padding: { x: 6, y: 3 },
        });

        buyBtn.setInteractive({ useHandCursor: true });
        buyBtn.on('pointerdown', () => {
          if (UpgradeManager.canPurchase(upgrade.id)) {
            UpgradeManager.purchase(upgrade.id);
          } else {
            // Failed purchase — emit dialogue with 10s local cooldown
            const now = Date.now();
            if (now - this._lastFailedPurchaseTime >= 10000) {
              this._lastFailedPurchaseTime = now;
              const line = FAILED_PURCHASE[Math.floor(Math.random() * FAILED_PURCHASE.length)];
              emit(EVENTS.DIALOGUE_QUEUED, { text: line, emotion: 'sarcastic', context: 'Insufficient funds' });
            }
          }
        });
        buyBtn.on('pointerover', () => buyBtn.setStyle({ backgroundColor: '#555555' }));
        buyBtn.on('pointerout', () => buyBtn.setStyle({ backgroundColor: buyBg }));

        this._dynamicObjects.push(buyBtn);
      } else {
        const maxLabel = this.scene.add.text(startX + 260, y + 4, 'MAXED', {
          fontFamily: 'monospace', fontSize: '11px', color: '#555555',
        });
        this._dynamicObjects.push(maxLabel);
      }

      y += 50;
    }
  }

  destroy() {
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
    this._clearDynamic();
    for (const obj of this._modalObjects) obj.destroy();
    this._modalObjects = [];
    if (this._upgBtn) { this._upgBtn.destroy(); this._upgBtn = null; }
    if (this._uKey) { this._uKey.destroy(); this._uKey = null; }
  }
}

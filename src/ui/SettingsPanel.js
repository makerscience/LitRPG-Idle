// SettingsPanel — modal overlay for game settings.
// Toggle via gear button or ESC key. Contains wipe save with two-click confirm.

import Phaser from 'phaser';
import { LAYOUT, COLORS } from '../config.js';
import SaveManager from '../systems/SaveManager.js';

const PANEL_W = 500;
const PANEL_H = 340;

export default class SettingsPanel {
  constructor(scene) {
    this.scene = scene;
    this._isOpen = false;
    this._wipePending = false;
    this._wipeTimer = null;

    this._modalObjects = [];
    this._dynamicObjects = [];

    this._cx = LAYOUT.gameArea.x + LAYOUT.gameArea.w / 2;
    this._cy = LAYOUT.gameArea.y + LAYOUT.gameArea.h / 2;

    this._createToggleButton();
    this._createModal();
    this._hideModal();

    // Keyboard toggle: ESC key
    this._escKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this._escKey.on('down', () => this._toggle());
  }

  _createToggleButton() {
    const bb = LAYOUT.bottomBar;
    const bx = bb.x + bb.w - 60;
    const by = bb.y + bb.h / 2;

    this._settingsBtn = this.scene.add.text(bx, by, 'SETTINGS', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#a1a1aa',
      backgroundColor: '#333333',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this._settingsBtn.on('pointerdown', () => this._toggle());
    this._settingsBtn.on('pointerover', () => this._settingsBtn.setStyle({ backgroundColor: '#555555' }));
    this._settingsBtn.on('pointerout', () => this._settingsBtn.setStyle({ backgroundColor: '#333333' }));
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
    this._panelBg.setStrokeStyle(2, 0xa1a1aa);
    this._modalObjects.push(this._panelBg);

    // Title
    this._title = this.scene.add.text(this._cx, this._cy - PANEL_H / 2 + 20, 'SETTINGS', {
      fontFamily: 'monospace', fontSize: '18px', color: '#a1a1aa', fontStyle: 'bold',
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
    // Mutual exclusion — close other panels
    if (this.scene.inventoryPanel?._isOpen) this.scene.inventoryPanel._close();
    if (this.scene.upgradePanel?._isOpen) this.scene.upgradePanel._close();
    if (this.scene.prestigePanel?._isOpen) this.scene.prestigePanel._close();
    if (this.scene.statsPanel?._isOpen) this.scene.statsPanel._close();

    this._isOpen = true;
    this._wipePending = false;
    this._showModal();
    this._refresh();
  }

  _close() {
    this._isOpen = false;
    this._wipePending = false;
    if (this._wipeTimer) {
      clearTimeout(this._wipeTimer);
      this._wipeTimer = null;
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

    const centerX = this._cx;

    // ── Danger Zone ──
    const dangerY = this._cy - 30;
    this._addText(centerX, dangerY, '-- DANGER ZONE --', '#ef4444', '14px', true, true);
    this._addText(centerX, dangerY + 30, 'This will permanently delete your save file.', '#a1a1aa', '12px', false, true);
    this._addText(centerX, dangerY + 50, 'All progress will be lost. This cannot be undone.', '#a1a1aa', '12px', false, true);

    // ── WIPE button (two-click safeguard) ──
    const btnY = this._cy + PANEL_H / 2 - 60;
    const btnLabel = this._wipePending ? '!! ARE YOU SURE? !!' : 'WIPE SAVE';
    const btnColor = this._wipePending ? '#ffffff' : '#ef4444';
    const btnBg = this._wipePending ? '#991b1b' : '#333333';

    const wipeBtn = this.scene.add.text(centerX, btnY, btnLabel, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: btnColor,
      backgroundColor: btnBg,
      padding: { x: 24, y: 8 },
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    wipeBtn.on('pointerdown', () => {
      if (this._wipePending) {
        // Second click — wipe and reload
        this._wipePending = false;
        if (this._wipeTimer) {
          clearTimeout(this._wipeTimer);
          this._wipeTimer = null;
        }
        SaveManager.destroy();
        SaveManager.deleteSave();
        window.location.reload();
      } else {
        // First click — arm confirmation
        this._wipePending = true;
        this._refresh();
        this._wipeTimer = setTimeout(() => {
          this._wipePending = false;
          if (this._isOpen) this._refresh();
        }, 3000);
      }
    });

    wipeBtn.on('pointerover', () => wipeBtn.setStyle({ backgroundColor: '#555555' }));
    wipeBtn.on('pointerout', () => wipeBtn.setStyle({ backgroundColor: btnBg }));
    this._dynamicObjects.push(wipeBtn);
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
    this._clearDynamic();
    for (const obj of this._modalObjects) obj.destroy();
    this._modalObjects = [];
    if (this._settingsBtn) { this._settingsBtn.destroy(); this._settingsBtn = null; }
    if (this._escKey) { this._escKey.destroy(); this._escKey = null; }
    if (this._wipeTimer) { clearTimeout(this._wipeTimer); this._wipeTimer = null; }
  }
}

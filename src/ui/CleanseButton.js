// CleanseButton — "CLEANSE" button for the Fortress stance secondary skill.
// Visibility/layout are controlled by UIScene action-slot logic.

import CombatEngine from '../systems/CombatEngine.js';
import { ABILITIES, LAYOUT } from '../config.js';

export default class CleanseButton {
  constructor(scene) {
    this.scene = scene;
    this._cooldownEnd = 0;
    this._cooldownTimer = null;
    this._manualVisible = false;

    const ga = LAYOUT.gameArea;
    const btnX = ga.x + 110;
    const btnY = ga.y + ga.h - 46;

    this._btn = scene.add.text(btnX, btnY, 'CLEANSE', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#047857',
      padding: { x: 13, y: 7 },
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 1).setInteractive({ useHandCursor: true });

    this._btn.setVisible(false);
    this._btn.setDepth(10);

    this._btn.on('pointerdown', () => this._onActivate());
    this._btn.on('pointerover', () => {
      if (this._btn.visible && !this._isOnCooldown()) {
        this._btn.setStyle({ backgroundColor: '#059669' });
      }
    });
    this._btn.on('pointerout', () => {
      if (this._btn.visible && !this._isOnCooldown()) {
        this._btn.setStyle({ backgroundColor: '#047857' });
      }
    });
  }

  _isOnCooldown() {
    return Date.now() < this._cooldownEnd;
  }

  _onActivate() {
    if (this._isOnCooldown()) return;
    const cleansed = CombatEngine.cleanseCorruption();
    if (!cleansed) return;

    this._cooldownEnd = Date.now() + ABILITIES.cleanse.cooldownMs;
    this._startCooldownTimer();
  }

  _refreshVisibility() {
    if (this._manualVisible) {
      this._btn.setVisible(true);
      if (!this._isOnCooldown()) {
        this._btn.setText('CLEANSE');
        this._btn.setStyle({ backgroundColor: '#047857', color: '#ffffff' });
      }
    } else {
      this._btn.setVisible(false);
    }
  }

  _startCooldownTimer() {
    this._stopCooldownTimer();
    this._btn.setStyle({ backgroundColor: '#333333', color: '#888888' });
    this._updateCooldownText();

    this._cooldownTimer = this.scene.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => this._updateCooldownText(),
    });
  }

  _updateCooldownText() {
    const remaining = this._cooldownEnd - Date.now();
    if (remaining <= 0) {
      this._stopCooldownTimer();
      this._btn.setText('CLEANSE');
      this._btn.setStyle({ backgroundColor: '#047857', color: '#ffffff' });
      return;
    }
    const secs = Math.ceil(remaining / 1000);
    this._btn.setText(`CLEANSE (${secs}s)`);
  }

  _stopCooldownTimer() {
    if (this._cooldownTimer) {
      this._cooldownTimer.remove(false);
      this._cooldownTimer = null;
    }
  }

  show() {
    this._manualVisible = true;
    this._refreshVisibility();
  }

  hide() {
    this._manualVisible = false;
    this._btn.setVisible(false);
  }

  setPosition(x, y) {
    this._btn.setPosition(x, y);
  }

  destroy() {
    this._stopCooldownTimer();
  }
}

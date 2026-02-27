// InterruptButton — "INTERRUPT" button for the Flurry stance secondary skill.
// Visibility/layout are controlled by UIScene action-slot logic.

import CombatEngine from '../systems/CombatEngine.js';
import UpgradeManager from '../systems/UpgradeManager.js';
import { ABILITIES, LAYOUT } from '../config.js';

export default class InterruptButton {
  constructor(scene) {
    this.scene = scene;
    this._cooldownEnd = 0;
    this._cooldownTimer = null;
    this._manualVisible = false;
    this._pulseTween = null;
    this._pulsePending = false;

    const ga = LAYOUT.gameArea;
    const btnX = ga.x + 110;
    const btnY = ga.y + ga.h - 46;

    this._btn = scene.add.text(btnX, btnY, 'INTERRUPT', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#0f766e',
      padding: { x: 12, y: 7 },
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 1).setInteractive({ useHandCursor: true });

    this._btn.setVisible(false);
    this._btn.setDepth(10);

    this._btn.on('pointerdown', () => this._onActivate());
    this._btn.on('pointerover', () => {
      if (this._btn.visible && !this._isOnCooldown()) {
        this._btn.setStyle({ backgroundColor: '#0d9488' });
      }
    });
    this._btn.on('pointerout', () => {
      if (this._btn.visible && !this._isOnCooldown()) {
        this._btn.setStyle({ backgroundColor: '#0f766e' });
      }
    });
  }

  _isOnCooldown() {
    return Date.now() < this._cooldownEnd;
  }

  _getCooldownMs() {
    return UpgradeManager.hasUpgrade('interrupt_t3') ? 8000 : ABILITIES.interrupt.cooldownMs;
  }

  _onActivate() {
    if (this._isOnCooldown()) return;
    if (!CombatEngine.hasTarget()) return;

    const interrupted = CombatEngine.interruptTarget();
    const delay = interrupted
      ? this._getCooldownMs()
      : ABILITIES.interrupt.fallbackDelayMs;

    this._cooldownEnd = Date.now() + delay;
    this._startCooldownTimer();
  }

  _refreshVisibility() {
    if (this._manualVisible) {
      this._btn.setVisible(true);
      if (!this._isOnCooldown()) {
        this._btn.setText('INTERRUPT');
        this._btn.setStyle({ backgroundColor: '#0f766e', color: '#ffffff' });
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
      this._btn.setText('INTERRUPT');
      this._btn.setStyle({ backgroundColor: '#0f766e', color: '#ffffff' });
      return;
    }
    const secs = Math.ceil(remaining / 1000);
    this._btn.setText(`INTERRUPT (${secs}s)`);
  }

  _stopCooldownTimer() {
    if (this._cooldownTimer) {
      this._cooldownTimer.remove(false);
      this._cooldownTimer = null;
    }
  }

  _startPulseTween() {
    this._stopPulseTween();
    this._btn.setScale(1);
    this._pulseTween = this.scene.tweens.add({
      targets: this._btn,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 170,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this._btn.setScale(1);
        this._pulseTween = null;
      },
    });
  }

  _stopPulseTween() {
    if (!this._pulseTween) return;
    this._pulseTween.stop();
    this._pulseTween = null;
    this._btn.setScale(1);
  }

  show() {
    this._manualVisible = true;
    this._refreshVisibility();
    if (this._btn.visible && this._pulsePending) {
      this._pulsePending = false;
      this._startPulseTween();
    }
  }

  hide() {
    this._manualVisible = false;
    this._stopPulseTween();
    this._btn.setVisible(false);
  }

  pulseUnlock() {
    if (!this._btn.visible) {
      this._pulsePending = true;
      return;
    }
    this._pulsePending = false;
    this._startPulseTween();
  }

  setPosition(x, y) {
    this._btn.setPosition(x, y);
  }

  destroy() {
    this._stopPulseTween();
    this._stopCooldownTimer();
  }
}

// FlurryButton — "FLURRY" button for the Rapid Strikes active ability.
// Visible when stance is 'flurry'. Calls CombatEngine.activateRapidStrikes().

import Store from '../systems/Store.js';
import CombatEngine from '../systems/CombatEngine.js';
import { on, emit, EVENTS } from '../events.js';
import { LAYOUT } from '../config.js';

const COOLDOWN_MS = 10000; // 10s cooldown

export default class FlurryButton {
  constructor(scene) {
    this.scene = scene;
    this._unsubs = [];
    this._cooldownEnd = 0;
    this._cooldownTimer = null;

    const ga = LAYOUT.gameArea;
    const btnX = ga.x + 110;
    const btnY = ga.y + ga.h - 10;

    this._btn = scene.add.text(btnX, btnY, 'FLURRY', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#1e3a5f',
      padding: { x: 12, y: 8 },
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 1).setInteractive({ useHandCursor: true });

    this._btn.setVisible(false);
    this._btn.setDepth(10);

    this._btn.on('pointerdown', () => this._onActivate());
    this._btn.on('pointerover', () => {
      if (this._btn.visible && !this._isOnCooldown()) {
        this._btn.setStyle({ backgroundColor: '#2a5280' });
      }
    });
    this._btn.on('pointerout', () => {
      if (this._btn.visible && !this._isOnCooldown()) {
        this._btn.setStyle({ backgroundColor: '#1e3a5f' });
      }
    });

    this._unsubs.push(on(EVENTS.STANCE_CHANGED, () => this._refreshVisibility()));
    this._unsubs.push(on(EVENTS.SAVE_LOADED, () => this._refreshVisibility()));

    this._refreshVisibility();
  }

  _isActiveStance() {
    return Store.getState().currentStance === 'flurry';
  }

  _isOnCooldown() {
    return Date.now() < this._cooldownEnd;
  }

  _refreshVisibility() {
    if (this._isActiveStance()) {
      this._btn.setVisible(true);
      if (!this._isOnCooldown()) {
        this._btn.setText('FLURRY');
        this._btn.setStyle({ backgroundColor: '#1e3a5f', color: '#ffffff' });
      }
    } else {
      this._btn.setVisible(false);
    }
  }

  _onActivate() {
    if (this._isOnCooldown()) return;
    if (!this._isActiveStance()) return;
    if (!CombatEngine.hasTarget()) return;

    CombatEngine.activateRapidStrikes();
    emit(EVENTS.RAPID_STRIKES_USED, { hitCount: 5 });

    this._cooldownEnd = Date.now() + COOLDOWN_MS;
    this._startCooldownTimer();
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
      this._btn.setText('FLURRY');
      this._btn.setStyle({ backgroundColor: '#1e3a5f', color: '#ffffff' });
      return;
    }
    const secs = Math.ceil(remaining / 1000);
    this._btn.setText(`FLURRY (${secs}s)`);
  }

  _stopCooldownTimer() {
    if (this._cooldownTimer) {
      this._cooldownTimer.remove(false);
      this._cooldownTimer = null;
    }
  }

  show() {
    this._refreshVisibility();
  }

  hide() {
    this._btn.setVisible(false);
  }

  destroy() {
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
    this._stopCooldownTimer();
  }
}

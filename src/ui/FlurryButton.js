// FlurryButton — "FLURRY" button for the Rapid Strikes active ability.
// Visible when stance is 'tempest'. Calls CombatEngine.activateRapidStrikes().

import CombatEngine from '../systems/CombatEngine.js';
import UpgradeManager from '../systems/UpgradeManager.js';
import { on, emit, EVENTS } from '../events.js';
import { LAYOUT } from '../config.js';

export default class FlurryButton {
  constructor(scene) {
    this.scene = scene;
    this._unsubs = [];
    this._cooldownEnd = 0;
    this._cooldownTimer = null;
    this._manualVisible = false;

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

    this._unsubs.push(on(EVENTS.SAVE_LOADED, () => this._refreshVisibility()));

    this._refreshVisibility();
  }

  _isOnCooldown() {
    return Date.now() < this._cooldownEnd;
  }

  _getCooldownMs() {
    return UpgradeManager.hasUpgrade('flurry_t3') ? 7000 : 10000;
  }

  _getHitCount() {
    return 5 + UpgradeManager.getFlatBonus('rapidStrikesHits');
  }

  _refreshVisibility() {
    if (this._manualVisible) {
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
    if (!CombatEngine.hasTarget()) return;

    const hitCount = this._getHitCount();
    CombatEngine.activateRapidStrikes(hitCount);
    emit(EVENTS.RAPID_STRIKES_USED, { hitCount });

    this._cooldownEnd = Date.now() + this._getCooldownMs();
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
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
    this._stopCooldownTimer();
  }
}

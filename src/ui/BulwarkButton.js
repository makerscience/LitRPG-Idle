// BulwarkButton — "BULWARK" button for the Fortress shield active ability.
// Visible when stance is 'fortress'. Calls CombatEngine.activateShield().

import CombatEngine from '../systems/CombatEngine.js';
import UpgradeManager from '../systems/UpgradeManager.js';
import { getEffectiveMaxHp } from '../systems/ComputedStats.js';
import { on, EVENTS } from '../events.js';
import { LAYOUT } from '../config.js';

const COOLDOWN_MS = 45000; // 45s cooldown
const BASE_SHIELD_HP_MULT = 0.10;
const BASE_SHIELD_DURATION_MS = 8000;

export default class BulwarkButton {
  constructor(scene) {
    this.scene = scene;
    this._unsubs = [];
    this._cooldownEnd = 0;
    this._cooldownTimer = null;
    this._manualVisible = false;

    const ga = LAYOUT.gameArea;
    const btnX = ga.x + 110;
    const btnY = ga.y + ga.h - 10;

    this._btn = scene.add.text(btnX, btnY, 'BULWARK', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#4a5568',
      padding: { x: 10, y: 8 },
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 1).setInteractive({ useHandCursor: true });

    this._btn.setVisible(false);
    this._btn.setDepth(10);

    this._btn.on('pointerdown', () => this._onActivate());
    this._btn.on('pointerover', () => {
      if (this._btn.visible && !this._isOnCooldown()) {
        this._btn.setStyle({ backgroundColor: '#636b7f' });
      }
    });
    this._btn.on('pointerout', () => {
      if (this._btn.visible && !this._isOnCooldown()) {
        this._btn.setStyle({ backgroundColor: '#4a5568' });
      }
    });

    this._unsubs.push(on(EVENTS.SAVE_LOADED, () => this._refreshVisibility()));

    this._refreshVisibility();
  }

  _isOnCooldown() {
    return Date.now() < this._cooldownEnd;
  }

  _getShieldHpMult() {
    return UpgradeManager.hasUpgrade('bulwark_t1') ? 0.14 : BASE_SHIELD_HP_MULT;
  }

  _getShieldDurationMs() {
    return UpgradeManager.hasUpgrade('bulwark_t3') ? 14000 : BASE_SHIELD_DURATION_MS;
  }

  _refreshVisibility() {
    if (this._manualVisible) {
      this._btn.setVisible(true);
      if (!this._isOnCooldown()) {
        this._btn.setText('BULWARK');
        this._btn.setStyle({ backgroundColor: '#4a5568', color: '#ffffff' });
      }
    } else {
      this._btn.setVisible(false);
    }
  }

  _onActivate() {
    if (this._isOnCooldown()) return;

    const shieldAmount = Math.floor(getEffectiveMaxHp() * this._getShieldHpMult());
    CombatEngine.activateShield(shieldAmount, this._getShieldDurationMs());

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
      this._btn.setText('BULWARK');
      this._btn.setStyle({ backgroundColor: '#4a5568', color: '#ffffff' });
      return;
    }
    const secs = Math.ceil(remaining / 1000);
    this._btn.setText(`BULWARK (${secs}s)`);
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

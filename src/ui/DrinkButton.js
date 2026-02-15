// DrinkButton — "DRINK" button that heals player when a waterskin is equipped.
// Visible only when a waterskin is equipped. Cooldown driven by the equipped item's cooldownMs.

import Store from '../systems/Store.js';
import { getEffectiveMaxHp } from '../systems/ComputedStats.js';
import { getItem } from '../data/items.js';
import { on, emit, EVENTS } from '../events.js';
import { LAYOUT } from '../config.js';

export default class DrinkButton {
  constructor(scene) {
    this.scene = scene;
    this._unsubs = [];
    this._cooldownEnd = 0;
    this._cooldownTimer = null;

    const ga = LAYOUT.gameArea;
    const btnX = ga.x + 20;
    const btnY = ga.y + ga.h - 10;

    this._btn = scene.add.text(btnX, btnY, 'DRINK', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#1e3a5f',
      padding: { x: 16, y: 8 },
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 1).setInteractive({ useHandCursor: true });

    this._btn.setVisible(false);
    this._btn.setDepth(10);

    this._btn.on('pointerdown', () => this._onDrink());
    this._btn.on('pointerover', () => {
      if (this._btn.visible && !this._isOnCooldown()) {
        this._btn.setStyle({ backgroundColor: '#2d5a8a' });
      }
    });
    this._btn.on('pointerout', () => {
      if (this._btn.visible && !this._isOnCooldown()) {
        this._btn.setStyle({ backgroundColor: '#1e3a5f' });
      }
    });

    this._unsubs.push(on(EVENTS.INV_ITEM_EQUIPPED, () => this._refresh()));
    this._unsubs.push(on(EVENTS.SAVE_LOADED, () => this._refresh()));
    this._unsubs.push(on(EVENTS.COMBAT_PLAYER_DIED, () => this._resetCooldown()));

    this._refresh();
  }

  _getEquippedWaterskin() {
    const state = Store.getState();
    const stackKey = state.equipped.waterskin;
    if (!stackKey) return null;
    return getItem(stackKey);
  }

  _isOnCooldown() {
    return Date.now() < this._cooldownEnd;
  }

  _refresh() {
    const item = this._getEquippedWaterskin();
    if (item) {
      this._btn.setVisible(true);
      if (!this._isOnCooldown()) {
        this._btn.setText('DRINK');
        this._btn.setStyle({ backgroundColor: '#1e3a5f', color: '#ffffff' });
      }
    } else {
      this._btn.setVisible(false);
      this._stopCooldownTimer();
    }
  }

  _onDrink() {
    if (this._isOnCooldown()) return;

    const item = this._getEquippedWaterskin();
    if (!item) return;

    const healPercent = item.healPercent || 0.20;
    const cooldownMs = item.cooldownMs || 30000;

    const maxHp = getEffectiveMaxHp();
    const healAmount = Math.floor(maxHp.toNumber() * healPercent);
    Store.healPlayer(healAmount);

    emit(EVENTS.WATERSKIN_USED, { healAmount, itemId: item.id });

    this._cooldownEnd = Date.now() + cooldownMs;
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
      this._btn.setText('DRINK');
      this._btn.setStyle({ backgroundColor: '#1e3a5f', color: '#ffffff' });
      return;
    }
    const secs = Math.ceil(remaining / 1000);
    this._btn.setText(`DRINK (${secs}s)`);
  }

  _stopCooldownTimer() {
    if (this._cooldownTimer) {
      this._cooldownTimer.remove(false);
      this._cooldownTimer = null;
    }
  }

  _resetCooldown() {
    this._cooldownEnd = 0;
    this._stopCooldownTimer();
    this._refresh();
  }

  show() {
    this._refresh();
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

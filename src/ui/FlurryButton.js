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
    this._cooldownStart = 0;
    this._cooldownEnd = 0;
    this._cooldownMs = 0;
    this._cooldownTimer = null;
    this._manualVisible = false;

    const ga = LAYOUT.gameArea;
    const btnX = ga.x + 110;
    const btnY = ga.y + ga.h - 10;
    const iconSize = 44 * 1.45;
    const half = iconSize / 2;
    const localX = half;
    const localY = -half + 5;

    this._container = scene.add.container(btnX, btnY);
    this._container.setDepth(10).setVisible(false);

    this._icon = scene.add.image(localX, localY, 'icon_flurry_button');
    this._icon.setDisplaySize(iconSize, iconSize);
    this._icon.setInteractive({ useHandCursor: true });

    // Cooldown overlay uses the same icon, tinted and cropped from bottom up.
    this._cooldownOverlay = scene.add.image(localX, localY, 'icon_flurry_button');
    this._cooldownOverlay.setDisplaySize(iconSize, iconSize);
    this._cooldownOverlay.setTint(0x1d4ed8);
    this._cooldownOverlay.setAlpha(0.68);
    this._cooldownOverlay.setVisible(false);

    this._container.add([this._icon, this._cooldownOverlay]);

    this._icon.on('pointerdown', () => this._onActivate());
    this._icon.on('pointerover', () => {
      if (this._container.visible && !this._isOnCooldown()) {
        this._icon.setAlpha(0.9);
      }
    });
    this._icon.on('pointerout', () => {
      if (this._container.visible && !this._isOnCooldown()) {
        this._icon.setAlpha(1);
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
      this._container.setVisible(true);
      this._updateCooldownVisual();
    } else {
      this._container.setVisible(false);
    }
  }

  _onActivate() {
    if (this._isOnCooldown()) return;
    if (!CombatEngine.hasTarget()) return;

    const hitCount = this._getHitCount();
    CombatEngine.activateRapidStrikes(hitCount);
    emit(EVENTS.RAPID_STRIKES_USED, { hitCount });

    this._cooldownMs = this._getCooldownMs();
    this._cooldownStart = Date.now();
    this._cooldownEnd = this._cooldownStart + this._cooldownMs;
    this._startCooldownTimer();
  }

  _startCooldownTimer() {
    this._stopCooldownTimer();
    this._updateCooldownVisual();

    this._cooldownTimer = this.scene.time.addEvent({
      delay: 40,
      loop: true,
      callback: () => this._updateCooldownVisual(),
    });
  }

  _updateCooldownVisual() {
    const remaining = this._cooldownEnd - Date.now();
    if (remaining <= 0) {
      this._stopCooldownTimer();
      this._cooldownOverlay.setVisible(false);
      this._cooldownOverlay.setCrop();
      this._icon.setAlpha(1);
      return;
    }

    const elapsed = Date.now() - this._cooldownStart;
    const progress = Math.max(0, Math.min(1, this._cooldownMs > 0 ? elapsed / this._cooldownMs : 0));
    const frameW = this._cooldownOverlay.frame.cutWidth;
    const frameH = this._cooldownOverlay.frame.cutHeight;
    const fillH = Math.round(frameH * progress);
    if (fillH <= 0) {
      this._cooldownOverlay.setVisible(false);
      this._cooldownOverlay.setCrop(0, frameH, frameW, 0);
      return;
    }
    this._cooldownOverlay.setVisible(true);
    this._cooldownOverlay.setCrop(0, frameH - fillH, frameW, fillH);
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
    this._container.setVisible(false);
  }

  setPosition(x, y) {
    this._container.setPosition(x, y);
  }

  destroy() {
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
    this._stopCooldownTimer();
    if (this._container) {
      this._container.destroy();
      this._container = null;
    }
  }
}

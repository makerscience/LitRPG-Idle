// StanceSwitcher — rotary button cycling through combat stances.
// Click cycles: flurry -> power -> fortress -> flurry.
// Positioned in the upper-left of the game area.

import Store from '../systems/Store.js';
import CombatEngine from '../systems/CombatEngine.js';
import { on, EVENTS } from '../events.js';
import { LAYOUT, STANCES, STANCE_IDS } from '../config.js';

const STANCE_COLORS = {
  flurry:   { bg: 0x1e3a5f, label: '#60a5fa' },
  power:    { bg: 0x7c2d12, label: '#fb923c' },
  fortress: { bg: 0x4a5568, label: '#a1a1aa' },
};

const RADIUS = 26;

export default class StanceSwitcher {
  constructor(scene) {
    this.scene = scene;
    this._unsubs = [];

    const ga = LAYOUT.gameArea;
    this._x = ga.x + 50;
    this._y = ga.y + 50;

    // Background circle
    this._circle = scene.add.circle(this._x, this._y, RADIUS, 0x1e3a5f);
    this._circle.setStrokeStyle(2, 0xffffff, 0.6);
    this._circle.setInteractive({ useHandCursor: true });
    this._circle.setDepth(10);

    // Stance label (initial letter)
    this._label = scene.add.text(this._x, this._y, 'P', {
      fontFamily: 'monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#fb923c',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(11);

    this._circle.on('pointerdown', () => this._cycle());
    this._circle.on('pointerover', () => this._circle.setStrokeStyle(2, 0xffffff, 1));
    this._circle.on('pointerout', () => this._circle.setStrokeStyle(2, 0xffffff, 0.6));

    this._unsubs.push(on(EVENTS.STANCE_CHANGED, ({ stanceId }) => this._updateVisual(stanceId)));
    this._unsubs.push(on(EVENTS.SAVE_LOADED, () => this._updateVisual(Store.getState().currentStance)));

    this._updateVisual(Store.getState().currentStance);
  }

  _cycle() {
    if (CombatEngine.isPlayerDead()) return;

    const current = Store.getState().currentStance;
    const idx = STANCE_IDS.indexOf(current);
    const next = STANCE_IDS[(idx + 1) % STANCE_IDS.length];
    Store.setStance(next);
  }

  _updateVisual(stanceId) {
    const colors = STANCE_COLORS[stanceId] || STANCE_COLORS.power;
    const stance = STANCES[stanceId] || STANCES.power;

    this._circle.setFillStyle(colors.bg);
    this._label.setText(stance.label[0]);
    this._label.setStyle({ color: colors.label });

    // Brief pulse on switch
    this.scene.tweens.killTweensOf(this._circle);
    this._circle.setScale(1);
    this.scene.tweens.add({
      targets: this._circle,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  show() {
    this._circle.setVisible(true);
    this._label.setVisible(true);
  }

  hide() {
    this._circle.setVisible(false);
    this._label.setVisible(false);
  }

  destroy() {
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
    this.scene.tweens.killTweensOf(this._circle);
  }
}

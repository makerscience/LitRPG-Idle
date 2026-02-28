// CorruptionIndicator — combat HUD indicator for current corruption stack state.
// Visibility is gated by UIScene and stack count (hidden at 0 stacks).

import { on, EVENTS } from '../events.js';
import { COMBAT_V2, LAYOUT } from '../config.js';
import { snapPx } from './ui-utils.js';

export default class CorruptionIndicator {
  constructor(scene) {
    this.scene = scene;
    this._unsubs = [];
    this._manualVisible = true;
    this._stacks = 0;
    this._maxStacks = COMBAT_V2.corruption?.maxStacks ?? 8;

    const ga = LAYOUT.gameArea;
    const x = snapPx(ga.x + 190);
    const y = snapPx(ga.y + 30);

    this._bg = scene.add.rectangle(x, y, 170, 24, 0x111827, 0.82)
      .setStrokeStyle(1, 0x9d174d, 0.9)
      .setDepth(10)
      .setVisible(false);

    this._text = scene.add.text(x, y, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#f9a8d4',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(11).setVisible(false);

    this._unsubs.push(on(EVENTS.CORRUPTION_CHANGED, (data) => this._onChanged(data)));
    this._unsubs.push(on(EVENTS.CORRUPTION_CLEANSED, () => this._setStacks(0)));
    this._unsubs.push(on(EVENTS.COMBAT_ENCOUNTER_ENDED, () => this._setStacks(0)));
    this._unsubs.push(on(EVENTS.SAVE_LOADED, () => this._setStacks(0)));
  }

  _onChanged(data) {
    this._maxStacks = data.maxStacks ?? this._maxStacks;
    this._setStacks(data.stacks ?? 0);
  }

  _setStacks(stacks) {
    this._stacks = Math.max(0, Math.floor(stacks));
    this._render();
  }

  _render() {
    const shouldShow = this._manualVisible && this._stacks > 0;
    this._bg.setVisible(shouldShow);
    this._text.setVisible(shouldShow);
    if (!shouldShow) return;

    const ratio = this._maxStacks > 0 ? this._stacks / this._maxStacks : 0;
    const color = ratio >= 0.75 ? '#ef4444' : ratio >= 0.4 ? '#fb7185' : '#f9a8d4';
    this._text.setStyle({ color });
    this._text.setText(`CORRUPTION ${this._stacks}/${this._maxStacks}`);
  }

  show() {
    this._manualVisible = true;
    this._render();
  }

  hide() {
    this._manualVisible = false;
    this._render();
  }

  setPosition(x, y) {
    const sx = snapPx(x);
    const sy = snapPx(y);
    this._bg.setPosition(sx, sy);
    this._text.setPosition(sx, sy);
  }

  destroy() {
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
  }
}

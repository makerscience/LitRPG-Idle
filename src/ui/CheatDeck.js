// CheatDeck — toggleable cheat cards in the bottom bar.
// Hidden until first cheat unlocked. Each card is an ON/OFF toggle button.

import Store from '../systems/Store.js';
import { on, EVENTS } from '../events.js';
import { LAYOUT, COLORS } from '../config.js';
import { getCheat, getAllCheats } from '../data/cheats.js';

export default class CheatDeck {
  constructor(scene) {
    this.scene = scene;
    this._unsubs = [];
    this._cards = [];      // { bg, border, label, statusText, cheatId, glowTween }
    this._container = scene.add.container(0, 0);
    this._labelText = null;

    const bb = LAYOUT.bottomBar;
    this._baseX = bb.x + 12;
    this._baseY = bb.y + 8;
    this._cardW = 150;
    this._cardH = 32;
    this._cardGap = 8;

    this._unsubs.push(on(EVENTS.CHEAT_UNLOCKED, () => this._rebuild()));
    this._unsubs.push(on(EVENTS.CHEAT_TOGGLED, () => this._rebuild()));
    this._unsubs.push(on(EVENTS.SAVE_LOADED, () => this._rebuild()));

    this._rebuild();
  }

  _rebuild() {
    // Clear existing cards
    this._container.removeAll(true);
    this._cards = [];
    if (this._labelText) { this._labelText.destroy(); this._labelText = null; }

    const state = Store.getState();
    const unlocked = state.unlockedCheats;

    if (!unlocked || unlocked.length === 0) {
      this._container.setVisible(false);
      return;
    }

    this._container.setVisible(true);

    // "CHEATS" header label
    this._labelText = this.scene.add.text(this._baseX, this._baseY - 2, 'CHEATS', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#666666',
    });
    this._container.add(this._labelText);

    let offsetX = this._baseX;
    const cardY = this._baseY + 10;

    for (const cheatId of unlocked) {
      const cheat = getCheat(cheatId);
      if (!cheat) continue;

      const isActive = state.activeCheats[cheatId] === true;

      // Card background
      const bg = this.scene.add.rectangle(
        offsetX + this._cardW / 2, cardY + this._cardH / 2,
        this._cardW, this._cardH,
        isActive ? 0x0a2e0a : 0x1a1a1a
      );

      // Card border
      const border = this.scene.add.rectangle(
        offsetX + this._cardW / 2, cardY + this._cardH / 2,
        this._cardW, this._cardH
      );
      border.setStrokeStyle(2, isActive ? 0x22c55e : 0x444444);
      border.setFillStyle();   // transparent fill

      // Cheat name + status text
      const statusStr = isActive ? ' ON' : ' OFF';
      const label = this.scene.add.text(offsetX + 8, cardY + 4, cheat.name, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: isActive ? '#22c55e' : '#888888',
      });

      const statusText = this.scene.add.text(
        offsetX + this._cardW - 8, cardY + 4, statusStr,
        {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: isActive ? '#22c55e' : '#666666',
        }
      );
      statusText.setOrigin(1, 0);

      // Make clickable
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        Store.toggleCheat(cheatId);
        // Dialogue now handled by DialogueManager via CHEAT_TOGGLED event
      });

      // Pulsing glow when active
      let glowTween = null;
      if (isActive) {
        glowTween = this.scene.tweens.add({
          targets: border,
          alpha: { from: 1, to: 0.4 },
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }

      this._container.add([bg, border, label, statusText]);
      this._cards.push({ bg, border, label, statusText, cheatId, glowTween });

      offsetX += this._cardW + this._cardGap;
    }
  }

  destroy() {
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
    for (const card of this._cards) {
      if (card.glowTween) card.glowTween.destroy();
    }
    this._cards = [];
    if (this._container) { this._container.destroy(true); this._container = null; }
    if (this._labelText) { this._labelText.destroy(); this._labelText = null; }
  }
}

// ZoneNav — zone arrow navigation (< Zone N >) in the game area.

import Store from '../systems/Store.js';
import { on, EVENTS } from '../events.js';
import { LAYOUT, WORLD } from '../config.js';

export default class ZoneNav {
  constructor(scene) {
    this.scene = scene;
    this._unsubs = [];

    const centerX = LAYOUT.zoneNav.centerX;
    const navY = LAYOUT.zoneNav.y;

    const textStyle = { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' };
    const arrowStyle = { fontFamily: 'monospace', fontSize: '22px', color: '#ffffff' };

    // Left arrow
    this.leftArrow = scene.add.text(centerX - 100, navY, '\u25C4', arrowStyle).setOrigin(0.5);
    this.leftArrow.setInteractive({ useHandCursor: true });
    this.leftArrow.on('pointerdown', () => this._changeZone(-1));

    // Zone label
    this.zoneLabel = scene.add.text(centerX, navY, '', textStyle).setOrigin(0.5);

    // Right arrow
    this.rightArrow = scene.add.text(centerX + 100, navY, '\u25BA', arrowStyle).setOrigin(0.5);
    this.rightArrow.setInteractive({ useHandCursor: true });
    this.rightArrow.on('pointerdown', () => this._changeZone(1));

    // Initial render
    this._refresh();

    // Subscribe to zone changes
    this._unsubs.push(on(EVENTS.WORLD_ZONE_CHANGED, () => this._refresh()));
    this._unsubs.push(on(EVENTS.SAVE_LOADED, () => this._refresh()));
  }

  _refresh() {
    const state = Store.getState();
    const zone = state.currentZone;
    this.zoneLabel.setText(`Zone ${zone}`);

    // Dim/disable at boundaries
    const atMin = zone <= 1;
    const atMax = zone >= WORLD.zoneCount;

    this.leftArrow.setAlpha(atMin ? 0.3 : 1);
    if (atMin) this.leftArrow.disableInteractive();
    else this.leftArrow.setInteractive({ useHandCursor: true });

    this.rightArrow.setAlpha(atMax ? 0.3 : 1);
    if (atMax) this.rightArrow.disableInteractive();
    else this.rightArrow.setInteractive({ useHandCursor: true });
  }

  _changeZone(delta) {
    const state = Store.getState();
    const newZone = state.currentZone + delta;
    if (newZone < 1 || newZone > WORLD.zoneCount) return;
    Store.setZone(state.currentWorld, newZone);
  }

  destroy() {
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
  }
}

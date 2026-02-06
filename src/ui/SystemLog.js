// SystemLog — scrollable green monospace log in the right 320px panel.
// Uses Phaser Container + GeometryMask for overflow clipping.

import { on, EVENTS } from '../events.js';
import { format } from '../systems/BigNum.js';
import { LAYOUT, COLORS, UI } from '../config.js';

export default class SystemLog {
  constructor(scene) {
    this.scene = scene;
    this._unsubs = [];
    this._lines = [];
    this._lineObjects = [];
    this._scrollOffset = 0;

    const { x, y, w, h } = LAYOUT.logPanel;
    this._panelX = x;
    this._panelY = y;
    this._panelW = w;
    this._panelH = h;
    this._lineHeight = 18;
    this._padding = 8;
    this._textX = x + this._padding;

    // Panel background (must be created BEFORE container so text draws on top)
    this.panelBg = scene.add.rectangle(x + w / 2, y + h / 2, w, h, COLORS.panelBg);

    // Vertical separator on left edge
    this.separator = scene.add.rectangle(x, y + h / 2, 1, h, COLORS.separator);

    // Container for log text (clipped) — added after bg so text renders on top
    this.container = scene.add.container(0, 0);

    // GeometryMask for overflow clipping
    const maskShape = scene.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillRect(x, y, w, h);
    this._mask = maskShape.createGeometryMask();
    this.container.setMask(this._mask);

    // Mouse wheel scrolling — scoped to log panel area
    scene.input.on('wheel', (_pointer, _gameObjects, _dx, dy) => {
      const pointer = scene.input.activePointer;
      if (pointer.x >= x && pointer.x <= x + w && pointer.y >= y && pointer.y <= y + h) {
        this._scroll(dy);
      }
    });

    // Track current enemy name for damage lines
    this._currentEnemyName = '';

    // Subscribe to events
    this._unsubs.push(on(EVENTS.COMBAT_ENEMY_SPAWNED, (data) => {
      this._currentEnemyName = data.name;
    }));

    // Track pending loot to combine with defeat line
    this._pendingKill = null;

    this._unsubs.push(on(EVENTS.COMBAT_ENEMY_KILLED, (data) => {
      this._pendingKill = { name: data.name, gold: null, xp: null };
    }));

    this._unsubs.push(on(EVENTS.ECON_GOLD_GAINED, (data) => {
      if (this._pendingKill) {
        this._pendingKill.gold = format(data.amount);
      } else {
        this.addLine(`+${format(data.amount)} Gold`, 'gold');
      }
      this._flushKill();
    }));

    this._unsubs.push(on(EVENTS.PROG_XP_GAINED, (data) => {
      if (this._pendingKill) {
        this._pendingKill.xp = format(data.amount);
      }
      this._flushKill();
    }));

    this._unsubs.push(on(EVENTS.PROG_LEVEL_UP, (data) => {
      this.addLine(`LEVEL UP! You are now Lv.${data.level}`, 'levelUp');
    }));

    this._unsubs.push(on(EVENTS.WORLD_ZONE_CHANGED, (data) => {
      this.addLine(`Entered Zone ${data.zone}`, 'zoneChange');
    }));

    this._unsubs.push(on(EVENTS.DIALOGUE_QUEUED, (data) => {
      this.addLine(`SYSTEM: ${data.text}`, 'system');
    }));
  }

  _flushKill() {
    const k = this._pendingKill;
    if (!k || !k.gold || !k.xp) return;
    this.addLine(`${k.name} defeated! +${k.gold} Gold, +${k.xp} XP`, 'gold');
    this._pendingKill = null;
  }

  addLine(text, type = 'default') {
    // Timestamp
    const now = new Date();
    const ts = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;

    const color = COLORS.logText[type] || COLORS.logText.default;
    const fullText = `${ts} ${text}`;

    this._lines.push({ text: fullText, color });

    // Prune oldest if over max
    if (this._lines.length > UI.logMaxLines) {
      this._lines.shift();
    }

    // Re-render and auto-scroll to bottom
    this._render();
    this._scrollToBottom();
  }

  _render() {
    // Destroy old text objects
    for (const obj of this._lineObjects) obj.destroy();
    this._lineObjects = [];

    const startY = this._panelY + this._padding + this._scrollOffset;

    for (let i = 0; i < this._lines.length; i++) {
      const { text, color } = this._lines[i];
      const yPos = startY + i * this._lineHeight;

      const textObj = this.scene.add.text(this._textX, yPos, text, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color,
        wordWrap: { width: this._panelW - this._padding * 2 },
      });

      this.container.add(textObj);
      this._lineObjects.push(textObj);
    }
  }

  _scrollToBottom() {
    const totalHeight = this._lines.length * this._lineHeight;
    const visibleHeight = this._panelH - this._padding * 2;
    if (totalHeight > visibleHeight) {
      this._scrollOffset = -(totalHeight - visibleHeight);
    } else {
      this._scrollOffset = 0;
    }
    this._updatePositions();
  }

  _scroll(dy) {
    const totalHeight = this._lines.length * this._lineHeight;
    const visibleHeight = this._panelH - this._padding * 2;
    const maxScroll = 0;
    const minScroll = -(Math.max(0, totalHeight - visibleHeight));

    this._scrollOffset -= dy * 0.5;
    this._scrollOffset = Math.max(minScroll, Math.min(maxScroll, this._scrollOffset));
    this._updatePositions();
  }

  _updatePositions() {
    const startY = this._panelY + this._padding + this._scrollOffset;
    for (let i = 0; i < this._lineObjects.length; i++) {
      this._lineObjects[i].setY(startY + i * this._lineHeight);
    }
  }

  destroy() {
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
    for (const obj of this._lineObjects) obj.destroy();
    this._lineObjects = [];
    if (this._mask) {
      this._mask.destroy();
      this._mask = null;
    }
  }
}

// SystemLog — scrollable green monospace log in the right 320px panel.
// Uses Phaser Container + GeometryMask for overflow clipping.

import { on, EVENTS } from '../events.js';
import { format } from '../systems/BigNum.js';
import { LAYOUT, COLORS, UI, LOOT, PRESTIGE } from '../config.js';
import { getItem } from '../data/items.js';
import { getUpgrade } from '../data/upgrades.js';
import { getCheat } from '../data/cheats.js';

export default class SystemLog {
  constructor(scene) {
    this.scene = scene;
    this._unsubs = [];
    this._lines = [];
    this._lineObjects = [];
    this._lineYOffsets = [];
    this._totalContentHeight = 0;
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

    // "SYSTEM LOG" header label
    this._header = scene.add.text(x + this._padding, y + 4, 'SYSTEM LOG', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#ffffff',
    });

    // Offset content below header
    this._contentY = y + 18;
    this._contentH = h - 18;

    // Container for log text (clipped) — added after bg so text renders on top
    this.container = scene.add.container(0, 0);

    // GeometryMask for overflow clipping
    const maskShape = scene.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillRect(x, this._contentY, w, this._contentH);
    this._mask = maskShape.createGeometryMask();
    this.container.setMask(this._mask);

    // Mouse wheel scrolling — scoped to log panel area
    this._onWheel = (_pointer, _gameObjects, _dx, dy) => {
      const pointer = scene.input.activePointer;
      if (pointer.x >= x && pointer.x <= x + w && pointer.y >= y && pointer.y <= y + h) {
        this._scroll(dy);
      }
    };
    scene.input.on('wheel', this._onWheel);

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

    // Loot / Inventory events
    this._unsubs.push(on(EVENTS.LOOT_DROPPED, (data) => {
      const item = getItem(data.itemId);
      const name = item ? item.name : data.itemId;
      const rarity = data.rarity ? data.rarity.charAt(0).toUpperCase() + data.rarity.slice(1) : 'Common';
      const countStr = data.count > 1 ? `${data.count}x ` : '';
      this.addLine(`Dropped: ${countStr}${name} (${rarity})`, 'loot');
    }));

    this._unsubs.push(on(EVENTS.INV_ITEM_EQUIPPED, (data) => {
      const item = getItem(data.itemId);
      if (!item) return;
      const stat = item.statBonuses.atk > 0 ? `+${item.statBonuses.atk} ATK` : `+${item.statBonuses.def} DEF`;
      this.addLine(`Equipped ${item.name} [${stat}]`, 'loot');
    }));

    this._unsubs.push(on(EVENTS.INV_ITEM_SOLD, (data) => {
      const item = getItem(data.itemId);
      const name = item ? item.name : data.itemId;
      this.addLine(`Sold ${data.count}x ${name} for ${data.goldGained} Gold`, 'gold');
    }));

    this._unsubs.push(on(EVENTS.INV_FULL, () => {
      this.addLine('Inventory full!', 'default');
    }));

    // Upgrade purchased
    this._unsubs.push(on(EVENTS.UPG_PURCHASED, (data) => {
      const upgrade = getUpgrade(data.upgradeId);
      const name = upgrade ? upgrade.name : data.upgradeId;
      this.addLine(`Purchased ${name} (Lv.${data.level})`, 'system');
    }));

    // Glitch fragment gained
    this._unsubs.push(on(EVENTS.ECON_FRAGMENTS_GAINED, (data) => {
      this.addLine(`+${format(data.amount)} Glitch Fragment`, 'loot');
    }));

    // Item merged
    this._unsubs.push(on(EVENTS.INV_ITEM_MERGED, (data) => {
      const source = getItem(data.itemId);
      const target = getItem(data.targetItemId);
      const srcName = source ? source.name : data.itemId;
      const tgtName = target ? target.name : data.targetItemId;
      const consumed = data.merges * LOOT.mergeThreshold;
      this.addLine(`Merged ${consumed}x ${srcName} → ${data.merges}x ${tgtName}`, 'loot');
    }));

    // Cheat unlocked
    this._unsubs.push(on(EVENTS.CHEAT_UNLOCKED, (data) => {
      const cheat = getCheat(data.cheatId);
      const name = cheat ? cheat.name : data.cheatId;
      this.addLine(`CHEAT UNLOCKED: ${name}`, 'system');
    }));

    // Cheat toggled
    this._unsubs.push(on(EVENTS.CHEAT_TOGGLED, (data) => {
      const cheat = getCheat(data.cheatId);
      const name = cheat ? cheat.name : data.cheatId;
      const status = data.active ? 'ACTIVATED' : 'DEACTIVATED';
      this.addLine(`Cheat ${name}: ${status}`, 'system');
    }));

    // Prestige available
    this._unsubs.push(on(EVENTS.PRESTIGE_AVAILABLE, () => {
      this.addLine('PRESTIGE available! Press [P] or click the button.', 'prestige');
    }));

    // Prestige performed
    this._unsubs.push(on(EVENTS.PRESTIGE_PERFORMED, (data) => {
      const mult = PRESTIGE.multiplierFormula(data.count);
      this.addLine(`PRESTIGE #${data.count}! Multiplier: x${mult.toFixed(2)}`, 'prestige');
    }));
  }

  _flushKill() {
    const k = this._pendingKill;
    if (!k || !k.gold || !k.xp) return;
    this.addLine(`${k.name} defeated! +${k.gold} Gold, +${k.xp} XP`, 'defeat');
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
    this._lineYOffsets = [];

    let cumY = 0;

    for (let i = 0; i < this._lines.length; i++) {
      const { text, color } = this._lines[i];

      const textObj = this.scene.add.text(this._textX, 0, text, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color,
        wordWrap: { width: this._panelW - this._padding * 2 },
      });

      this._lineYOffsets.push(cumY);
      cumY += textObj.height + 4; // 4px gap between entries

      this.container.add(textObj);
      this._lineObjects.push(textObj);
    }

    this._totalContentHeight = cumY;
    this._updatePositions();
  }

  _scrollToBottom() {
    const visibleHeight = this._contentH - this._padding;
    if (this._totalContentHeight > visibleHeight) {
      this._scrollOffset = -(this._totalContentHeight - visibleHeight);
    } else {
      this._scrollOffset = 0;
    }
    this._updatePositions();
  }

  _scroll(dy) {
    const visibleHeight = this._contentH - this._padding;
    const maxScroll = 0;
    const minScroll = -(Math.max(0, this._totalContentHeight - visibleHeight));

    this._scrollOffset -= dy * 0.5;
    this._scrollOffset = Math.max(minScroll, Math.min(maxScroll, this._scrollOffset));
    this._updatePositions();
  }

  _updatePositions() {
    const startY = this._contentY + this._scrollOffset;
    for (let i = 0; i < this._lineObjects.length; i++) {
      this._lineObjects[i].setY(startY + this._lineYOffsets[i]);
    }
  }

  destroy() {
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
    if (this._onWheel) {
      this.scene.input.off('wheel', this._onWheel);
      this._onWheel = null;
    }
    for (const obj of this._lineObjects) obj.destroy();
    this._lineObjects = [];
    if (this._mask) {
      this._mask.destroy();
      this._mask = null;
    }
    if (this._header) {
      this._header.destroy();
      this._header = null;
    }
  }
}

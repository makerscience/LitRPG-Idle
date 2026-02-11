// ScrollableLog — base class for scrollable text panels (SystemLog, SystemDialogue).
// Handles: container, mask, scroll, render, line management.

import { COLORS } from '../config.js';

export default class ScrollableLog {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} opts
   * @param {number} opts.x        - Panel x
   * @param {number} opts.y        - Panel y
   * @param {number} opts.width    - Panel width
   * @param {number} opts.height   - Panel height
   * @param {number} opts.maxLines - Max lines before pruning
   * @param {string} opts.headerText - Header label text
   * @param {object} [opts.headerStyle] - Header text style overrides
   * @param {number} [opts.headerHeight=18] - Height of header area
   */
  constructor(scene, opts) {
    this.scene = scene;
    this._unsubs = [];
    this._lines = [];
    this._lineObjects = [];
    this._lineYOffsets = [];
    this._totalContentHeight = 0;
    this._scrollOffset = 0;

    this._panelX = opts.x;
    this._panelY = opts.y;
    this._panelW = opts.width;
    this._panelH = opts.height;
    this._maxLines = opts.maxLines;
    this._padding = 8;
    this._textX = opts.x + this._padding;

    const headerHeight = opts.headerHeight ?? 18;

    // Panel background
    this.panelBg = scene.add.rectangle(
      opts.x + opts.width / 2, opts.y + opts.height / 2,
      opts.width, opts.height, COLORS.panelBg
    );

    // Vertical separator on left edge
    this.separator = scene.add.rectangle(
      opts.x, opts.y + opts.height / 2, 1, opts.height, COLORS.separator
    );

    // Header label
    this._header = scene.add.text(opts.x + this._padding, opts.y + 4, opts.headerText, {
      fontFamily: 'monospace', fontSize: '9px', color: '#ffffff',
      ...(opts.headerStyle || {}),
    });

    // Content area below header
    this._contentY = opts.y + headerHeight;
    this._contentH = opts.height - headerHeight;

    // Container for text (clipped)
    this.container = scene.add.container(0, 0);

    // GeometryMask for overflow clipping
    const maskShape = scene.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillRect(opts.x, this._contentY, opts.width, this._contentH);
    this._mask = maskShape.createGeometryMask();
    this.container.setMask(this._mask);

    // Mouse wheel scrolling — scoped to panel area
    this._onWheel = (_pointer, _gameObjects, _dx, dy) => {
      const pointer = scene.input.activePointer;
      if (pointer.x >= opts.x && pointer.x <= opts.x + opts.width &&
          pointer.y >= opts.y && pointer.y <= opts.y + opts.height) {
        this._scroll(dy);
      }
    };
    scene.input.on('wheel', this._onWheel);
  }

  /** Override in subclass to format a line into { text, style } for rendering. */
  _getLineStyle(line) {
    return { fontSize: '11px', fontStyle: 'normal', color: '#ffffff' };
  }

  /** Override in subclass to get the gap after a line. */
  _getLineGap(_line) {
    return 4;
  }

  _addLineData(lineData) {
    this._lines.push(lineData);
    while (this._lines.length > this._maxLines) {
      this._lines.shift();
    }
    this._render();
    this._scrollToBottom();
  }

  _render() {
    for (const obj of this._lineObjects) obj.destroy();
    this._lineObjects = [];
    this._lineYOffsets = [];

    let cumY = 0;
    for (let i = 0; i < this._lines.length; i++) {
      const line = this._lines[i];
      const style = this._getLineStyle(line);

      const textObj = this.scene.add.text(this._textX, 0, line.text, {
        fontFamily: 'monospace',
        fontSize: style.fontSize,
        fontStyle: style.fontStyle,
        color: style.color,
        wordWrap: { width: this._panelW - this._padding * 2 },
      });

      this._lineYOffsets.push(cumY);
      cumY += textObj.height + this._getLineGap(line);

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
    if (this._mask) { this._mask.destroy(); this._mask = null; }
    if (this._header) { this._header.destroy(); this._header = null; }
  }
}

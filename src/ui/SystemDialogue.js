// SystemDialogue — SYSTEM narrator window with emotion-based styling.
// Sits above the SystemLog, shows only SYSTEM dialogue lines.

import { on, EVENTS } from '../events.js';
import { LAYOUT, COLORS, UI } from '../config.js';

/** Emotion → text style mapping. */
const EMOTION_STYLES = {
  sarcastic: { fontSize: '12px', fontStyle: 'normal', color: COLORS.emotion.sarcastic },
  angry:     { fontSize: '14px', fontStyle: 'bold',   color: COLORS.emotion.angry },
  impressed: { fontSize: '13px', fontStyle: 'bold',   color: COLORS.emotion.impressed },
  worried:   { fontSize: '12px', fontStyle: 'italic', color: COLORS.emotion.worried },
  neutral:   { fontSize: '11px', fontStyle: 'normal', color: COLORS.emotion.neutral },
};

export default class SystemDialogue {
  constructor(scene) {
    this.scene = scene;
    this._unsubs = [];
    this._lines = [];
    this._lineObjects = [];
    this._lineYOffsets = [];
    this._totalContentHeight = 0;
    this._scrollOffset = 0;

    const { x, y, w, h } = LAYOUT.dialoguePanel;
    this._panelX = x;
    this._panelY = y;
    this._panelW = w;
    this._panelH = h;
    this._padding = 8;
    this._textX = x + this._padding;

    // Panel background
    this.panelBg = scene.add.rectangle(x + w / 2, y + h / 2, w, h, COLORS.panelBg);

    // Vertical separator on left edge
    this.separator = scene.add.rectangle(x, y + h / 2, 1, h, COLORS.separator);

    // "SYSTEM'S LOG" header label
    this._header = scene.add.text(x + this._padding, y + 4, "SYSTEM'S LOG", {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#22c55e',
      fontStyle: 'bold',
    });

    // Content area starts below header
    this._contentY = y + 28;
    this._contentH = h - 28;

    // Container for dialogue text (clipped)
    this.container = scene.add.container(0, 0);

    // GeometryMask for overflow clipping
    const maskShape = scene.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillRect(x, this._contentY, w, this._contentH);
    this._mask = maskShape.createGeometryMask();
    this.container.setMask(this._mask);

    // Mouse wheel scrolling — scoped to dialogue panel area
    this._onWheel = (_pointer, _gameObjects, _dx, dy) => {
      const pointer = scene.input.activePointer;
      if (pointer.x >= x && pointer.x <= x + w && pointer.y >= y && pointer.y <= y + h) {
        this._scroll(dy);
      }
    };
    scene.input.on('wheel', this._onWheel);

    // Subscribe to dialogue events
    this._unsubs.push(on(EVENTS.DIALOGUE_QUEUED, (data) => {
      this.addLine(data.text, data.emotion || 'sarcastic', data.context);
    }));
  }

  addLine(text, emotion = 'sarcastic', context) {
    // If context is provided, push a dim context line first
    if (context) {
      this._lines.push({ text: `> ${context}`, type: 'context' });
    }

    const now = new Date();
    const ts = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
    this._lines.push({ text: `${ts} ${text}`, emotion, type: 'dialogue' });

    // Prune oldest if over max (context + response both count)
    while (this._lines.length > UI.dialogueMaxLines) {
      this._lines.shift();
    }

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
      const line = this._lines[i];
      let textStyle;

      if (line.type === 'context') {
        textStyle = { fontSize: '10px', fontStyle: 'normal', color: '#a1a1aa' };
      } else {
        const emotionStyle = EMOTION_STYLES[line.emotion] || EMOTION_STYLES.sarcastic;
        textStyle = { fontSize: emotionStyle.fontSize, fontStyle: emotionStyle.fontStyle, color: emotionStyle.color };
      }

      const textObj = this.scene.add.text(this._textX, 0, line.text, {
        fontFamily: 'monospace',
        fontSize: textStyle.fontSize,
        fontStyle: textStyle.fontStyle,
        color: textStyle.color,
        wordWrap: { width: this._panelW - this._padding * 2 },
      });

      this._lineYOffsets.push(cumY);
      cumY += textObj.height + (line.type === 'context' ? 2 : 4);

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

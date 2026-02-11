// SystemDialogue — SYSTEM narrator window with emotion-based styling.
// Sits above the SystemLog, shows only SYSTEM dialogue lines.

import ScrollableLog from './ScrollableLog.js';
import { on, EVENTS } from '../events.js';
import { LAYOUT, COLORS, UI } from '../config.js';

/** Emotion -> text style mapping. */
const EMOTION_STYLES = {
  sarcastic: { fontSize: '12px', fontStyle: 'normal', color: COLORS.emotion.sarcastic },
  angry:     { fontSize: '14px', fontStyle: 'bold',   color: COLORS.emotion.angry },
  impressed: { fontSize: '13px', fontStyle: 'bold',   color: COLORS.emotion.impressed },
  worried:   { fontSize: '12px', fontStyle: 'italic', color: COLORS.emotion.worried },
  neutral:   { fontSize: '11px', fontStyle: 'normal', color: COLORS.emotion.neutral },
};

export default class SystemDialogue extends ScrollableLog {
  constructor(scene) {
    const dp = LAYOUT.dialoguePanel;
    super(scene, {
      x: dp.x, y: dp.y, width: dp.w, height: dp.h,
      maxLines: UI.dialogueMaxLines,
      headerText: "SYSTEM'S LOG",
      headerStyle: { fontSize: '18px', color: '#22c55e', fontStyle: 'bold' },
      headerHeight: 28,
    });

    this._unsubs.push(on(EVENTS.DIALOGUE_QUEUED, (data) => {
      this.addLine(data.text, data.emotion || 'sarcastic', data.context);
    }));
  }

  _getLineStyle(line) {
    if (line.type === 'context') {
      return { fontSize: '10px', fontStyle: 'normal', color: '#a1a1aa' };
    }
    return EMOTION_STYLES[line.emotion] || EMOTION_STYLES.sarcastic;
  }

  _getLineGap(line) {
    return line.type === 'context' ? 2 : 4;
  }

  addLine(text, emotion = 'sarcastic', context) {
    if (context) {
      this._addLineData({ text: `> ${context}`, type: 'context' });
    }

    const now = new Date();
    const ts = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
    this._addLineData({ text: `${ts} ${text}`, emotion, type: 'dialogue' });
  }
}

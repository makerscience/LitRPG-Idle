// UI utilities — small helpers that eliminate scattered boilerplate.

/** Create a text button with hover states. Returns the Phaser Text object. */
export function makeButton(scene, x, y, text, { bg = '#333333', hoverBg = '#555555', color = '#ffffff', fontSize = '11px', padding, onDown } = {}) {
  const pad = padding ?? { x: 6, y: 3 };
  const btn = scene.add.text(x, y, text, {
    fontFamily: 'monospace', fontSize, color,
    backgroundColor: bg, padding: pad,
  }).setInteractive({ useHandCursor: true });

  if (onDown) btn.on('pointerdown', onDown);
  btn.on('pointerover', () => btn.setStyle({ backgroundColor: hoverBg }));
  btn.on('pointerout', () => btn.setStyle({ backgroundColor: bg }));
  return btn;
}

/** Preset text styles (every UI text uses monospace). */
export const TEXT_STYLES = {
  panelTitle:  { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', fontStyle: 'bold' },
  sectionHead: { fontFamily: 'monospace', fontSize: '13px', color: '#818cf8' },
  label:       { fontFamily: 'monospace', fontSize: '11px', color: '#a1a1aa' },
  value:       { fontFamily: 'monospace', fontSize: '11px', color: '#ffffff' },
  small:       { fontFamily: 'monospace', fontSize: '9px',  color: '#6b7280' },
  body:        { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' },
};

/** Add text with a preset style. Returns the Phaser Text object. */
export function addText(scene, x, y, text, styleName, overrides = {}) {
  const base = TEXT_STYLES[styleName] || TEXT_STYLES.label;
  return scene.add.text(x, y, text, { ...base, ...overrides });
}

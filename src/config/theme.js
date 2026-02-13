// Visual theming: colors, zone palettes, parallax, damage number tiers.

export const COLORS = {
  panelBg:      0x111111,
  topBarBg:     0x0a0a0a,
  separator:    0x333333,
  emotion: {
    sarcastic:  '#eab308',
    angry:      '#ef4444',
    impressed:  '#22c55e',
    worried:    '#38bdf8',
    neutral:    '#e5e5e5',
  },
  logText: {
    combat:     '#22c55e',
    gold:       '#eab308',
    system:     '#eab308',
    levelUp:    '#818cf8',
    zoneChange: '#38bdf8',
    loot:       '#a855f7',
    defeat:     '#e5e5e5',
    prestige:   '#f59e0b',
    warning:    '#f97316',
    dot:        '#ef4444',
    default:    '#a1a1aa',
  },
  rarity: {
    common:   '#a1a1aa',
    uncommon: '#22c55e',
    rare:     '#3b82f6',
    epic:     '#a855f7',
  },
  xpBar: {
    bg:         0x374151,
    fill:       0x6366f1,
  },
};

export const ZONE_THEMES = {
  1: {
    layers: [0x1a2a1a, 0x0d1f0d, 0x0a1a0a],
    images: ['bg002_rear', 'bg002_mid'],
    trees: ['fg_tree003', 'fg_tree004'],
    ferns: ['fern', 'fern002'],
  },
  2: { layers: [0x1a2e1a, 0x152815, 0x0d1f0d] },
  3: { layers: [0x1a1a2e, 0x15152b, 0x0d0d1f] },
};

export const PARALLAX = {
  baseSpeedPxPerSec: 9,
  treeDiagRatio: 0.1,
  fernDiagRatio: 0.04,
};

export const TREE_ROWS = [
  {
    count: 24,
    speedMult: 0.48,
    scaleRange: [0.15, 0.22],
    yRange: [0.45, 0.50],
    depth: -0.45,
    alpha: 0.5,
    diagMult: 0.65,
    growRange: [0.8, 1.5],
    keys: ['fg_tree003', 'fg_tree004'],
  },
  {
    count: 16,
    speedMult: 0.7,
    scaleRange: [0.22, 0.32],
    yRange: [0.53, 0.58],
    depth: -0.35,
    alpha: 0.7,
    diagMult: 0.65,
    growRange: [0.8, 1.5],
    keys: ['fg_tree003', 'fg_tree004'],
  },
  {
    count: 12,
    speedMult: 1.0,
    scaleRange: [0.35, 0.45],
    yRange: [0.61, 0.66],
    depth: -0.15,
    alpha: 0.9,
    diagMult: 1.2,
    growRange: [0.8, 1.5],
    keys: ['fg_tree003', 'fg_tree004'],
  },
];

export const FERN_ROWS = [
  { speedMult: 0.54, scaleRange: [0.084, 0.112], depth: -0.4, alpha: 0.85, xSpacingMult: 0.6, growRange: [0.9, 1.1] },
  { speedMult: 0.85, scaleRange: [0.096, 0.128], depth: -0.25, alpha: 0.9, xSpacingMult: 0.3, growRange: [0.9, 1.1] },
  { speedMult: 1.0, scaleRange: [0.135, 0.18], depth: -0.14, alpha: 0.85, xSpacingMult: 0.58, growRange: [0.9, 1.1] },
  { speedMult: 1.0, scaleRange: [0.18, 0.24], depth: -0.12, alpha: 0.9, xSpacingMult: 0.28, growRange: [0.9, 1.1] },
];

export const UI = {
  formatThresholds: {
    thousand: 1e3,
    million: 1e6,
    billion: 1e9,
  },
  damageNumbers: {
    duration: 1000,
    floatDistance: 60,
    tiers: [
      { min: 0,      fontSize: 22, color: '#ffffff', style: 'bold',   shake: 0 },
      { min: 100,    fontSize: 26, color: '#ffffff', style: 'bold',   shake: 0 },
      { min: 1000,   fontSize: 30, color: '#fde047', style: 'bold',   shake: 0 },
      { min: 100000, fontSize: 34, color: '#fbbf24', style: 'bold',   shake: 0.002 },
      { min: 1e6,    fontSize: 40, color: '#fbbf24', style: 'bold',   shake: 0.004 },
    ],
    critBonusSize: 6,
  },
  logMaxLines: 50,
  dialogueMaxLines: 20,
};

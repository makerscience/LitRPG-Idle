// UI layout and positioning constants.

export const LAYOUT = {
  topBar:         { x: 0, y: 0, w: 1280, h: 50 },
  gameArea:       { x: 0, y: 50, w: 960, h: 670 },
  dialoguePanel:  { x: 960, y: 50, w: 320, h: 150 },
  logPanel:       { x: 960, y: 201, w: 320, h: 519 },
  bottomBar:      { x: 0, y: 670, w: 960, h: 50 },
  zoneNav:        { y: 70, centerX: 480 },
};

export const TERRITORY = {
  nodeRadius: 28,
  colors: {
    locked:    0x444444,
    unlocked:  0x666666,
    claimable: 0x22c55e,
    conquered: 0xeab308,
  },
  infoPanelX: 600,
  infoPanelW: 340,
};

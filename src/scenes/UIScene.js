// UIScene — parallel overlay scene orchestrating TopBar, SystemLog, ZoneNav.
// Launched by GameScene, not started (runs in parallel).

import Phaser from 'phaser';
import TopBar from '../ui/TopBar.js';
import SystemLog from '../ui/SystemLog.js';
import ZoneNav from '../ui/ZoneNav.js';
import DialogueManager from '../systems/DialogueManager.js';
import { LAYOUT, COLORS } from '../config.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    // Panel backgrounds drawn first (behind UI components)
    const ga = LAYOUT.gameArea;
    const bb = LAYOUT.bottomBar;

    // Bottom placeholder bar (for Phase 6 cheat deck)
    this.add.rectangle(bb.x + bb.w / 2, bb.y + bb.h / 2, bb.w, bb.h, COLORS.panelBg);

    // Bottom separator
    this.add.rectangle(ga.x + ga.w / 2, bb.y, ga.w, 1, COLORS.separator);

    // Initialize UI components
    this.topBar = new TopBar(this);
    this.systemLog = new SystemLog(this);
    this.zoneNav = new ZoneNav(this);

    // Initialize dialogue triggers
    DialogueManager.init();

    this.events.on('shutdown', () => this._shutdown());

    console.log('[UIScene] create — UI overlay initialized');
  }

  _shutdown() {
    if (this.topBar) { this.topBar.destroy(); this.topBar = null; }
    if (this.systemLog) { this.systemLog.destroy(); this.systemLog = null; }
    if (this.zoneNav) { this.zoneNav.destroy(); this.zoneNav = null; }
    DialogueManager.destroy();
    console.log('[UIScene] shutdown — cleaned up');
  }
}

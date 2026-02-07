// UIScene — parallel overlay scene orchestrating TopBar, SystemLog, ZoneNav.
// Launched by GameScene, not started (runs in parallel).

import Phaser from 'phaser';
import TopBar from '../ui/TopBar.js';
import SystemLog from '../ui/SystemLog.js';
import ZoneNav from '../ui/ZoneNav.js';
import InventoryPanel from '../ui/InventoryPanel.js';
import UpgradePanel from '../ui/UpgradePanel.js';
import PrestigePanel from '../ui/PrestigePanel.js';
import CheatDeck from '../ui/CheatDeck.js';
import DialogueManager from '../systems/DialogueManager.js';
import FirstCrackDirector from '../systems/FirstCrackDirector.js';
import CheatManager from '../systems/CheatManager.js';
import PrestigeManager from '../systems/PrestigeManager.js';
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
    this.inventoryPanel = new InventoryPanel(this);
    this.upgradePanel = new UpgradePanel(this);
    this.prestigePanel = new PrestigePanel(this);
    this.cheatDeck = new CheatDeck(this);

    // Initialize dialogue triggers + First Crack director + cheat manager + prestige
    DialogueManager.init();
    FirstCrackDirector.init();
    CheatManager.init();
    PrestigeManager.init();

    this.events.on('shutdown', () => this._shutdown());

    console.log('[UIScene] create — UI overlay initialized');
  }

  _shutdown() {
    if (this.topBar) { this.topBar.destroy(); this.topBar = null; }
    if (this.systemLog) { this.systemLog.destroy(); this.systemLog = null; }
    if (this.zoneNav) { this.zoneNav.destroy(); this.zoneNav = null; }
    if (this.inventoryPanel) { this.inventoryPanel.destroy(); this.inventoryPanel = null; }
    if (this.upgradePanel) { this.upgradePanel.destroy(); this.upgradePanel = null; }
    if (this.prestigePanel) { this.prestigePanel.destroy(); this.prestigePanel = null; }
    if (this.cheatDeck) { this.cheatDeck.destroy(); this.cheatDeck = null; }
    DialogueManager.destroy();
    FirstCrackDirector.destroy();
    CheatManager.destroy();
    PrestigeManager.destroy();
    console.log('[UIScene] shutdown — cleaned up');
  }
}

// UIScene — parallel overlay scene orchestrating TopBar, SystemLog, ZoneNav.
// Launched by GameScene, not started (runs in parallel).

import Phaser from 'phaser';
import TopBar from '../ui/TopBar.js';
import SystemDialogue from '../ui/SystemDialogue.js';
import SystemLog from '../ui/SystemLog.js';
import ZoneNav from '../ui/ZoneNav.js';
import BossChallenge from '../ui/BossChallenge.js';
import InventoryPanel from '../ui/InventoryPanel.js';
import UpgradePanel from '../ui/UpgradePanel.js';
import PrestigePanel from '../ui/PrestigePanel.js';
import SettingsPanel from '../ui/SettingsPanel.js';
import StatsPanel from '../ui/StatsPanel.js';
import CheatDeck from '../ui/CheatDeck.js';
import DialogueManager from '../systems/DialogueManager.js';
import FirstCrackDirector from '../systems/FirstCrackDirector.js';
import CheatManager from '../systems/CheatManager.js';
import PrestigeManager from '../systems/PrestigeManager.js';
import { FEATURES } from '../config/features.js';
import { LAYOUT, COLORS } from '../config.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    // Crisp text rendering for UI — GameScene leaves this off for smooth parallax
    this.cameras.main.roundPixels = true;

    // Panel backgrounds drawn first (behind UI components)
    const ga = LAYOUT.gameArea;
    const bb = LAYOUT.bottomBar;

    // Bottom placeholder bar (for Phase 6 cheat deck)
    this.add.rectangle(bb.x + bb.w / 2, bb.y + bb.h / 2, bb.w, bb.h, COLORS.panelBg);

    // Bottom separator
    this.add.rectangle(ga.x + ga.w / 2, bb.y, ga.w, 1, COLORS.separator);

    // Initialize UI components
    this.topBar = new TopBar(this);
    this.systemDialogue = new SystemDialogue(this);

    // Separator between dialogue panel and system log
    const dp = LAYOUT.dialoguePanel;
    this.add.rectangle(dp.x + dp.w / 2, dp.y + dp.h, dp.w, 1, COLORS.separator);

    this.systemLog = new SystemLog(this);
    this.zoneNav = new ZoneNav(this);
    this.bossChallenge = new BossChallenge(this);
    this.inventoryPanel = new InventoryPanel(this);
    this.upgradePanel = new UpgradePanel(this);
    this.settingsPanel = new SettingsPanel(this);
    this.statsPanel = new StatsPanel(this);

    // Modal registry for mutual exclusion
    this._modals = [
      this.inventoryPanel, this.upgradePanel,
      this.settingsPanel, this.statsPanel,
    ];

    // Gated: prestige panel
    this.prestigePanel = null;
    if (FEATURES.prestigeEnabled) {
      this.prestigePanel = new PrestigePanel(this);
      this._modals.push(this.prestigePanel);
    }

    // Gated: cheat deck
    this.cheatDeck = null;
    if (FEATURES.cheatsEnabled) {
      this.cheatDeck = new CheatDeck(this);
    }

    // Initialize dialogue triggers
    DialogueManager.init();

    // Gated system managers
    if (FEATURES.cheatsEnabled) {
      FirstCrackDirector.init();
      CheatManager.init();
    }
    if (FEATURES.prestigeEnabled) {
      PrestigeManager.init();
    }

    // MAP button in bottom bar (gated on territory)
    this._mapOpen = false;
    this._mapBtn = null;
    this._mKey = null;
    if (FEATURES.territoryEnabled) {
      const mapBx = bb.x + bb.w / 2 - 240;
      const mapBy = bb.y + bb.h / 2;
      this._mapBtn = this.add.text(mapBx, mapBy, 'MAP [M]', {
        fontFamily: 'monospace', fontSize: '14px', color: '#38bdf8',
        backgroundColor: '#333333', padding: { x: 12, y: 6 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      this._mapBtn.on('pointerdown', () => this._toggleMap());
      this._mapBtn.on('pointerover', () => this._mapBtn.setStyle({ backgroundColor: '#555555' }));
      this._mapBtn.on('pointerout', () => this._mapBtn.setStyle({ backgroundColor: '#333333' }));

      this._mKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
      this._mKey.on('down', () => this._toggleMap());
    }

    this.events.on('shutdown', () => this._shutdown());

    console.log('[UIScene] create — UI overlay initialized');
  }

  /** Close all open modals, optionally excluding one. Used by ModalPanel._open(). */
  closeAllModals(except) {
    for (const modal of this._modals) {
      if (modal && modal !== except && modal._isOpen) {
        modal._close();
      }
    }
  }

  _toggleMap() {
    if (!FEATURES.territoryEnabled) return;
    this.closeAllModals();

    const overworldScene = this.scene.get('OverworldScene');
    if (overworldScene.scene.isSleeping()) {
      overworldScene.scene.wake();
      this.zoneNav.hide();
      this.bossChallenge.hide();
      this._mapOpen = true;
    } else {
      overworldScene.scene.sleep();
      this.zoneNav.show();
      this.bossChallenge.show();
      this._mapOpen = false;
    }
  }

  _shutdown() {
    if (this.topBar) { this.topBar.destroy(); this.topBar = null; }
    if (this.systemDialogue) { this.systemDialogue.destroy(); this.systemDialogue = null; }
    if (this.systemLog) { this.systemLog.destroy(); this.systemLog = null; }
    if (this.zoneNav) { this.zoneNav.destroy(); this.zoneNav = null; }
    if (this.bossChallenge) { this.bossChallenge.destroy(); this.bossChallenge = null; }
    for (const modal of this._modals || []) {
      if (modal) modal.destroy();
    }
    this.inventoryPanel = null;
    this.upgradePanel = null;
    this.prestigePanel = null;
    this.settingsPanel = null;
    this.statsPanel = null;
    this._modals = [];
    if (this.cheatDeck) { this.cheatDeck.destroy(); this.cheatDeck = null; }
    DialogueManager.destroy();
    if (FEATURES.cheatsEnabled) {
      FirstCrackDirector.destroy();
      CheatManager.destroy();
    }
    if (FEATURES.prestigeEnabled) {
      PrestigeManager.destroy();
    }
    console.log('[UIScene] shutdown — cleaned up');
  }
}

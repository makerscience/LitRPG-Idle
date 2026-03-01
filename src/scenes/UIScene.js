// UIScene — parallel overlay scene orchestrating TopBar, SystemLog, ZoneNav.
// Launched by GameScene, not started (runs in parallel).

import Phaser from 'phaser';
import Store from '../systems/Store.js';
import TopBar from '../ui/TopBar.js';
import SystemDialogue from '../ui/SystemDialogue.js';
import SystemLog from '../ui/SystemLog.js';
import ZoneNav from '../ui/ZoneNav.js';
import BossChallenge from '../ui/BossChallenge.js';
import DrinkButton from '../ui/DrinkButton.js';
import SmashButton from '../ui/SmashButton.js';
import FlurryButton from '../ui/FlurryButton.js';
import BulwarkButton from '../ui/BulwarkButton.js';
import ArmorBreakButton from '../ui/ArmorBreakButton.js';
import InterruptButton from '../ui/InterruptButton.js';
import CleanseButton from '../ui/CleanseButton.js';
import CorruptionIndicator from '../ui/CorruptionIndicator.js';
import StanceSwitcher from '../ui/StanceSwitcher.js';
import InventoryPanel from '../ui/InventoryPanel.js';
import UpgradePanel from '../ui/UpgradePanel.js';
import PrestigePanel from '../ui/PrestigePanel.js';
import SettingsPanel from '../ui/SettingsPanel.js';
import StatsPanel from '../ui/StatsPanel.js';
import CheatDeck from '../ui/CheatDeck.js';
import OnboardingPopup from '../ui/OnboardingPopup.js';
import DialogueManager from '../systems/DialogueManager.js';
import SkillUnlockDirector from '../systems/SkillUnlockDirector.js';
import FirstCrackDirector from '../systems/FirstCrackDirector.js';
import CheatManager from '../systems/CheatManager.js';
import PrestigeManager from '../systems/PrestigeManager.js';
import { on, EVENTS } from '../events.js';
import { FEATURES } from '../config/features.js';
import { LAYOUT, COLORS } from '../config.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
    this._unsubs = [];
    this._mapOpen = false;
    this._demoEndContainer = null;
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
    this.systemDialogue = null;
    this.systemLog = null;
    if (FEATURES.systemLogsEnabled) {
      this.systemDialogue = new SystemDialogue(this);

      // Separator between dialogue panel and system log
      const dp = LAYOUT.dialoguePanel;
      this.add.rectangle(dp.x + dp.w / 2, dp.y + dp.h, dp.w, 1, COLORS.separator);

      this.systemLog = new SystemLog(this);
    }
    this.zoneNav = new ZoneNav(this);
    this.bossChallenge = new BossChallenge(this);
    this.drinkButton = new DrinkButton(this);
    this.smashButton = new SmashButton(this);
    this.flurryButton = new FlurryButton(this);
    this.bulwarkButton = new BulwarkButton(this);
    this.armorBreakButton = new ArmorBreakButton(this);
    this.interruptButton = new InterruptButton(this);
    this.cleanseButton = new CleanseButton(this);
    this.stanceSwitcher = new StanceSwitcher(this);
    this.corruptionIndicator = new CorruptionIndicator(this);

    // Stance action layout: Slot A = primary stance skill, Slot B = trait-counter skill.
    const slotBX = ga.x + Math.round(ga.w * (110 / 960));
    const slotBY = ga.y + ga.h - 46;
    // Primary skill icons share a custom anchor near the left edge and around the player's midpoint.
    const flurryX = ga.x + 2;
    const flurryY = ga.y + ga.h - 205;
    this.smashButton.setPosition(flurryX, flurryY);
    this.flurryButton.setPosition(flurryX, flurryY);
    this.bulwarkButton.setPosition(flurryX, flurryY);
    this.armorBreakButton.setPosition(slotBX, slotBY);
    this.interruptButton.setPosition(slotBX, slotBY);
    this.cleanseButton.setPosition(slotBX, slotBY);
    this.corruptionIndicator.setPosition(ga.x + Math.round(ga.w * (190 / 960)), ga.y + 30);

    this._actionButtons = [
      this.smashButton, this.flurryButton, this.bulwarkButton,
      this.armorBreakButton, this.interruptButton, this.cleanseButton,
    ];
    this._stanceActions = {
      ruin: { slotA: this.smashButton, slotB: this.armorBreakButton },
      tempest: { slotA: this.flurryButton, slotB: this.interruptButton },
      fortress: { slotA: this.bulwarkButton, slotB: this.cleanseButton },
    };
    this._slotBUnlockFlags = {
      ruin: 'unlockedArmorBreak',
      tempest: 'unlockedInterrupt',
      fortress: 'unlockedCleanse',
    };

    this._unsubs.push(on(EVENTS.STANCE_CHANGED, () => this._refreshStanceActions()));
    this._unsubs.push(on(EVENTS.SAVE_LOADED, () => this._refreshStanceActions()));
    this._unsubs.push(on(EVENTS.SKILL_UNLOCKED, ({ skillId }) => {
      this._refreshStanceActions();
      this._pulseUnlockedSkill(skillId);
    }));
    this._unsubs.push(on(EVENTS.DEMO_COMPLETED, (data) => this._showDemoEndScreen(data)));
    this._refreshStanceActions();
    this.inventoryPanel = new InventoryPanel(this);
    this.upgradePanel = new UpgradePanel(this);
    this.settingsPanel = new SettingsPanel(this);
    this.statsPanel = new StatsPanel(this);
    this.onboardingPopup = new OnboardingPopup(this);

    // Modal registry for mutual exclusion
    this._modals = [
      this.inventoryPanel, this.upgradePanel,
      this.settingsPanel, this.statsPanel, this.onboardingPopup,
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
    SkillUnlockDirector.init();

    // Gated system managers
    if (FEATURES.cheatsEnabled) {
      FirstCrackDirector.init();
      CheatManager.init();
    }
    if (FEATURES.prestigeEnabled) {
      PrestigeManager.init();
    }

    // MAP button in bottom bar (gated on territory)
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

    // SPRITE PREVIEW button (gated on feature flag)
    this._previewOpen = false;
    this._pKey = null;
    if (FEATURES.spritePreviewEnabled) {
      this._pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this._pKey.on('down', () => this._toggleSpritePreview());
    }

    this.events.on('shutdown', () => this._shutdown());
    if (Store.getState().flags.demoCompleted) {
      this._showDemoEndScreen({ area: 1, zone: 5, name: 'Slimefang' });
    }

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

  _hideAllActionButtons() {
    for (const btn of this._actionButtons) {
      btn.hide();
    }
  }

  _refreshStanceActions() {
    this._hideAllActionButtons();
    if (this._mapOpen) {
      this.corruptionIndicator.hide();
      return;
    }

    const stance = Store.getState().currentStance;
    const actions = this._stanceActions[stance] || this._stanceActions.ruin;
    actions.slotA.show();
    const unlockFlag = this._slotBUnlockFlags[stance];
    if (unlockFlag && Store.getState().flags[unlockFlag]) {
      actions.slotB.show();
    }
    this.corruptionIndicator.show();
  }

  _pulseUnlockedSkill(skillId) {
    const buttonBySkill = {
      armorBreak: this.armorBreakButton,
      interrupt: this.interruptButton,
      cleanse: this.cleanseButton,
    };
    buttonBySkill[skillId]?.pulseUnlock?.();
  }

  _setCombatUiVisibility(visible) {
    if (visible) {
      this.zoneNav.show();
      this.bossChallenge.show();
      this.drinkButton.show();
      this.stanceSwitcher.show();
      this._refreshStanceActions();
    } else {
      this.zoneNav.hide();
      this.bossChallenge.hide();
      this.drinkButton.hide();
      this.stanceSwitcher.hide();
      this._hideAllActionButtons();
      this.corruptionIndicator.hide();
    }
  }

  _toggleMap() {
    if (!FEATURES.territoryEnabled) return;
    this.closeAllModals();

    const overworldScene = this.scene.get('OverworldScene');
    if (overworldScene.scene.isSleeping()) {
      overworldScene.scene.wake();
      this._mapOpen = true;
      this._setCombatUiVisibility(false);
    } else {
      overworldScene.scene.sleep();
      this._mapOpen = false;
      this._setCombatUiVisibility(true);
    }
  }

  _toggleSpritePreview() {
    if (!FEATURES.spritePreviewEnabled) return;
    this.closeAllModals();

    const previewScene = this.scene.get('SpritePreviewScene');
    if (previewScene.scene.isSleeping()) {
      previewScene.scene.wake();
      this._previewOpen = true;
      this._setCombatUiVisibility(false);
    } else {
      previewScene.scene.sleep();
      this._previewOpen = false;
      this._setCombatUiVisibility(true);
    }
  }

  _showDemoEndScreen(_data = null) {
    if (this._demoEndContainer) return;
    this.closeAllModals();
    this._setCombatUiVisibility(false);

    const manager = this.scene?.manager;
    if (manager?.isActive?.('GameScene') && !manager?.isPaused?.('GameScene')) {
      manager.pause('GameScene');
    }

    const ga = LAYOUT.gameArea;
    const cx = ga.x + ga.w / 2;
    const cy = ga.y + ga.h / 2;

    const backdrop = this.add.rectangle(cx, cy, ga.w, ga.h, 0x000000, 0.78)
      .setDepth(500)
      .setInteractive({ useHandCursor: true });
    const panel = this.add.rectangle(cx, cy, 760, 360, 0x111827, 0.97)
      .setStrokeStyle(3, 0x60a5fa, 0.95)
      .setDepth(501);
    const title = this.add.text(cx, cy - 104, 'DEMO COMPLETE', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#93c5fd',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(502);
    const body = this.add.text(cx, cy - 18, [
      'You defeated Slimefang and completed the first 5-zone demo.',
      '',
      'More zones and areas are coming soon.',
    ], {
      fontFamily: 'monospace',
      fontSize: '21px',
      color: '#e5e7eb',
      align: 'center',
      lineSpacing: 7,
    }).setOrigin(0.5).setDepth(502);
    const menuBtn = this.add.text(cx, cy + 112, 'RETURN TO MAIN MENU', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#f8fafc',
      backgroundColor: '#1d4ed8',
      padding: { x: 18, y: 10 },
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(503).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerover', () => menuBtn.setStyle({ backgroundColor: '#2563eb' }));
    menuBtn.on('pointerout', () => menuBtn.setStyle({ backgroundColor: '#1d4ed8' }));
    menuBtn.on('pointerdown', () => this._goToMainMenuFromDemo());

    this._demoEndContainer = this.add.container(0, 0, [backdrop, panel, title, body, menuBtn]).setDepth(500);
  }

  _goToMainMenuFromDemo() {
    const scenePlugin = this.scene;
    const manager = scenePlugin?.manager;
    if (!scenePlugin || !manager) return;

    scenePlugin.stop('OverworldScene');
    scenePlugin.stop('SpritePreviewScene');
    scenePlugin.stop('UIScene');
    scenePlugin.stop('GameScene');
    scenePlugin.start('StartScene');

    setTimeout(() => {
      if (!manager.isActive('StartScene')) {
        window.location.reload();
      }
    }, 120);
  }

  _shutdown() {
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
    if (this.topBar) { this.topBar.destroy(); this.topBar = null; }
    if (this.systemDialogue) { this.systemDialogue.destroy(); this.systemDialogue = null; }
    if (this.systemLog) { this.systemLog.destroy(); this.systemLog = null; }
    if (this.zoneNav) { this.zoneNav.destroy(); this.zoneNav = null; }
    if (this.bossChallenge) { this.bossChallenge.destroy(); this.bossChallenge = null; }
    if (this.drinkButton) { this.drinkButton.destroy(); this.drinkButton = null; }
    if (this.smashButton) { this.smashButton.destroy(); this.smashButton = null; }
    if (this.flurryButton) { this.flurryButton.destroy(); this.flurryButton = null; }
    if (this.bulwarkButton) { this.bulwarkButton.destroy(); this.bulwarkButton = null; }
    if (this.armorBreakButton) { this.armorBreakButton.destroy(); this.armorBreakButton = null; }
    if (this.interruptButton) { this.interruptButton.destroy(); this.interruptButton = null; }
    if (this.cleanseButton) { this.cleanseButton.destroy(); this.cleanseButton = null; }
    if (this.stanceSwitcher) { this.stanceSwitcher.destroy(); this.stanceSwitcher = null; }
    if (this.corruptionIndicator) { this.corruptionIndicator.destroy(); this.corruptionIndicator = null; }
    this._actionButtons = [];
    this._stanceActions = null;
    for (const modal of this._modals || []) {
      if (modal) modal.destroy();
    }
    this.inventoryPanel = null;
    this.upgradePanel = null;
    this.prestigePanel = null;
    this.settingsPanel = null;
    this.statsPanel = null;
    this.onboardingPopup = null;
    this._modals = [];
    if (this.cheatDeck) { this.cheatDeck.destroy(); this.cheatDeck = null; }
    DialogueManager.destroy();
    SkillUnlockDirector.destroy();
    if (FEATURES.cheatsEnabled) {
      FirstCrackDirector.destroy();
      CheatManager.destroy();
    }
    if (FEATURES.prestigeEnabled) {
      PrestigeManager.destroy();
    }
    if (this._demoEndContainer) {
      this._demoEndContainer.destroy(true);
      this._demoEndContainer = null;
    }
    console.log('[UIScene] shutdown — cleaned up');
  }
}

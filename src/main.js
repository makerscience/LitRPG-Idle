import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import { WORLD } from './config.js';
import { FEATURES } from './config/features.js';
import Store from './systems/Store.js';
import SaveManager from './systems/SaveManager.js';
import TimeEngine from './systems/TimeEngine.js';
import CombatEngine from './systems/CombatEngine.js';
import LootEngine from './systems/LootEngine.js';
import InventorySystem from './systems/InventorySystem.js';
import UpgradeManager from './systems/UpgradeManager.js';
import OfflineProgress from './systems/OfflineProgress.js';

// Conditional imports for gated systems
import TerritoryManager from './systems/TerritoryManager.js';
import OverworldScene from './scenes/OverworldScene.js';

// ── Boot sequence ───────────────────────────────────────────────────
Store.init();
SaveManager.init(Store);
TimeEngine.init();
LootEngine.init();
if (FEATURES.territoryEnabled) TerritoryManager.init();
OfflineProgress.apply();

const scenes = [BootScene, GameScene, UIScene];
if (FEATURES.territoryEnabled) scenes.push(OverworldScene);

const config = {
  type: Phaser.AUTO,
  width: WORLD.width,
  height: WORLD.height,
  parent: 'game',
  backgroundColor: '#1a1a1a',
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: { default: false },
  scene: scenes,
};

const game = new Phaser.Game(config);

// Expose for dev console debugging
if (import.meta.env.DEV) {
  window.game = game;
  window.Store = Store;
  window.SaveManager = SaveManager;
  window.CombatEngine = CombatEngine;
  window.LootEngine = LootEngine;
  window.InventorySystem = InventorySystem;
  window.UpgradeManager = UpgradeManager;
  window.OfflineProgress = OfflineProgress;
  if (FEATURES.territoryEnabled) window.TerritoryManager = TerritoryManager;
}

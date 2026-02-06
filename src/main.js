import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import { WORLD } from './config.js';
import Store from './systems/Store.js';
import SaveManager from './systems/SaveManager.js';
import TimeEngine from './systems/TimeEngine.js';

// ── Boot sequence ───────────────────────────────────────────────────
Store.init();
SaveManager.init(Store);
TimeEngine.init();

const config = {
  type: Phaser.AUTO,
  width: WORLD.width,
  height: WORLD.height,
  parent: 'game',
  backgroundColor: '#1a1a1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: { default: false },
  scene: [BootScene],
};

const game = new Phaser.Game(config);

// Expose for dev console debugging
if (import.meta.env.DEV) {
  window.game = game;
  window.Store = Store;
  window.SaveManager = SaveManager;
}

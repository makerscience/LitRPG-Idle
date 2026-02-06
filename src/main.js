import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import { WORLD } from './config.js';

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
}

import Phaser from 'phaser';
import { WORLD } from '../config.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    console.log(`[BootScene] create — canvas ${WORLD.width}x${WORLD.height}`);

    const cx = WORLD.width / 2;
    const cy = WORLD.height / 2;

    // Green rectangle — proof of life
    const rect = this.add.rectangle(cx, cy, 400, 300, 0x22c55e);

    // Label
    this.add.text(cx, cy, 'Phase 0 Complete', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Gentle pulse tween to show the update loop is running
    this.tweens.add({
      targets: rect,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    console.log('[BootScene] lifecycle complete — rectangle rendered');

    // Transition to GameScene after brief display
    this.time.delayedCall(1000, () => {
      this.scene.start('GameScene');
    });
  }
}

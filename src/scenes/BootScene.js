import Phaser from 'phaser';
import { WORLD } from '../config.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.image('goblin001_default',  'Images/goblin001_default.png');
    this.load.image('goblin001_reaction', 'Images/goblin001_reaction.png');
    this.load.image('goblin001_attack',   'Images/goblin001_attack.png');
    this.load.image('goblin001_dead',     'Images/goblin001_dead.png');
    this.load.image('slime001_default',   'Images/slime001_default.png');
    this.load.image('slime001_reaction',  'Images/slime001_reaction.png');
    this.load.image('slime001_attack',    'Images/slime001_attack.png');
    this.load.image('slime001_dead',      'Images/slime001_dead.png');
    this.load.image('bg002_rear',   'Images/background002_rear.png');
    this.load.image('bg002_mid',    'Images/background002_mid.png');
    this.load.image('bg002_front',  'Images/background002_front.png');
    this.load.image('ground001',    'Images/ground001.png');
    this.load.image('foreground002', 'Images/foreground002.png');
    this.load.image('fern',         'Images/fern.png');
    this.load.image('fern002',      'Images/fern002.png');
    this.load.image('fg_bare',      'Images/foreground001_bare.png');
    this.load.image('fg_tree001',   'Images/foreground001_tree001.png');
    this.load.image('fg_tree002',   'Images/foreground001_tree002.png');
    this.load.image('fg_tree003',   'Images/foreground001_tree003.png');
    this.load.image('fg_tree004',   'Images/foreground001_tree004.png');
    this.load.image('forestrat001_default',  'Images/forestrat001_default.png');
    this.load.image('forestrat001_reaction', 'Images/forestrat001_reaction.png');
    this.load.image('forestrat001_attack',   'Images/forestrat001_attack.png');
    this.load.image('forestrat001_dead',     'Images/forestrat001_dead.png');
    this.load.image('player001_default',        'Images/Player001_default.png');
    this.load.image('player001_strongpunch',    'Images/Player001_strongpunch.png');
    this.load.image('player001_jumpkick',       'Images/Player001_jumpkick.png');
    this.load.image('player001_kick',           'Images/Player001_kick.png');
    this.load.image('player001_elbow',          'Images/Player001_elbow.png');
    this.load.image('player001_kneestrike',     'Images/Player001_kneestrike.png');
    this.load.image('player001_roundhousekick', 'Images/Player001_roundhousekick.png');
    this.load.image('player001_jab',            'Images/Player001_jab.png');
    this.load.image('player001_hitreaction',    'Images/Player001_hitreaction.png');
    this.load.image('player001_walk1',          'Images/Player001_walk1.png');
    this.load.image('player001_walk3',          'Images/Player001_walk3.png');

    // Equipment thumbnails
    this.load.image('weapon001_sharpstick', 'Images/equipment/weapon001_sharpstick.png');
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

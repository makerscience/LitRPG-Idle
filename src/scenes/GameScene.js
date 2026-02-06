// GameScene — Phaser scene rendering combat. Layout on 1280x720 canvas.

import Phaser from 'phaser';
import CombatEngine from '../systems/CombatEngine.js';
import TimeEngine from '../systems/TimeEngine.js';
import { on, EVENTS } from '../events.js';
import { format } from '../systems/BigNum.js';
import { UI, LAYOUT } from '../config.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this._unsubs = [];
  }

  create() {
    const ga = LAYOUT.gameArea;
    const playerX = ga.x + 200;
    const enemyX = ga.x + 700;
    const combatY = ga.y + ga.h / 2;   // vertical center of game area

    // Player placeholder — blue rect
    this.add.rectangle(playerX, combatY, 200, 250, 0x3b82f6);
    this.add.text(playerX, combatY - 130, 'Player', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
    }).setOrigin(0.5);

    // Enemy placeholder — red rect (click target)
    this.enemyRect = this.add.rectangle(enemyX, combatY, 200, 250, 0xef4444);
    this.enemyRect.setInteractive({ useHandCursor: true });
    this.enemyRect.on('pointerdown', () => CombatEngine.playerAttack());

    // Enemy name text
    this.enemyNameText = this.add.text(enemyX, combatY - 140, '', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
    }).setOrigin(0.5);

    // HP bar background
    this.hpBarBg = this.add.rectangle(enemyX, combatY - 130, 200, 20, 0x374151);

    // HP bar fill — anchored to left edge
    this.hpBarFill = this.add.rectangle(enemyX - 100, combatY - 130, 200, 20, 0x22c55e);
    this.hpBarFill.setOrigin(0, 0.5);

    // Initially hide enemy elements
    this._setEnemyVisible(false);

    // Subscribe to combat events
    this._unsubs.push(on(EVENTS.COMBAT_ENEMY_SPAWNED, (data) => this._onEnemySpawned(data)));
    this._unsubs.push(on(EVENTS.COMBAT_ENEMY_DAMAGED, (data) => this._onEnemyDamaged(data)));
    this._unsubs.push(on(EVENTS.COMBAT_ENEMY_KILLED, (data) => this._onEnemyKilled(data)));

    // Register shutdown handler
    this.events.on('shutdown', () => this._shutdown());

    // Initialize combat engine (starts spawning enemies)
    CombatEngine.init();

    // Launch UI overlay scene (parallel, not replacing this scene)
    this.scene.launch('UIScene');

    console.log('[GameScene] create — combat initialized');
  }

  update(_time, delta) {
    TimeEngine.update(delta);
  }

  _setEnemyVisible(visible) {
    const alpha = visible ? 1 : 0;
    this.enemyRect.setAlpha(alpha);
    this.enemyNameText.setAlpha(alpha);
    this.hpBarBg.setAlpha(alpha);
    this.hpBarFill.setAlpha(alpha);
    // Disable clicks when hidden
    if (visible) {
      this.enemyRect.setInteractive({ useHandCursor: true });
    } else {
      this.enemyRect.disableInteractive();
    }
  }

  _onEnemySpawned(data) {
    this.enemyNameText.setText(data.name);
    this.hpBarFill.setDisplaySize(200, 20);
    this.hpBarFill.setFillStyle(0x22c55e);
    this.enemyRect.setFillStyle(0xef4444);
    this.enemyRect.setAlpha(1);
    this._setEnemyVisible(true);
  }

  _onEnemyDamaged(data) {
    // Update HP bar
    const ratio = data.maxHp.gt(0)
      ? data.remainingHp.div(data.maxHp).toNumber()
      : 0;
    const barWidth = Math.max(0, ratio * 200);
    this.hpBarFill.setDisplaySize(barWidth, 20);

    // Color: green → yellow → red
    let color;
    if (ratio > 0.5) {
      color = 0x22c55e; // green
    } else if (ratio > 0.25) {
      color = 0xeab308; // yellow
    } else {
      color = 0xef4444; // red
    }
    this.hpBarFill.setFillStyle(color);

    // Floating damage number
    this._spawnDamageNumber(data.amount, data.isCrit);

    // Hit flash — briefly tint white
    this.enemyRect.setFillStyle(0xffffff);
    this.time.delayedCall(80, () => {
      if (this.enemyRect) this.enemyRect.setFillStyle(0xef4444);
    });
  }

  _onEnemyKilled(_data) {
    // Death animation — flash white, fade out
    this.enemyRect.setFillStyle(0xffffff);
    this.tweens.add({
      targets: [this.enemyRect, this.enemyNameText, this.hpBarBg, this.hpBarFill],
      alpha: 0,
      duration: 300,
      ease: 'Power2',
    });
    this.enemyRect.disableInteractive();
  }

  _spawnDamageNumber(amount, isCrit) {
    const enemyX = LAYOUT.gameArea.x + 700;
    const xOffset = (Math.random() - 0.5) * 60; // ±30px
    const x = enemyX + xOffset;
    const y = LAYOUT.gameArea.y + LAYOUT.gameArea.h / 2 - 50;

    const displayText = format(amount) + (isCrit ? '!' : '');
    const fontSize = isCrit ? `${UI.damageNumbers.critFontSize}px` : `${UI.damageNumbers.fontSize}px`;
    const color = isCrit ? '#eab308' : '#ffffff';
    const fontStyle = isCrit ? 'bold' : 'normal';

    const text = this.add.text(x, y, displayText, {
      fontFamily: 'monospace',
      fontSize,
      color,
      fontStyle,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - UI.damageNumbers.floatDistance,
      alpha: 0,
      duration: UI.damageNumbers.duration,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  _shutdown() {
    this.scene.stop('UIScene');
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
    CombatEngine.destroy();
    console.log('[GameScene] shutdown — cleaned up');
  }
}

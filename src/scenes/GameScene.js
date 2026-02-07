// GameScene — Phaser scene rendering combat. Layout on 1280x720 canvas.

import Phaser from 'phaser';
import CombatEngine from '../systems/CombatEngine.js';
import TimeEngine from '../systems/TimeEngine.js';
import Store from '../systems/Store.js';
import { on, EVENTS } from '../events.js';
import { format } from '../systems/BigNum.js';
import { UI, LAYOUT, ZONE_THEMES } from '../config.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this._unsubs = [];
    this._parallaxLayers = [];
  }

  create() {
    const ga = LAYOUT.gameArea;
    const playerX = ga.x + 200;
    this._enemyX = ga.x + 700;
    this._combatY = ga.y + ga.h / 2;

    // Create parallax background first (lowest depth)
    this._createParallax(Store.getState().currentZone);

    // Player placeholder — blue rect
    this.add.rectangle(playerX, this._combatY, 200, 250, 0x3b82f6);
    this.add.text(playerX, this._combatY - 130, 'Player', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
    }).setOrigin(0.5);

    // Enemy placeholder — red rect (click target)
    this.enemyRect = this.add.rectangle(this._enemyX, this._combatY, 200, 250, 0xef4444);
    this.enemyRect.setInteractive({ useHandCursor: true });
    this.enemyRect.on('pointerdown', () => CombatEngine.playerAttack());

    // Enemy name text
    this.enemyNameText = this.add.text(this._enemyX, this._combatY - 140, '', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
    }).setOrigin(0.5);

    // HP bar background
    this.hpBarBg = this.add.rectangle(this._enemyX, this._combatY - 130, 200, 20, 0x374151);

    // HP bar fill — anchored to left edge
    this.hpBarFill = this.add.rectangle(this._enemyX - 100, this._combatY - 130, 200, 20, 0x22c55e);
    this.hpBarFill.setOrigin(0, 0.5);

    // Initially hide enemy elements
    this._setEnemyVisible(false);

    // Subscribe to combat events
    this._unsubs.push(on(EVENTS.COMBAT_ENEMY_SPAWNED, (data) => this._onEnemySpawned(data)));
    this._unsubs.push(on(EVENTS.COMBAT_ENEMY_DAMAGED, (data) => this._onEnemyDamaged(data)));
    this._unsubs.push(on(EVENTS.COMBAT_ENEMY_KILLED, (data) => this._onEnemyKilled(data)));

    // Visual juice subscriptions
    this._unsubs.push(on(EVENTS.PROG_LEVEL_UP, () => this._onLevelUp()));
    this._unsubs.push(on(EVENTS.CHEAT_TOGGLED, (data) => {
      if (data.active) this._onCheatGlitch();
    }));

    // Parallax zone change
    this._unsubs.push(on(EVENTS.WORLD_ZONE_CHANGED, (data) => {
      this._destroyParallax();
      this._createParallax(data.zone);
    }));

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

    // Scroll parallax layers
    for (let i = 0; i < this._parallaxLayers.length; i++) {
      const layer = this._parallaxLayers[i];
      if (!layer || !layer.active) continue;
      const speed = (i + 1) * 0.1; // 0.1, 0.2, 0.3 px/frame
      const children = layer.getAll();
      for (const child of children) {
        child.x -= speed;
        // Wrap around when off-screen left
        if (child.x + child.width < 0) {
          child.x = LAYOUT.gameArea.w + Math.random() * 100;
        }
      }
    }
  }

  _setEnemyVisible(visible) {
    const alpha = visible ? 1 : 0;
    this.enemyRect.setAlpha(alpha);
    this.enemyNameText.setAlpha(alpha);
    this.hpBarBg.setAlpha(alpha);
    this.hpBarFill.setAlpha(alpha);
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
    this.enemyRect.setScale(1);
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
      color = 0x22c55e;
    } else if (ratio > 0.25) {
      color = 0xeab308;
    } else {
      color = 0xef4444;
    }
    this.hpBarFill.setFillStyle(color);

    // Floating damage number (magnitude-tiered)
    this._spawnDamageNumber(data.amount, data.isCrit);

    // Hit flash — briefly tint white
    this.enemyRect.setFillStyle(0xffffff);
    this.time.delayedCall(80, () => {
      if (this.enemyRect) this.enemyRect.setFillStyle(0xef4444);
    });
  }

  _onEnemyKilled(_data) {
    // Enhanced death animation: scale up → shrink + fade
    this.tweens.add({
      targets: this.enemyRect,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: [this.enemyRect, this.enemyNameText, this.hpBarBg, this.hpBarFill],
          alpha: 0,
          duration: 200,
          ease: 'Power2',
        });
        this.tweens.add({
          targets: this.enemyRect,
          scaleX: 0.5,
          scaleY: 0.5,
          duration: 200,
          ease: 'Power2',
        });
      },
    });
    this.enemyRect.disableInteractive();

    // Gold particles flying to TopBar
    this._spawnGoldParticles();
  }

  // ── Damage numbers (magnitude-tiered) ─────────────────────────

  _spawnDamageNumber(amount, isCrit) {
    const xOffset = (Math.random() - 0.5) * 60;
    const x = this._enemyX + xOffset;
    const y = this._combatY - 50;

    // Select tier by magnitude
    const mag = amount.toNumber ? amount.toNumber() : Number(amount);
    const tiers = UI.damageNumbers.tiers;
    let tier = tiers[0];
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (mag >= tiers[i].min) {
        tier = tiers[i];
        break;
      }
    }

    let fontSize = tier.fontSize;
    if (isCrit) fontSize += UI.damageNumbers.critBonusSize;

    const displayText = format(amount) + (isCrit ? '!' : '');

    const textStyle = {
      fontFamily: 'monospace',
      fontSize: `${fontSize}px`,
      color: isCrit ? '#eab308' : tier.color,
      fontStyle: tier.style,
      stroke: '#000000',
      strokeThickness: 2,
    };

    // 1M+ tier gets glow shadow
    if (tier.min >= 1e6) {
      textStyle.shadow = {
        offsetX: 0,
        offsetY: 0,
        color: '#f59e0b',
        blur: 8,
        fill: true,
      };
    }

    const text = this.add.text(x, y, displayText, textStyle).setOrigin(0.5);

    // Screen shake for big hits
    if (tier.shake > 0) {
      this.cameras.main.shake(100, tier.shake);
    }

    this.tweens.add({
      targets: text,
      y: y - UI.damageNumbers.floatDistance,
      alpha: 0,
      duration: UI.damageNumbers.duration,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  // ── Visual juice ──────────────────────────────────────────────

  _spawnGoldParticles() {
    const count = 5 + Math.floor(Math.random() * 4); // 5-8
    const targetX = 20;
    const targetY = 25;

    for (let i = 0; i < count; i++) {
      const startX = this._enemyX + (Math.random() - 0.5) * 40;
      const startY = this._combatY + (Math.random() - 0.5) * 40;
      const particle = this.add.circle(startX, startY, 3, 0xeab308);

      // Arc offset for variety
      const arcX = (Math.random() - 0.5) * 80;
      const arcY = -30 - Math.random() * 40;

      const duration = 400 + Math.random() * 200;

      this.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        duration,
        ease: 'Quad.easeIn',
        onComplete: () => particle.destroy(),
      });
    }
  }

  _onLevelUp() {
    const ga = LAYOUT.gameArea;
    const overlay = this.add.rectangle(
      ga.x + ga.w / 2, ga.y + ga.h / 2,
      ga.w, ga.h,
      0xeab308, 0.3
    );
    this.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => overlay.destroy(),
    });
  }

  _onCheatGlitch() {
    const ga = LAYOUT.gameArea;

    // Green overlay
    const overlay = this.add.rectangle(
      ga.x + ga.w / 2, ga.y + ga.h / 2,
      ga.w, ga.h,
      0x22c55e, 0.15
    );

    // 3-4 horizontal static lines
    const lines = [];
    const lineCount = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < lineCount; i++) {
      const ly = ga.y + Math.random() * ga.h;
      const line = this.add.rectangle(
        ga.x + ga.w / 2, ly,
        ga.w, 2,
        0x22c55e, 0.6
      );
      lines.push(line);
    }

    // Brief camera shake
    this.cameras.main.shake(50, 0.003);

    // Clear all after 150ms
    this.time.delayedCall(150, () => {
      overlay.destroy();
      for (const line of lines) line.destroy();
    });
  }

  // ── Parallax backgrounds ──────────────────────────────────────

  _createParallax(zone) {
    const theme = ZONE_THEMES[zone];
    if (!theme) return;

    const ga = LAYOUT.gameArea;

    for (let layerIdx = 0; layerIdx < theme.layers.length; layerIdx++) {
      const color = theme.layers[layerIdx];
      const container = this.add.container(0, 0);
      container.setDepth(-3 + layerIdx); // -3, -2, -1

      const rectCount = 8 + Math.floor(Math.random() * 5); // 8-12
      for (let r = 0; r < rectCount; r++) {
        const w = 20 + Math.random() * 60;
        const h = 20 + Math.random() * 80;
        const x = ga.x + Math.random() * ga.w;
        const y = ga.y + Math.random() * ga.h;
        const rect = this.add.rectangle(x, y, w, h, color, 0.3 + Math.random() * 0.3);
        container.add(rect);
      }

      this._parallaxLayers.push(container);
    }
  }

  _destroyParallax() {
    for (const layer of this._parallaxLayers) {
      if (layer) layer.destroy(true);
    }
    this._parallaxLayers = [];
  }

  _shutdown() {
    this.scene.stop('UIScene');
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
    this._destroyParallax();
    CombatEngine.destroy();
    console.log('[GameScene] shutdown — cleaned up');
  }
}

// GameScene â€” Phaser scene rendering combat. Layout on 1280x720 canvas.

import Phaser from 'phaser';
import CombatEngine from '../systems/CombatEngine.js';
import TimeEngine from '../systems/TimeEngine.js';
import Store from '../systems/Store.js';
import { on, EVENTS } from '../events.js';
import { format } from '../systems/BigNum.js';
import { UI, LAYOUT, ZONE_THEMES, COMBAT, PARALLAX, TREE_ROWS, FERN_ROWS } from '../config.js';
import { getEnemyById } from '../data/enemies.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this._unsubs = [];
    this._parallaxLayers = [];
    this._treeLayers = [];
    this._fernLayers = [];
  }

  create() {
    const ga = LAYOUT.gameArea;
    const playerX = ga.x + 200;
    this._enemyX = ga.x + 700;
    this._combatY = ga.y + ga.h - 225;
    this._enemyY = this._combatY + 60;

    // Create parallax background first (lowest depth) — keyed on area, not zone
    this._createParallax(Store.getState().currentArea);

    // Player attack pose config
    this._playerAttackSprites = [
      'player001_strongpunch', 'player001_jumpkick', 'player001_kick',
      'player001_elbow', 'player001_kneestrike', 'player001_roundhousekick',
      'player001_jab',
    ];
    this._playerPoseTimer = null;

    // Bottom-anchored HP bar Y positions
    this._hpBarY = ga.y + ga.h - 60;
    this._nameLabelY = this._hpBarY - 18;

    // Player walk animation
    this._walkFrames = ['player001_walk1', 'player001_walk3'];
    this._walkIndex = 0;

    // Player sprite — start with first walk frame
    this.playerRect = this.add.image(playerX, this._combatY, 'player001_walk1');
    this.playerRect.setDisplaySize(300, 375);

    // Looping walk cycle timer (~150ms per frame)
    this._walkTimer = this.time.addEvent({
      delay: 450,
      loop: true,
      callback: () => {
        this._walkIndex = (this._walkIndex + 1) % this._walkFrames.length;
        const key = this._walkFrames[this._walkIndex];
        this.playerRect.setTexture(key);
        const scale = key === 'player001_walk3' ? 1.05 : 1;
        this.playerRect.setDisplaySize(300 * scale, 375 * scale);
      },
    });
    this.playerNameText = this.add.text(playerX, this._nameLabelY, 'Player', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    // Player HP bar
    this.playerHpBarBg = this.add.rectangle(playerX, this._hpBarY, 200, 16, 0x374151);
    this.playerHpBarFill = this.add.rectangle(playerX - 100, this._hpBarY, 200, 16, 0x22c55e);
    this.playerHpBarFill.setOrigin(0, 0.5);

    // Enemy placeholder â€” red rect (click target for enemies without sprites)
    this.enemyRect = this.add.rectangle(this._enemyX, this._enemyY, 200, 250, 0xef4444);
    this.enemyRect.setInteractive({ useHandCursor: true });
    this.enemyRect.on('pointerdown', () => CombatEngine.playerAttack());

    // Enemy sprite (for enemies with sprite assets)
    this.enemySprite = this.add.image(this._enemyX, this._enemyY, 'goblin001_default');
    this.enemySprite.setVisible(false);
    this.enemySprite.on('pointerdown', () => CombatEngine.playerAttack());
    this._currentEnemySprites = null;
    this._poseRevertTimer = null;
    this._spriteW = 200;
    this._spriteH = 250;

    // Enemy name text
    this.enemyNameText = this.add.text(this._enemyX, this._nameLabelY, '', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    // HP bar background
    this.hpBarBg = this.add.rectangle(this._enemyX, this._hpBarY, 200, 20, 0x374151);

    // HP bar fill â€” anchored to left edge
    this.hpBarFill = this.add.rectangle(this._enemyX - 100, this._hpBarY, 200, 20, 0x22c55e);
    this.hpBarFill.setOrigin(0, 0.5);

    // Initially hide enemy elements
    this._setEnemyVisible(false);

    // Subscribe to combat events
    this._unsubs.push(on(EVENTS.COMBAT_ENEMY_SPAWNED, (data) => this._onEnemySpawned(data)));
    this._unsubs.push(on(EVENTS.COMBAT_ENEMY_DAMAGED, (data) => this._onEnemyDamaged(data)));
    this._unsubs.push(on(EVENTS.COMBAT_ENEMY_KILLED, (data) => this._onEnemyKilled(data)));

    // Player HP events
    this._unsubs.push(on(EVENTS.COMBAT_PLAYER_DAMAGED, (data) => this._onPlayerDamaged(data)));
    this._unsubs.push(on(EVENTS.COMBAT_PLAYER_DIED, () => this._onPlayerDied()));

    // Visual juice subscriptions
    this._unsubs.push(on(EVENTS.PROG_LEVEL_UP, () => this._onLevelUp()));
    this._unsubs.push(on(EVENTS.CHEAT_TOGGLED, (data) => {
      if (data.active) this._onCheatGlitch();
    }));

    // Parallax area change — only rebuild on area change, not zone change
    this._unsubs.push(on(EVENTS.WORLD_AREA_CHANGED, (data) => {
      this._destroyParallax();
      this._createParallax(data.area);
    }));

    // Register shutdown handler
    this.events.on('shutdown', () => this._shutdown());

    // Initialize combat engine (starts spawning enemies)
    CombatEngine.init();

    // Launch UI overlay scene (parallel, not replacing this scene)
    this.scene.launch('UIScene');

    // Launch OverworldScene (starts sleeping — toggled by UIScene via M key)
    this.scene.launch('OverworldScene');

    console.log('[GameScene] create â€” combat initialized');
  }

  update(_time, delta) {
    TimeEngine.update(delta);

    const dt = delta / 1000;
    const ga = LAYOUT.gameArea;

    // Scroll parallax layers
    for (let i = 0; i < this._parallaxLayers.length; i++) {
      const layer = this._parallaxLayers[i];
      if (!layer || !layer.active) continue;

      if (layer.getData('isStatic')) {
        continue;
      } else if (layer.getData('isImageLayer')) {
        // Dual-image horizontal scroll (delta-based)
        const children = layer.getAll();
        const imgW = layer.getData('imgW');
        const speed = PARALLAX.baseSpeedPxPerSec * 3 * 0.4 * dt;
        for (const child of children) {
          child.x -= speed;
        }
        if (children[0] && children[0].x + imgW <= ga.x) {
          for (const child of children) {
            child.x += imgW;
          }
        }
      } else {
        // Rectangle-based fallback (unchanged, frame-based)
        const speed = (i + 1) * 0.15;
        const children = layer.getAll();
        for (const child of children) {
          child.x -= speed;
          if (child.x + child.width < 0) {
            child.x = ga.w + Math.random() * 100;
          }
        }
      }
    }

    // Scroll ground (delta-based, equivalent to front layer rate)
    if (this._groundContainer && this._groundContainer.active) {
      const groundSpeed = PARALLAX.baseSpeedPxPerSec * 3 * dt;
      const children = this._groundContainer.getAll();
      const imgW = this._groundContainer.getData('imgW');
      for (const child of children) {
        child.x -= groundSpeed;
      }
      if (children[0] && children[0].x + imgW <= ga.x) {
        for (const child of children) {
          child.x += imgW;
        }
      }
    }

    // Scroll bare ground overlay (same speed as ground)
    if (this._bareGroundContainer && this._bareGroundContainer.active) {
      const bareSpeed = PARALLAX.baseSpeedPxPerSec * 3 * dt;
      const children = this._bareGroundContainer.getAll();
      const imgW = this._bareGroundContainer.getData('imgW');
      for (const child of children) {
        child.x -= bareSpeed;
      }
      if (children[0] && children[0].x + imgW <= ga.x) {
        for (const child of children) {
          child.x += imgW;
        }
      }
    }

    // Scroll tree layers (diagonal: upper-right â†' lower-left)
    if (this._treeLayers.length > 0) {
      const frontSpeed = PARALLAX.baseSpeedPxPerSec * 3;
      const diagRatio = PARALLAX.treeDiagRatio;
      for (const { row, trees } of this._treeLayers) {
        const xSpeed = frontSpeed * row.speedMult * dt;
        const ySpeed = xSpeed * diagRatio * (row.diagMult ?? 1);
        for (const tree of trees) {
          tree.img.x -= xSpeed;
          tree.img.y += ySpeed;

          // Perspective growth: scale continuously from spawn to despawn (no clamping)
          if (row.growRange) {
            const spawnX = ga.x + ga.w * 1.5;
            const despawnX = ga.x - tree.displayW * 0.5;
            const progress = Math.max(0, (spawnX - tree.img.x) / (spawnX - despawnX));
            const growMult = row.growRange[0] + progress * (row.growRange[1] - row.growRange[0]);
            tree.img.setDisplaySize(tree.displayW * growMult, tree.displayH * growMult);
          }

          // Wrap: past left edge or below game area â†' reset to upper-right off-screen
          const topY = tree.img.y - tree.displayH;
          if (tree.img.x + tree.displayW * 0.5 < ga.x || topY > ga.y + ga.h + 50) {
            tree.img.x = ga.x + ga.w + tree.displayW * 0.5 + Math.random() * 30;
            tree.img.y = ga.y + ga.h * row.yRange[0] + Math.random() * 30;
          }
        }
      }
    }

    // Scroll fern layers (dense diagonal band)
    if (this._fernLayers.length > 0) {
      const frontSpeed = PARALLAX.baseSpeedPxPerSec * 3;
      const diagRatio = PARALLAX.fernDiagRatio;
      for (const { row, ferns, yMin, yMax } of this._fernLayers) {
        const xSpeed = frontSpeed * row.speedMult * dt;
        const ySpeed = xSpeed * diagRatio;

        // Find rightmost fern for spacing-aware respawn
        let rightmostX = ga.x + ga.w;
        for (const fern of ferns) {
          if (fern.img.x > rightmostX) rightmostX = fern.img.x;
        }

        // Compute step from sample fern width + spacing multiplier
        const sampleW = ferns[0] ? ferns[0].displayW : 40;
        const step = Math.max(24, sampleW * row.xSpacingMult);

        for (const fern of ferns) {
          fern.img.x -= xSpeed;
          fern.img.y += ySpeed;

          // Perspective growth: scale up as fern travels right → left
          if (row.growRange) {
            const progress = 1 - Math.max(0, Math.min(1, (fern.img.x - ga.x) / ga.w));
            const growMult = row.growRange[0] + progress * (row.growRange[1] - row.growRange[0]);
            fern.img.setDisplaySize(fern.displayW * growMult, fern.displayH * growMult);
          }

          const topY = fern.img.y - fern.displayH;
          if (fern.img.x + fern.displayW * 0.5 < ga.x - 60 || topY > ga.y + ga.h + 80) {
            // Place one step after the current rightmost fern with slight jitter
            fern.img.x = rightmostX + step + (Math.random() - 0.5) * step * 0.3;
            rightmostX = fern.img.x;
            fern.img.y = yMin + Math.random() * Math.max(1, yMax - yMin);
          }
        }
      }
    }
  }

  _setEnemyVisible(visible) {
    const alpha = visible ? 1 : 0;
    if (this._currentEnemySprites) {
      this.enemySprite.setAlpha(alpha);
      if (visible) this.enemySprite.setInteractive({ useHandCursor: true });
      else this.enemySprite.disableInteractive();
      this.enemyRect.setAlpha(0); // always hidden when sprite is active
      this.enemyRect.disableInteractive();
    } else {
      this.enemyRect.setAlpha(alpha);
      if (visible) this.enemyRect.setInteractive({ useHandCursor: true });
      else this.enemyRect.disableInteractive();
    }
    this.enemyNameText.setAlpha(alpha);
    this.hpBarBg.setAlpha(alpha);
    this.hpBarFill.setAlpha(alpha);
  }

  _onEnemySpawned(data) {
    // Kill any lingering death-animation tweens from previous enemy
    this.tweens.killTweensOf(this.enemySprite);
    this.tweens.killTweensOf(this.enemyRect);
    this.tweens.killTweensOf(this.enemyNameText);
    this.tweens.killTweensOf(this.hpBarBg);
    this.tweens.killTweensOf(this.hpBarFill);

    const template = getEnemyById(data.enemyId);
    this._currentEnemySprites = template?.sprites || null;
    this._spriteOffsetY = template?.spriteOffsetY || 0;
    const size = data.spriteSize || template?.spriteSize || { w: 200, h: 250 };
    this._spriteW = size.w;
    this._spriteH = size.h;

    if (this._currentEnemySprites) {
      // Show sprite with default pose (apply Y offset for living poses)
      this.enemySprite.setTexture(this._currentEnemySprites.default);
      this.enemySprite.setScale(1);  // reset from death anim before resizing
      this.enemySprite.setDisplaySize(this._spriteW, this._spriteH);
      this.enemySprite.y = this._enemyY + this._spriteOffsetY;
      this.enemySprite.setVisible(true);
      this.enemySprite.setAlpha(1);
      this.enemySprite.setInteractive({ useHandCursor: true });
      // Hide rect
      this.enemyRect.setAlpha(0);
      this.enemyRect.disableInteractive();
    } else {
      // No sprites â€” use rect (existing behavior)
      this.enemySprite.setVisible(false);
      this.enemyRect.setFillStyle(0xef4444);
      this.enemyRect.setAlpha(1);
      this.enemyRect.setScale(1);
      this.enemyRect.setInteractive({ useHandCursor: true });
    }

    // Common: name + HP bar
    this.enemyNameText.setText(data.name);
    this.hpBarFill.setDisplaySize(200, 20);
    this.hpBarFill.setFillStyle(0x22c55e);
    this._setEnemyVisible(true);
  }

  _onEnemyDamaged(data) {
    // Update HP bar
    const ratio = data.maxHp.gt(0)
      ? data.remainingHp.div(data.maxHp).toNumber()
      : 0;
    const barWidth = Math.max(0, ratio * 200);
    this.hpBarFill.setDisplaySize(barWidth, 20);

    // Color: green â†’ yellow â†’ red
    let color;
    if (ratio > 0.5) {
      color = 0x22c55e;
    } else if (ratio > 0.25) {
      color = 0xeab308;
    } else {
      color = 0xef4444;
    }
    this.hpBarFill.setFillStyle(color);

    // Player attack pose â€" random sprite for 400ms, then revert to walk cycle
    const attackKey = this._playerAttackSprites[
      Math.floor(Math.random() * this._playerAttackSprites.length)
    ];
    this._walkTimer.paused = true;
    this.playerRect.setTexture(attackKey);
    if (attackKey === 'player001_roundhousekick') {
      this.playerRect.setDisplaySize(300 * 0.95, 375 * 0.95);
    } else {
      this.playerRect.setDisplaySize(300, 375);
    }
    if (this._playerPoseTimer) this._playerPoseTimer.remove();
    this._playerPoseTimer = this.time.delayedCall(400, () => {
      this._walkTimer.paused = false;
    });

    // Floating damage number (magnitude-tiered)
    this._spawnDamageNumber(data.amount, data.isCrit);

    const target = this._currentEnemySprites ? this.enemySprite : this.enemyRect;

    if (this._currentEnemySprites) {
      // Sprite: switch to reaction pose for 500ms
      this.enemySprite.setTexture(this._currentEnemySprites.reaction);
      this.enemySprite.setDisplaySize(this._spriteW, this._spriteH);
      this.enemySprite.setTint(0xffffff);
      this.time.delayedCall(80, () => this.enemySprite.clearTint());

      // Clear any existing pose-revert timer
      if (this._poseRevertTimer) this._poseRevertTimer.remove();
      this._poseRevertTimer = this.time.delayedCall(500, () => {
        if (this._currentEnemySprites) {
          this.enemySprite.setTexture(this._currentEnemySprites.default);
          this.enemySprite.setDisplaySize(this._spriteW, this._spriteH);
        }
      });
    } else {
      // Rect: existing hit flash behavior
      this.enemyRect.setFillStyle(0xffffff);
      this.time.delayedCall(80, () => {
        if (this.enemyRect) this.enemyRect.setFillStyle(0xef4444);
      });
    }

    // Hit reaction â€” squish + knockback (rects only; sprites skip to avoid display size warping)
    if (!this._currentEnemySprites) {
      if (this._hitReactionTween) this._hitReactionTween.stop();
      target.setScale(1);
      target.x = this._enemyX;
      this._hitReactionTween = this.tweens.add({
        targets: target,
        scaleX: 0.85,
        scaleY: 1.15,
        x: this._enemyX + 8,
        duration: 60,
        ease: 'Quad.easeOut',
        yoyo: true,
      });
    }
  }

  _onEnemyKilled(_data) {
    const target = this._currentEnemySprites ? this.enemySprite : this.enemyRect;

    // Clear any pending pose revert
    if (this._poseRevertTimer) { this._poseRevertTimer.remove(); this._poseRevertTimer = null; }

    if (this._currentEnemySprites) {
      // Show dead pose at base position (no offset), then fade out
      this.enemySprite.setTexture(this._currentEnemySprites.dead);
      this.enemySprite.setDisplaySize(this._spriteW, this._spriteH);
      this.enemySprite.y = this._enemyY;
      this.enemySprite.disableInteractive();

      this.time.delayedCall(500, () => {
        this.tweens.add({
          targets: [target, this.enemyNameText, this.hpBarBg, this.hpBarFill],
          alpha: 0, duration: 300, ease: 'Power2',
        });
      });
    } else {
      // Existing rect death animation
      this.tweens.add({
        targets: this.enemyRect,
        scaleX: 1.2, scaleY: 1.2,
        duration: 100, ease: 'Quad.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: [this.enemyRect, this.enemyNameText, this.hpBarBg, this.hpBarFill],
            alpha: 0, duration: 200, ease: 'Power2',
          });
          this.tweens.add({
            targets: this.enemyRect,
            scaleX: 0.5, scaleY: 0.5,
            duration: 200, ease: 'Power2',
          });
        },
      });
      this.enemyRect.disableInteractive();
    }

    // Gold particles flying to TopBar
    this._spawnGoldParticles();
  }

  // â”€â”€ Damage numbers (magnitude-tiered) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  _spawnDamageNumber(amount, isCrit) {
    const xOffset = (Math.random() - 0.5) * 60;
    const x = this._enemyX + xOffset;
    const y = this._enemyY - 50;

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
      color: isCrit ? '#fde047' : tier.color,
      fontStyle: tier.style,
      stroke: '#000000',
      strokeThickness: 4,
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

    const dur = UI.damageNumbers.duration;

    // Float upward at full opacity
    this.tweens.add({
      targets: text,
      y: y - UI.damageNumbers.floatDistance,
      duration: dur,
      ease: 'Power2',
    });

    // Quick fade only in the last 30%
    this.tweens.add({
      targets: text,
      alpha: 0,
      delay: dur * 0.7,
      duration: dur * 0.3,
      ease: 'Linear',
      onComplete: () => text.destroy(),
    });
  }

  // â”€â”€ Visual juice â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  _spawnGoldParticles() {
    const count = 5 + Math.floor(Math.random() * 4); // 5-8
    const targetX = 20;
    const targetY = 25;

    for (let i = 0; i < count; i++) {
      const startX = this._enemyX + (Math.random() - 0.5) * 40;
      const startY = this._enemyY + (Math.random() - 0.5) * 40;
      const particle = this.add.circle(startX, startY, 3, 0xeab308);

      // Arc offset for variety
      const arcX = (Math.random() - 0.5) * 80;
      const arcY = -30 - Math.random() * 40;
      const controlX = (startX + targetX) / 2 + arcX;
      const controlY = (startY + targetY) / 2 + arcY;

      const duration = 400 + Math.random() * 200;
      const path = { t: 0 };

      this.tweens.add({
        targets: path,
        t: 1,
        duration,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          const t = path.t;
          const oneMinusT = 1 - t;
          // Quadratic Bezier interpolation (start -> control -> target).
          particle.x = oneMinusT * oneMinusT * startX + 2 * oneMinusT * t * controlX + t * t * targetX;
          particle.y = oneMinusT * oneMinusT * startY + 2 * oneMinusT * t * controlY + t * t * targetY;
        },
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

  _onPlayerDamaged(data) {
    // Update player HP bar
    const ratio = data.maxHp.gt(0) ? data.remainingHp.div(data.maxHp).toNumber() : 0;
    const barWidth = Math.max(0, ratio * 200);
    this.playerHpBarFill.setDisplaySize(barWidth, 16);
    const color = ratio > 0.5 ? 0x22c55e : ratio > 0.25 ? 0xeab308 : 0xef4444;
    this.playerHpBarFill.setFillStyle(color);

    // Show attack pose on enemy sprite for 500ms
    if (this._currentEnemySprites) {
      this.enemySprite.setTexture(this._currentEnemySprites.attack);
      this.enemySprite.setDisplaySize(this._spriteW, this._spriteH);
      if (this._poseRevertTimer) this._poseRevertTimer.remove();
      this._poseRevertTimer = this.time.delayedCall(500, () => {
        if (this._currentEnemySprites) {
          this.enemySprite.setTexture(this._currentEnemySprites.default);
          this.enemySprite.setDisplaySize(this._spriteW, this._spriteH);
        }
      });
    }

    // Player hit reaction pose for 400ms, then revert to walk cycle
    this._walkTimer.paused = true;
    this.playerRect.setTexture('player001_hitreaction');
    this.playerRect.setDisplaySize(300, 375);
    this.playerRect.setTint(0xef4444);
    this.time.delayedCall(120, () => {
      if (this.playerRect) this.playerRect.clearTint();
    });
    if (this._playerPoseTimer) this._playerPoseTimer.remove();
    this._playerPoseTimer = this.time.delayedCall(400, () => {
      this._walkTimer.paused = false;
    });
  }

  _onPlayerDied() {
    // Flash/fade on player rect
    this.tweens.add({
      targets: this.playerRect,
      alpha: 0.3,
      duration: 200,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.playerRect.setAlpha(1);
        // Refresh HP bar to full after respawn
        this.time.delayedCall(COMBAT.playerDeathRespawnDelay, () => {
          this.playerHpBarFill.setDisplaySize(200, 16);
          this.playerHpBarFill.setFillStyle(0x22c55e);
        });
      },
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

  // â”€â”€ Parallax backgrounds â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  _createParallax(zone) {
    const theme = ZONE_THEMES[zone];
    if (!theme) return;

    const ga = LAYOUT.gameArea;
    const skyH = Math.floor(ga.h * 0.83);
    const battleBottomY = ga.y + ga.h;
    const midLayerBottomTargetY = 380;
    const foregroundTopTargetY = 270;

    if (theme.images) {
      for (let layerIdx = 0; layerIdx < theme.images.length; layerIdx++) {
        const key = theme.images[layerIdx];
        const layerH = skyH;

        // Rear layer (sky): static full-screen image, no scrolling
        if (layerIdx === 0) {
          const container = this.add.container(0, 0);
          container.setDepth(-3);
          container.setData('isStatic', true);
          const img = this.add.image(ga.x, ga.y, key).setOrigin(0, 0);
          img.setDisplaySize(ga.w, layerH);
          container.add(img);
          this._parallaxLayers.push(container);
          continue;
        }

        // Mid layer: dual-image horizontal scroll
        if (layerIdx === 1) {
          const container = this.add.container(0, 0);
          container.setDepth(-2);
          container.setData('isImageLayer', true);
          const midLayerY = midLayerBottomTargetY - layerH;
          const img1 = this.add.image(ga.x, midLayerY, key).setOrigin(0, 0);
          img1.setDisplaySize(ga.w, layerH);
          const img2 = this.add.image(ga.x + ga.w, midLayerY, key).setOrigin(0, 0);
          img2.setDisplaySize(ga.w, layerH);
          container.setData('imgW', ga.w);
          container.add([img1, img2]);
          this._parallaxLayers.push(container);
          continue;
        }
      }

      // Tree rows (replaces front strip layer)
      if (theme.trees) {
        this._createTreeRows(theme.trees, ga);
      }
      if (theme.ferns) {
        this._createFernRows(theme.ferns, ga);
      }
    } else {
      // Rectangle-based fallback for zones without images (unchanged)
      for (let layerIdx = 0; layerIdx < theme.layers.length; layerIdx++) {
        const color = theme.layers[layerIdx];
        const container = this.add.container(0, 0);
        container.setDepth(-3 + layerIdx);

        const rectCount = 8 + Math.floor(Math.random() * 5);
        for (let r = 0; r < rectCount; r++) {
          const w = 20 + Math.random() * 60;
          const h = 20 + Math.random() * 80;
          const x = ga.x + Math.random() * ga.w;
          const y = ga.y + Math.random() * skyH;
          const rect = this.add.rectangle(x, y, w, h, color, 0.3 + Math.random() * 0.3);
          container.add(rect);
        }

        this._parallaxLayers.push(container);
      }
    }

    // Foreground band: fixed top edge, down to bottom of battle window
    const groundY = Math.max(ga.y, Math.min(battleBottomY - 1, foregroundTopTargetY));
    const groundH = Math.max(1, battleBottomY - groundY);
    const gImg1 = this.add.image(ga.x, groundY, 'foreground002').setOrigin(0, 0);
    gImg1.setDisplaySize(ga.w, groundH);
    const gImg2 = this.add.image(ga.x + ga.w, groundY, 'foreground002').setOrigin(0, 0);
    gImg2.setDisplaySize(ga.w, groundH);
    this._groundContainer = this.add.container(0, 0);
    this._groundContainer.setDepth(-2.5);
    this._groundContainer.setData('imgW', ga.w);
    this._groundContainer.add([gImg1, gImg2]);

    // Bare ground overlay — sits above foreground002 but behind trees/ferns
    // Top aligns with mid fern row start (Y=445), bottom at game area bottom
    if (theme.images && this.textures.exists('fg_bare')) {
      const bareY = 445;
      const bareH = battleBottomY - bareY;
      const bImg1 = this.add.image(ga.x, bareY, 'fg_bare').setOrigin(0, 0);
      bImg1.setDisplaySize(ga.w, bareH);
      const bImg2 = this.add.image(ga.x + ga.w, bareY, 'fg_bare').setOrigin(0, 0);
      bImg2.setDisplaySize(ga.w, bareH);
      this._bareGroundContainer = this.add.container(0, 0);
      this._bareGroundContainer.setDepth(-0.48);
      this._bareGroundContainer.setData('imgW', ga.w);
      this._bareGroundContainer.add([bImg1, bImg2]);
    }
  }

  _createTreeRows(treeKeys, ga) {
    const diagRatio = PARALLAX.treeDiagRatio;

    for (const row of TREE_ROWS) {
      const container = this.add.container(0, 0);
      container.setDepth(row.depth);

      // Geometry mask â€” clip to game area
      const maskGfx = this.make.graphics({ x: 0, y: 0, add: false });
      maskGfx.fillRect(ga.x, ga.y, ga.w, ga.h);
      const mask = maskGfx.createGeometryMask();
      container.setMask(mask);
      container.setData('maskGfx', maskGfx);
      container.setData('mask', mask);
      container.setData('isTreeLayer', true);

      const trees = [];
      const yStart = ga.y + ga.h * row.yRange[0];   // top of Y band (spawn Y at right edge)
      const diagDrop = ga.w * diagRatio;              // total Y drop across full width
      const rowKeys = Array.isArray(row.keys) && row.keys.length > 0 ? row.keys : treeKeys;

      for (let i = 0; i < row.count; i++) {
        const key = rowKeys[Math.floor(Math.random() * rowKeys.length)];
        const scale = row.scaleRange[0] + Math.random() * (row.scaleRange[1] - row.scaleRange[0]);
        const displayW = 1024 * scale;
        const displayH = 1536 * scale;

        // Distribute trees across 1.5× screen width so off-screen trees are queued on the right
        const spawnWidth = ga.w * 1.5;
        const progress = i / row.count + (Math.random() * 0.3) / row.count;
        const x = ga.x + spawnWidth * (1 - progress);
        const y = yStart + diagDrop * progress;

        const img = this.add.image(x, y, key).setOrigin(0.5, 1);
        img.setDisplaySize(displayW, displayH);

        container.add(img);
        trees.push({ img, displayW, displayH });
      }

      this._treeLayers.push({ container, row, trees });
    }
  }

  _createFernRows(fernKeys, ga) {
    if (!fernKeys || fernKeys.length === 0) return;

    // Fern band starts around the middle of the battle window.
    const bandTop = ga.y + Math.floor(ga.h * 0.5);
    const bandBottom = ga.y + ga.h;
    const bandHeight = Math.max(40, bandBottom - bandTop);
    const sliceH = bandHeight / FERN_ROWS.length;

    for (let rowIdx = 0; rowIdx < FERN_ROWS.length; rowIdx++) {
      const row = FERN_ROWS[rowIdx];
      const container = this.add.container(0, 0);
      container.setDepth(row.depth);

      const maskGfx = this.make.graphics({ x: 0, y: 0, add: false });
      maskGfx.fillRect(ga.x, ga.y, ga.w, ga.h);
      const mask = maskGfx.createGeometryMask();
      container.setMask(mask);
      container.setData('maskGfx', maskGfx);
      container.setData('mask', mask);
      container.setData('isFernLayer', true);

      const yMin = rowIdx === 0 ? 375 : rowIdx === 1 ? 415 : rowIdx === 2 ? 445 : rowIdx === 3 ? 540 : bandTop + rowIdx * sliceH;
      const yMax = rowIdx === 0 ? 380 : rowIdx === 1 ? 450 : rowIdx === 2 ? 490 : rowIdx === 3 ? 560 : bandTop + (rowIdx + 1) * sliceH + sliceH * 0.35;
      const sampleScale = (row.scaleRange[0] + row.scaleRange[1]) * 0.5;
      const sampleTex = this.textures.get(fernKeys[0]).getSourceImage();
      const sampleW = sampleTex.width * sampleScale;
      const step = Math.max(24, sampleW * row.xSpacingMult);
      const spawnStartX = ga.x - 220;
      const spawnEndX = ga.x + ga.w + 220;
      const count = Math.ceil((spawnEndX - spawnStartX) / step);
      const ferns = [];

      let lastX = spawnStartX - step;
      for (let i = 0; i < count; i++) {
        const key = fernKeys[Math.floor(Math.random() * fernKeys.length)];
        const scale = row.scaleRange[0] + Math.random() * (row.scaleRange[1] - row.scaleRange[0]);
        const tex = this.textures.get(key);
        const source = tex.getSourceImage();
        const displayW = source.width * scale;
        const displayH = source.height * scale;
        // Place at least one step from the previous fern, with slight forward jitter
        const x = lastX + step + Math.random() * step * 0.15;
        lastX = x;
        const y = yMin + Math.random() * Math.max(1, yMax - yMin);
        const img = this.add.image(x, y, key).setOrigin(0.5, 1);
        img.setDisplaySize(displayW, displayH);
        img.setAlpha(row.alpha);
        container.add(img);
        ferns.push({ img, displayW, displayH });
      }

      this._fernLayers.push({ container, row, ferns, yMin, yMax });
    }
  }

  _destroyParallax() {
    for (const layer of this._parallaxLayers) {
      if (!layer) continue;

      // Remove custom texture frames
      const textureKey = layer.getData && layer.getData('textureKey');
      const frameNames = layer.getData && layer.getData('frameNames');
      if (textureKey && frameNames) {
        const texture = this.textures.get(textureKey);
        for (const name of frameNames) {
          if (texture.has(name)) texture.remove(name);
        }
      }

      // Clean up geometry mask
      const maskRef = layer.getData && layer.getData('mask');
      const maskGfx = layer.getData && layer.getData('maskGfx');
      if (maskRef) layer.clearMask();
      if (maskRef) maskRef.destroy();
      if (maskGfx) maskGfx.destroy();

      layer.destroy(true);
    }
    this._parallaxLayers = [];
    for (const { container } of this._treeLayers) {
      const maskRef = container.getData && container.getData('mask');
      const maskGfx = container.getData && container.getData('maskGfx');
      if (maskRef) container.clearMask();
      if (maskRef) maskRef.destroy();
      if (maskGfx) maskGfx.destroy();
      container.destroy(true);
    }
    this._treeLayers = [];
    for (const { container } of this._fernLayers) {
      const maskRef = container.getData && container.getData('mask');
      const maskGfx = container.getData && container.getData('maskGfx');
      if (maskRef) container.clearMask();
      if (maskRef) maskRef.destroy();
      if (maskGfx) maskGfx.destroy();
      container.destroy(true);
    }
    this._fernLayers = [];
    if (this._groundContainer) {
      this._groundContainer.destroy(true);
      this._groundContainer = null;
    }
    if (this._bareGroundContainer) {
      this._bareGroundContainer.destroy(true);
      this._bareGroundContainer = null;
    }
  }

  _shutdown() {
    this.scene.stop('OverworldScene');
    this.scene.stop('UIScene');
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
    this._destroyParallax();
    CombatEngine.destroy();
    console.log('[GameScene] shutdown â€” cleaned up');
  }
}


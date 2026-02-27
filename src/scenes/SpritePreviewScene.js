// SpritePreviewScene — dev tool for previewing player sprite poses, walk cycles, and armor sets.
// Runs as a parallel scene (like OverworldScene). Toggled with P key from UIScene.

import Phaser from 'phaser';
import { ARMOR_SETS } from '../config/playerSprites.js';
import { LAYOUT } from '../config/layout.js';

const WALK_DELAYS = [200, 300, 450, 600];
const SPRITE_W = 300;
const SPRITE_H = 375;

export default class SpritePreviewScene extends Phaser.Scene {
  constructor() {
    super('SpritePreviewScene');
  }

  create() {
    const ga = LAYOUT.gameArea;

    // Opaque background covering game area
    this._bg = this.add.rectangle(ga.x + ga.w / 2, ga.y + ga.h / 2, ga.w, ga.h, 0x111111, 0.95);

    // Title
    this.add.text(ga.x + 20, ga.y + 10, 'SPRITE PREVIEW', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
    });

    // Close hint
    this.add.text(ga.x + ga.w - 20, ga.y + 12, 'CLOSE [P]', {
      fontFamily: 'monospace', fontSize: '13px', color: '#38bdf8',
      backgroundColor: '#333333', padding: { x: 8, y: 4 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._requestClose());

    // State
    this._armorSetKeys = Object.keys(ARMOR_SETS);
    this._armorIndex = 0;
    this._delayIndex = WALK_DELAYS.indexOf(450); // default 450ms
    this._cycling = true;
    this._walkIndex = 0;
    this._frozenKey = null;

    // Player sprite centered in game area
    const cx = ga.x + ga.w / 2;
    const cy = ga.y + ga.h / 2 + 40;
    this._baseY = cy;
    const set = this._currentSet();
    this._sprite = this.add.image(cx, cy, set.walkFrames[0]);
    this._sprite.setDisplaySize(SPRITE_W, SPRITE_H);

    // Info text below sprite
    this._infoText = this.add.text(cx, cy + SPRITE_H / 2 + 20, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#a1a1aa',
      align: 'center',
    }).setOrigin(0.5, 0);
    this._updateInfo();

    // ── Controls row (top area) ──
    let btnY = ga.y + 50;
    const btnStyle = {
      fontFamily: 'monospace', fontSize: '12px', color: '#e2e8f0',
      backgroundColor: '#333333', padding: { x: 8, y: 5 },
    };
    const activeBtnStyle = { backgroundColor: '#4f46e5' };

    // Armor toggle
    this._armorBtn = this._makeButton(ga.x + 20, btnY, this._armorLabel(), btnStyle, () => {
      this._armorIndex = (this._armorIndex + 1) % this._armorSetKeys.length;
      this._armorBtn.setText(this._armorLabel());
      this._resetCycle();
    });

    // Speed control
    this._speedBtn = this._makeButton(ga.x + 160, btnY, this._speedLabel(), btnStyle, () => {
      this._delayIndex = (this._delayIndex + 1) % WALK_DELAYS.length;
      this._speedBtn.setText(this._speedLabel());
      if (this._cycling) this._restartTimer();
    });

    // ── Pose buttons row ──
    btnY += 30;
    this._poseButtons = [];
    const poses = this._buildPoseList();
    let bx = ga.x + 20;
    for (const pose of poses) {
      const btn = this._makeButton(bx, btnY, pose.label, btnStyle, () => {
        this._selectPose(pose);
      });
      this._poseButtons.push({ btn, pose });
      bx += btn.width + 6;
      // Wrap to next row if exceeding game area
      if (bx > ga.x + ga.w - 60) {
        bx = ga.x + 20;
        btnY += 28;
      }
    }

    // Walk cycle timer
    this._walkTimer = null;
    this._startCycle();

    // Go to sleep immediately — UIScene will wake us
    this.scene.sleep();
  }

  // ── Helpers ──

  _currentSet() {
    return ARMOR_SETS[this._armorSetKeys[this._armorIndex]];
  }

  _armorLabel() {
    return `Armor: ${this._armorSetKeys[this._armorIndex]}`;
  }

  _speedLabel() {
    return `Speed: ${WALK_DELAYS[this._delayIndex]}ms`;
  }

  _buildPoseList() {
    // Build a unified list from armor001 (superset of labels).
    // Actual textures come from current set at display time.
    const poses = [];
    poses.push({ label: 'Walk Cycle', type: 'cycle' });
    poses.push({ label: 'Default', type: 'key', getter: (s) => s.default });
    poses.push({ label: 'StrongPunch', type: 'key', getter: (s) => s.strongPunch });
    poses.push({ label: 'HitReact', type: 'key', getter: (s) => s.hitReaction });
    poses.push({ label: 'PowerCharge', type: 'key', getter: (s) => s.powerCharge });
    poses.push({ label: 'FortressWalk', type: 'frames', getter: (s) => s.fortressWalkFrames });

    // Individual attack sprites
    const maxAttacks = Math.max(
      ARMOR_SETS.armor001.attackSprites.length,
      ARMOR_SETS.armor002.attackSprites.length
    );
    for (let i = 0; i < maxAttacks; i++) {
      const idx = i;
      poses.push({
        label: `Atk${i + 1}`,
        type: 'key',
        getter: (s) => s.attackSprites[idx] || s.default,
      });
    }

    return poses;
  }

  _selectPose(pose) {
    const set = this._currentSet();
    if (pose.type === 'cycle') {
      this._cycling = true;
      this._frozenKey = null;
      this._startCycle();
    } else if (pose.type === 'frames') {
      // Cycle through the frames array (e.g. fortress walk)
      this._cycling = true;
      this._frozenKey = null;
      const frames = pose.getter(set);
      this._startCycleWith(frames);
    } else {
      // Freeze on a single frame
      this._cycling = false;
      this._stopTimer();
      const key = pose.getter(set);
      this._frozenKey = key;
      this._showFrame(key);
    }
    this._updateInfo();
  }

  _showFrame(key) {
    const set = this._currentSet();
    this._sprite.setTexture(key);
    const scale = (set.scaleOverrides && set.scaleOverrides[key])
      || (set.largeFrames && set.largeFrames.includes(key) ? 1.05 : 1);
    this._sprite.setDisplaySize(SPRITE_W * scale, SPRITE_H * scale);
    const yOff = (set.yOffsets && set.yOffsets[key]) || 0;
    this._sprite.y = this._baseY + yOff;
    this._updateInfo(key, scale);
  }

  _startCycle() {
    const set = this._currentSet();
    this._startCycleWith(set.walkFrames);
  }

  _startCycleWith(frames) {
    this._stopTimer();
    this._activeFrames = [...frames];
    this._walkIndex = 0;
    this._showFrame(this._activeFrames[0]);
    this._walkTimer = this.time.addEvent({
      delay: WALK_DELAYS[this._delayIndex],
      loop: true,
      callback: () => {
        this._walkIndex = (this._walkIndex + 1) % this._activeFrames.length;
        this._showFrame(this._activeFrames[this._walkIndex]);
      },
    });
  }

  _stopTimer() {
    if (this._walkTimer) {
      this._walkTimer.remove();
      this._walkTimer = null;
    }
  }

  _restartTimer() {
    if (this._cycling && this._activeFrames) {
      this._startCycleWith(this._activeFrames);
    }
  }

  _resetCycle() {
    if (this._cycling) {
      this._startCycle();
    } else if (this._frozenKey) {
      // Re-resolve frozen pose from new armor set
      this._showFrame(this._frozenKey);
    }
    this._updateInfo();
  }

  _updateInfo(key, scale) {
    const set = this._currentSet();
    const frameKey = key || (this._activeFrames ? this._activeFrames[this._walkIndex] : set.walkFrames[0]);
    const s = scale || ((set.scaleOverrides && set.scaleOverrides[frameKey])
      || (set.largeFrames && set.largeFrames.includes(frameKey) ? 1.05 : 1));
    this._infoText.setText(
      `Frame: ${frameKey}\nScale: ${s.toFixed(2)}x  |  Set: ${set.id}  |  Delay: ${WALK_DELAYS[this._delayIndex]}ms`
    );
  }

  _makeButton(x, y, label, style, onClick) {
    const btn = this.add.text(x, y, label, style)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerdown', onClick);
    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#555555' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#333333' }));
    return btn;
  }

  _requestClose() {
    // UIScene handles the actual toggle
    const uiScene = this.scene.get('UIScene');
    if (uiScene && uiScene._toggleSpritePreview) {
      uiScene._toggleSpritePreview();
    }
  }
}

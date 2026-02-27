import Phaser from 'phaser';
import { WORLD, PARALLAX } from '../config.js';
import { emit, EVENTS } from '../events.js';
import Store from '../systems/Store.js';
import SaveManager from '../systems/SaveManager.js';

const BUTTON_STYLE = {
  fontFamily: 'monospace',
  fontSize: '26px',
  color: '#f5f5f5',
  backgroundColor: '#1f2937',
  padding: { x: 22, y: 10 },
  fontStyle: 'bold',
  align: 'center',
};

export default class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
    this._parallaxLayers = [];
    this._draggingVolume = false;
    this._settingsVisible = false;
    this._quitFadeTween = null;
  }

  create() {
    this.cameras.main.setBackgroundColor('#0b1220');

    this._createParallax();
    this._createChrome();
    this._createMenu();
    this._createConfirmRow();
    this._createSettingsPanel();
    this._createQuitMessage();

    this.events.on('shutdown', () => this._shutdown());
  }

  update(_time, delta) {
    const dt = delta / 1000;
    for (const layer of this._parallaxLayers) {
      const travel = layer.speed * dt;
      for (const image of layer.images) {
        image.x -= travel;
      }
      if (layer.images[0].x + layer.width <= 0) {
        for (const image of layer.images) {
          image.x += layer.width;
        }
      }
    }
  }

  _createParallax() {
    const layers = [
      { key: 'start_sky', y: 0, h: 460, speed: PARALLAX.baseSpeedPxPerSec * 0.5, depth: -30 },
      { key: 'start_ground', y: 460, h: WORLD.height - 460, speed: PARALLAX.baseSpeedPxPerSec * 3, depth: -10 },
    ];

    for (const layer of layers) {
      const imgA = this.add.image(0, layer.y, layer.key).setOrigin(0, 0);
      const imgB = this.add.image(WORLD.width, layer.y, layer.key).setOrigin(0, 0);
      imgA.setDisplaySize(WORLD.width, layer.h);
      imgB.setDisplaySize(WORLD.width, layer.h);
      imgA.setDepth(layer.depth);
      imgB.setDepth(layer.depth);
      this._parallaxLayers.push({
        images: [imgA, imgB],
        speed: layer.speed,
        width: WORLD.width,
      });
    }
  }

  _createChrome() {
    this.add.rectangle(
      WORLD.width / 2,
      WORLD.height / 2,
      WORLD.width,
      WORLD.height,
      0x000000,
      0.42
    ).setDepth(5);

    this.add.text(WORLD.width / 2, 150, "EXILE'S ASCENSION", {
      fontFamily: 'Georgia',
      fontSize: '58px',
      color: '#fef3c7',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(10);

    this.add.text(WORLD.width / 2, 198, 'A LitRPG Idle Adventure', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#d1d5db',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);
  }

  _createMenu() {
    const centerX = WORLD.width / 2;
    const startY = 300;
    const gap = 60;

    this._newGameBtn = this._createMenuButton(centerX, startY, 'NEW GAME', () => this._onNewGamePressed());

    const hasSave = SaveManager.hasSave();
    this._loadGameBtn = this._createMenuButton(centerX, startY + gap, 'LOAD GAME', () => this._onLoadGamePressed());
    if (!hasSave) {
      this._loadGameBtn.setAlpha(0.35);
      this._loadGameBtn.disableInteractive();
    }

    this._settingsBtn = this._createMenuButton(centerX, startY + gap * 2, 'SETTINGS', () => this._toggleSettings());
    this._quitBtn = this._createMenuButton(centerX, startY + gap * 3, 'QUIT', () => this._showQuitMessage());
  }

  _createConfirmRow() {
    const centerX = WORLD.width / 2;
    const y = 565;
    this._confirmWarning = this.add.text(centerX, y - 28, 'Current save will be overwritten.', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#fecaca',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20).setVisible(false);

    this._confirmYes = this._createMenuButton(centerX - 90, y, 'CONFIRM', () => this._startNewGame(true), {
      fontSize: '20px',
      color: '#fef2f2',
      backgroundColor: '#991b1b',
      padding: { x: 14, y: 7 },
    });
    this._confirmNo = this._createMenuButton(centerX + 90, y, 'CANCEL', () => this._hideNewGameConfirm(), {
      fontSize: '20px',
      color: '#f8fafc',
      backgroundColor: '#334155',
      padding: { x: 14, y: 7 },
    });
    this._confirmYes.setVisible(false);
    this._confirmNo.setVisible(false);
  }

  _createSettingsPanel() {
    const cx = WORLD.width / 2;
    const cy = WORLD.height / 2;

    const panelBg = this.add.rectangle(cx, cy, 470, 190, 0x111827, 0.93).setDepth(30).setVisible(false);
    const panelBorder = this.add.rectangle(cx, cy, 470, 190).setStrokeStyle(2, 0x6b7280).setDepth(31).setVisible(false);
    const title = this.add.text(cx, cy - 62, 'SETTINGS', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#e5e7eb',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(31).setVisible(false);

    const trackW = 250;
    const trackH = 12;
    const trackX = cx - trackW / 2;
    const trackY = cy - 6;
    const volumeLabel = this.add.text(trackX, trackY - 26, 'Music Volume', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#d1d5db',
    }).setDepth(31).setVisible(false);

    const trackBg = this.add.rectangle(trackX, trackY, trackW, trackH, 0x374151).setOrigin(0, 0.5).setDepth(31).setVisible(false);
    const volume = Store.getState().settings.musicVolume;
    const trackFill = this.add.rectangle(trackX, trackY, trackW * volume, trackH, 0x22c55e).setOrigin(0, 0.5).setDepth(32).setVisible(false);
    const percent = this.add.text(trackX + trackW + 12, trackY - 10, `${Math.round(volume * 100)}%`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#d1d5db',
    }).setDepth(31).setVisible(false);

    const sliderHit = this.add.rectangle(trackX, trackY, trackW, 28, 0x000000, 0.001)
      .setOrigin(0, 0.5)
      .setDepth(33)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });

    const closeBtn = this._createMenuButton(cx, cy + 58, 'BACK', () => this._toggleSettings(), {
      fontSize: '18px',
      backgroundColor: '#334155',
      padding: { x: 16, y: 6 },
    });
    closeBtn.setDepth(32).setVisible(false);

    const setVolumeFromPointer = (pointer) => {
      const localX = Phaser.Math.Clamp(pointer.x - trackX, 0, trackW);
      const newVol = Math.round((localX / trackW) * 100) / 100;
      Store.updateSetting('musicVolume', newVol);
      trackFill.setDisplaySize(trackW * newVol, trackH);
      percent.setText(`${Math.round(newVol * 100)}%`);
    };

    sliderHit.on('pointerdown', (pointer) => {
      setVolumeFromPointer(pointer);
      this._draggingVolume = true;
    });

    this._onPointerMove = (pointer) => {
      if (this._draggingVolume && this._settingsVisible) {
        setVolumeFromPointer(pointer);
      }
    };
    this._onPointerUp = () => {
      this._draggingVolume = false;
    };
    this.input.on('pointermove', this._onPointerMove);
    this.input.on('pointerup', this._onPointerUp);

    this._settingsObjects = [
      panelBg,
      panelBorder,
      title,
      volumeLabel,
      trackBg,
      trackFill,
      percent,
      sliderHit,
      closeBtn,
    ];
  }

  _createQuitMessage() {
    this._quitMessage = this.add.text(WORLD.width / 2, WORLD.height - 70, '', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#fca5a5',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20).setVisible(false);
  }

  _createMenuButton(x, y, label, onClick, overrideStyle = {}) {
    const btn = this.add.text(x, y, label, { ...BUTTON_STYLE, ...overrideStyle })
      .setOrigin(0.5)
      .setDepth(12)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerdown', onClick);
    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#4b5563' }));
    btn.on('pointerout', () => {
      const bg = overrideStyle.backgroundColor || BUTTON_STYLE.backgroundColor;
      btn.setStyle({ backgroundColor: bg });
    });

    return btn;
  }

  _onNewGamePressed() {
    this._setSettingsVisible(false);
    this._quitMessage.setVisible(false);
    if (SaveManager.hasSave()) {
      this._showNewGameConfirm();
      return;
    }
    this._startNewGame(false);
  }

  _onLoadGamePressed() {
    this._setSettingsVisible(false);
    this._hideNewGameConfirm();
    this.scene.start('GameScene');
  }

  _startNewGame(overwriteExisting) {
    this._hideNewGameConfirm();
    this._setSettingsVisible(false);
    if (overwriteExisting) {
      SaveManager.clearSaveForNewGame();
    }
    Store.resetState();
    emit(EVENTS.SAVE_REQUESTED, {});
    this.scene.start('GameScene');
  }

  _showNewGameConfirm() {
    this._confirmWarning.setVisible(true);
    this._confirmYes.setVisible(true);
    this._confirmNo.setVisible(true);
  }

  _hideNewGameConfirm() {
    this._confirmWarning.setVisible(false);
    this._confirmYes.setVisible(false);
    this._confirmNo.setVisible(false);
  }

  _toggleSettings() {
    this._hideNewGameConfirm();
    this._setSettingsVisible(!this._settingsVisible);
  }

  _setSettingsVisible(visible) {
    this._settingsVisible = visible;
    this._draggingVolume = false;
    for (const obj of this._settingsObjects) {
      obj.setVisible(visible);
    }
    this._quitMessage.setVisible(false);
  }

  _showQuitMessage() {
    this._setSettingsVisible(false);
    this._hideNewGameConfirm();
    this._quitMessage.setText('There is no escape. Close the tab if you dare.');
    this._quitMessage.setAlpha(1).setVisible(true);

    if (this._quitFadeTween) {
      this._quitFadeTween.stop();
      this._quitFadeTween = null;
    }
    this._quitFadeTween = this.tweens.add({
      targets: this._quitMessage,
      alpha: 0,
      delay: 1600,
      duration: 600,
      ease: 'Linear',
      onComplete: () => {
        this._quitMessage.setVisible(false);
        this._quitFadeTween = null;
      },
    });
  }

  _shutdown() {
    this._draggingVolume = false;
    if (this._onPointerMove) this.input.off('pointermove', this._onPointerMove);
    if (this._onPointerUp) this.input.off('pointerup', this._onPointerUp);
    if (this._quitFadeTween) {
      this._quitFadeTween.stop();
      this._quitFadeTween = null;
    }
    this._parallaxLayers = [];
    this._settingsObjects = [];
  }
}

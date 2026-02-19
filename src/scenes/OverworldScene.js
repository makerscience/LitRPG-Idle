// OverworldScene — full-screen territory map overlay.
// Runs as a parallel scene (GameScene stays active underneath).
// Does NOT call TimeEngine.update() — GameScene handles that.

import Phaser from 'phaser';
import Store from '../systems/Store.js';
import TerritoryManager from '../systems/TerritoryManager.js';
import { on, EVENTS } from '../events.js';
import { format, D } from '../systems/BigNum.js';
import { LAYOUT, TERRITORY, COLORS, ZONE_THEMES } from '../config.js';
import { getAllTerritories, getTerritoriesForZone } from '../data/territories.js';
import { getEnemyById } from '../data/enemies.js';

export default class OverworldScene extends Phaser.Scene {
  constructor() {
    super('OverworldScene');
    this._unsubs = [];
    this._nodes = [];
    this._infoPanelObjects = [];
    this._selectedTerritory = null;
  }

  create() {
    const ga = LAYOUT.gameArea;

    // Opaque background covering game area
    this._bg = this.add.rectangle(ga.x + ga.w / 2, ga.y + ga.h / 2, ga.w, ga.h, 0x111111, 0.95);

    // Title
    this._title = this.add.text(ga.x + 20, ga.y + 10, 'OVERWORLD MAP', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
    });

    // Subtitle
    this._subtitle = this.add.text(ga.x + 20, ga.y + 34, 'Claim territories to unlock permanent buffs', {
      fontFamily: 'monospace', fontSize: '11px', color: '#a1a1aa',
    });

    // Close button (top-right of game area)
    this._closeBtn = this.add.text(ga.x + ga.w - 20, ga.y + 12, 'CLOSE [M]', {
      fontFamily: 'monospace', fontSize: '13px', color: '#a1a1aa',
      backgroundColor: '#333333', padding: { x: 10, y: 5 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this._closeBtn.on('pointerdown', () => this._close());
    this._closeBtn.on('pointerover', () => this._closeBtn.setStyle({ color: '#ffffff', backgroundColor: '#555555' }));
    this._closeBtn.on('pointerout', () => this._closeBtn.setStyle({ color: '#a1a1aa', backgroundColor: '#333333' }));

    // Area labels on the left side
    this._zoneLabels = [];
    const areas = [
      { area: 1, y: 540 }, { area: 2, y: 430 }, { area: 3, y: 320 },
      { area: 4, y: 210 }, { area: 5, y: 100 },
    ];
    for (const { area, y } of areas) {
      const theme = ZONE_THEMES[area];
      const label = this.add.text(ga.x + 20, ga.y + y - 10, `Area ${area}: ${theme.name}`, {
        fontFamily: 'monospace', fontSize: '11px', color: '#666666',
      });
      this._zoneLabels.push(label);
    }

    // Connection lines between nodes (drawn before nodes)
    this._drawConnections(ga);

    // Create territory nodes
    this._createNodes(ga);

    // Info panel area (right side)
    this._infoPanelX = ga.x + TERRITORY.infoPanelX;
    this._infoPanelY = ga.y + 60;

    // Subscribe to events for live updates while map is open
    this._unsubs.push(on(EVENTS.COMBAT_ENEMY_KILLED, (data) => {
      if (data.despawned) return;
      if (this.scene.isActive()) this._refreshNodes();
    }));
    this._unsubs.push(on(EVENTS.STATE_CHANGED, () => {
      if (this.scene.isActive()) {
        this._refreshNodes();
        if (this._selectedTerritory) this._showInfoPanel(this._selectedTerritory);
      }
    }));
    this._unsubs.push(on(EVENTS.TERRITORY_CLAIMED, () => {
      if (this.scene.isActive()) this._refreshNodes();
    }));

    // Refresh on wake
    this.events.on('wake', () => {
      this._refreshNodes();
      this._clearInfoPanel();
      this._selectedTerritory = null;
    });

    // Start sleeping — UIScene will wake us
    this.scene.sleep();
  }

  _drawConnections(ga) {
    const gfx = this.add.graphics();
    gfx.lineStyle(1, 0x333333, 0.5);

    // Vertical connections within each zone row
    const territories = getAllTerritories();
    const byZone = {};
    for (const t of territories) {
      if (!byZone[t.zone]) byZone[t.zone] = [];
      byZone[t.zone].push(t);
    }

    // Horizontal connections within zones
    for (const zone of Object.keys(byZone)) {
      const zoneTs = byZone[zone].sort((a, b) => a.mapPosition.x - b.mapPosition.x);
      for (let i = 0; i < zoneTs.length - 1; i++) {
        const a = zoneTs[i].mapPosition;
        const b = zoneTs[i + 1].mapPosition;
        gfx.beginPath();
        gfx.moveTo(ga.x + a.x, ga.y + a.y);
        gfx.lineTo(ga.x + b.x, ga.y + b.y);
        gfx.strokePath();
      }
    }

    // Vertical connections between zone rows (center node to center node)
    const zoneNums = Object.keys(byZone).map(Number).sort((a, b) => a - b);
    for (let i = 0; i < zoneNums.length - 1; i++) {
      const lower = byZone[zoneNums[i]];
      const upper = byZone[zoneNums[i + 1]];
      // Connect center-ish nodes
      const lowerCenter = lower[Math.floor(lower.length / 2)];
      const upperCenter = upper[Math.floor(upper.length / 2)];
      gfx.beginPath();
      gfx.moveTo(ga.x + lowerCenter.mapPosition.x, ga.y + lowerCenter.mapPosition.y);
      gfx.lineTo(ga.x + upperCenter.mapPosition.x, ga.y + upperCenter.mapPosition.y);
      gfx.strokePath();
    }
  }

  _createNodes(ga) {
    const state = Store.getState();
    const territories = getAllTerritories();

    for (const t of territories) {
      const x = ga.x + t.mapPosition.x;
      const y = ga.y + t.mapPosition.y;
      const r = TERRITORY.nodeRadius;

      // Node circle
      const circle = this.add.circle(x, y, r, TERRITORY.colors.locked);
      circle.setInteractive({ useHandCursor: true });
      circle.on('pointerdown', () => this._onNodeClick(t));

      // Short label below node
      const shortName = t.name.length > 12 ? t.name.substring(0, 11) + '...' : t.name;
      const label = this.add.text(x, y + r + 8, shortName, {
        fontFamily: 'monospace', fontSize: '9px', color: '#888888',
      }).setOrigin(0.5, 0);

      // Progress text (inside node)
      const progressText = this.add.text(x, y, '', {
        fontFamily: 'monospace', fontSize: '10px', color: '#ffffff',
      }).setOrigin(0.5);

      // Buff icon text (shown when conquered)
      const buffText = this.add.text(x, y - 2, '', {
        fontFamily: 'monospace', fontSize: '9px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);

      this._nodes.push({ territory: t, circle, label, progressText, buffText, pulseTween: null });
    }

    this._refreshNodes();
  }

  _refreshNodes() {
    const state = Store.getState();

    for (const node of this._nodes) {
      const t = node.territory;
      const conquered = TerritoryManager.isConquered(t.id);
      const zoneReached = state.furthestArea >= t.area;
      const canClaim = TerritoryManager.canClaim(t.id);

      // Determine state and color
      let color;
      if (conquered) {
        color = TERRITORY.colors.conquered;
      } else if (!zoneReached) {
        color = TERRITORY.colors.locked;
      } else if (canClaim) {
        color = TERRITORY.colors.claimable;
      } else {
        color = TERRITORY.colors.unlocked;
      }

      node.circle.setFillStyle(color);

      // Update progress/buff text
      if (conquered) {
        node.progressText.setText('');
        node.buffText.setText(t.buff.label.split(' ').slice(0, 2).join(' '));
        node.buffText.setVisible(true);
      } else if (!zoneReached) {
        node.progressText.setText('LOCKED');
        node.progressText.setStyle({ fontSize: '9px', color: '#666666' });
        node.buffText.setVisible(false);
      } else {
        const progress = TerritoryManager.getKillProgress(t.id);
        node.progressText.setText(`${progress.current}/${progress.required}`);
        node.progressText.setStyle({ fontSize: '10px', color: '#ffffff' });
        node.buffText.setVisible(false);
      }

      // Pulse tween for claimable nodes
      if (canClaim && !node.pulseTween) {
        node.pulseTween = this.tweens.add({
          targets: node.circle,
          scaleX: 1.15,
          scaleY: 1.15,
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      } else if (!canClaim && node.pulseTween) {
        node.pulseTween.stop();
        node.pulseTween = null;
        node.circle.setScale(1);
      }

      // Interaction
      if (zoneReached || conquered) {
        node.circle.setInteractive({ useHandCursor: true });
      } else {
        node.circle.disableInteractive();
      }

      // Label color
      node.label.setStyle({
        color: conquered ? '#eab308' : zoneReached ? '#cccccc' : '#555555',
      });
    }
  }

  _onNodeClick(territory) {
    this._selectedTerritory = territory;
    this._showInfoPanel(territory);
  }

  _showInfoPanel(territory) {
    this._clearInfoPanel();

    const x = this._infoPanelX;
    let y = this._infoPanelY;
    const w = TERRITORY.infoPanelW;
    const state = Store.getState();
    const conquered = TerritoryManager.isConquered(territory.id);
    const canClaim = TerritoryManager.canClaim(territory.id);
    const progress = TerritoryManager.getKillProgress(territory.id);
    const enemy = getEnemyById(territory.enemyId);

    // Panel background
    const panelBg = this.add.rectangle(x + w / 2, this._infoPanelY + 200, w, 420, 0x1a1a1a, 0.9);
    panelBg.setStrokeStyle(1, 0x333333);
    this._infoPanelObjects.push(panelBg);

    // Territory name
    const nameText = this.add.text(x + 15, y, territory.name, {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
      wordWrap: { width: w - 30 },
    });
    this._infoPanelObjects.push(nameText);
    y += nameText.height + 8;

    // Area label
    const theme = ZONE_THEMES[territory.area];
    const zoneText = this.add.text(x + 15, y, `Area ${territory.area}: ${theme.name}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#888888',
    });
    this._infoPanelObjects.push(zoneText);
    y += 22;

    // Enemy name
    const enemyName = enemy ? enemy.name : territory.enemyId;
    const enemyText = this.add.text(x + 15, y, `Enemy: ${enemyName}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#a1a1aa',
    });
    this._infoPanelObjects.push(enemyText);
    y += 22;

    // Description
    const descText = this.add.text(x + 15, y, territory.description, {
      fontFamily: 'monospace', fontSize: '11px', color: '#888888',
      wordWrap: { width: w - 30 },
    });
    this._infoPanelObjects.push(descText);
    y += descText.height + 14;

    // Separator
    const sep1 = this.add.rectangle(x + w / 2, y, w - 30, 1, 0x333333);
    this._infoPanelObjects.push(sep1);
    y += 12;

    // Kill progress
    const killLabel = this.add.text(x + 15, y, `Kills: ${progress.current} / ${progress.required}`, {
      fontFamily: 'monospace', fontSize: '13px',
      color: progress.ratio >= 1 ? '#22c55e' : '#ffffff',
    });
    this._infoPanelObjects.push(killLabel);
    y += 22;

    // Kill progress bar
    const barW = w - 30;
    const barH = 12;
    const barBg = this.add.rectangle(x + 15, y, barW, barH, 0x374151).setOrigin(0, 0.5);
    this._infoPanelObjects.push(barBg);
    const fillW = Math.max(1, barW * progress.ratio);
    const barFill = this.add.rectangle(x + 15, y, fillW, barH, progress.ratio >= 1 ? 0x22c55e : 0x6366f1).setOrigin(0, 0.5);
    this._infoPanelObjects.push(barFill);
    y += 22;

    // Gold cost
    const goldNeeded = D(territory.goldCost);
    const canAfford = state.gold.gte(goldNeeded);
    const costColor = conquered ? '#888888' : canAfford ? '#22c55e' : '#ef4444';
    const costLabel = this.add.text(x + 15, y, `Gold Cost: ${format(goldNeeded)}`, {
      fontFamily: 'monospace', fontSize: '13px', color: costColor,
    });
    this._infoPanelObjects.push(costLabel);
    y += 26;

    // Separator
    const sep2 = this.add.rectangle(x + w / 2, y, w - 30, 1, 0x333333);
    this._infoPanelObjects.push(sep2);
    y += 12;

    // Buff description
    const buffText = this.add.text(x + 15, y, `Buff: ${territory.buff.label}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#eab308', fontStyle: 'bold',
    });
    this._infoPanelObjects.push(buffText);
    y += 28;

    // Conquered badge or Claim button
    if (conquered) {
      const badge = this.add.text(x + w / 2, y + 10, 'CONQUERED', {
        fontFamily: 'monospace', fontSize: '16px', color: '#eab308', fontStyle: 'bold',
        backgroundColor: '#332800',
        padding: { x: 16, y: 8 },
      }).setOrigin(0.5, 0);
      this._infoPanelObjects.push(badge);
    } else if (canClaim) {
      const claimBtn = this.add.text(x + w / 2, y + 10, 'CLAIM TERRITORY', {
        fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
        backgroundColor: '#166534',
        padding: { x: 16, y: 8 },
      }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });

      claimBtn.on('pointerover', () => claimBtn.setStyle({ backgroundColor: '#15803d' }));
      claimBtn.on('pointerout', () => claimBtn.setStyle({ backgroundColor: '#166534' }));
      claimBtn.on('pointerdown', () => {
        const success = TerritoryManager.claim(territory.id);
        if (success) {
          this._refreshNodes();
          this._showInfoPanel(territory);
          // Flash effect on the claimed node
          const node = this._nodes.find(n => n.territory.id === territory.id);
          if (node) {
            this.tweens.add({
              targets: node.circle,
              scaleX: 1.5, scaleY: 1.5,
              duration: 200,
              yoyo: true,
              ease: 'Quad.easeOut',
            });
          }
        }
      });
      this._infoPanelObjects.push(claimBtn);
    } else {
      // Show requirements
      const reqs = [];
      if (progress.ratio < 1) reqs.push(`Need ${progress.required - progress.current} more kills`);
      if (!canAfford && !conquered) reqs.push(`Need ${format(goldNeeded.minus(state.gold))} more gold`);
      if (reqs.length > 0) {
        const reqText = this.add.text(x + 15, y, reqs.join('\n'), {
          fontFamily: 'monospace', fontSize: '11px', color: '#ef4444',
          wordWrap: { width: w - 30 },
        });
        this._infoPanelObjects.push(reqText);
      }
    }
  }

  _close() {
    const uiScene = this.scene.get('UIScene');
    if (uiScene && uiScene._toggleMap) {
      uiScene._toggleMap();
    }
  }

  _clearInfoPanel() {
    for (const obj of this._infoPanelObjects) obj.destroy();
    this._infoPanelObjects = [];
  }

  _shutdown() {
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
    for (const node of this._nodes) {
      if (node.pulseTween) node.pulseTween.stop();
    }
    this._nodes = [];
    this._clearInfoPanel();
  }
}

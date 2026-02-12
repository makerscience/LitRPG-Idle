// InventoryPanel — modal overlay for inventory and equipment.
// Toggle via BAG button or I key. Silhouette equipment screen on left, inventory grid on right.

import ModalPanel from './ModalPanel.js';
import { EVENTS } from '../events.js';
import { COLORS } from '../config.js';
import { getItem, getScaledItem } from '../data/items.js';
import {
  getMaxEquipTier, getLeftSlots, getRightSlots, getAccessorySlots,
} from '../data/equipSlots.js';
import Store from '../systems/Store.js';
import InventorySystem from '../systems/InventorySystem.js';
import { parseStackKey } from '../systems/InventorySystem.js';
import { makeButton } from './ui-utils.js';

const PANEL_W = 880;
const PANEL_H = 560;

// Grid constants (inventory grid, right side)
const GRID_COLS = 5;
const GRID_ROWS = 4;
const SLOT_SIZE = 64;
const SLOT_GAP = 6;
const SLOT_STEP = SLOT_SIZE + SLOT_GAP; // 70px

// Equipment slot dimensions (small boxes around silhouette)
const EQ_W = 84;
const EQ_H = 32;
const EQ_GAP = 4;

// Accessory slot dimensions (bottom row)
const ACC_W = 72;
const ACC_H = 26;
const ACC_GAP = 4;

// Rarity colors as hex numbers for Phaser graphics
const RARITY_HEX = {
  common:   0xa1a1aa,
  uncommon: 0x22c55e,
  rare:     0x3b82f6,
  epic:     0xa855f7,
};

export default class InventoryPanel extends ModalPanel {
  constructor(scene) {
    super(scene, {
      key: 'inventory',
      width: PANEL_W,
      height: PANEL_H,
      hotkey: 'I',
      buttonLabel: 'BAG [I]',
      buttonX: 480 - 80,
      buttonColor: '#ffffff',
    });

    this._selectedItemId = null;
  }

  _getTitle() { return 'INVENTORY'; }

  _getEvents() {
    return [
      EVENTS.INV_ITEM_ADDED, EVENTS.INV_ITEM_EQUIPPED,
      EVENTS.INV_ITEM_SOLD, EVENTS.INV_FULL, EVENTS.SAVE_LOADED,
    ];
  }

  _createStaticContent() {
    const panelLeft = this._cx - PANEL_W / 2;

    // Silhouette — large dimmed player sprite centered in left zone (5x scale, clips at panel edges)
    const silCx = panelLeft + 170;
    const silCy = this._cy + 10;
    this._silhouette = this.scene.add.image(silCx, silCy, 'player001_default');
    this._silhouette.setDisplaySize(540, 675);
    this._silhouette.setTint(0x333344);
    this._silhouette.setAlpha(0.4);
    this._modalObjects.push(this._silhouette);

    // Mask so silhouette doesn't bleed into the right zone or outside the panel
    const panelTop = this._cy - PANEL_H / 2;
    const maskShape = this.scene.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillRect(panelLeft, panelTop, 340, PANEL_H);
    this._silhouette.setMask(maskShape.createGeometryMask());

    // Store silhouette center for dynamic content
    this._silCx = silCx;
    this._silCy = silCy;

    // Equipment section label
    const eqX = panelLeft + 20;
    const eqY = this._cy - PANEL_H / 2 + 50;
    this._eqLabel = this.scene.add.text(eqX, eqY, 'Equipment', {
      fontFamily: 'monospace', fontSize: '13px', color: '#818cf8',
    });
    this._modalObjects.push(this._eqLabel);

    // Separator line between equipment and inventory
    const sepX = panelLeft + 345;
    this._sepLine = this.scene.add.rectangle(sepX, this._cy, 1, PANEL_H - 30, 0x444444);
    this._modalObjects.push(this._sepLine);

    // Inventory section label
    const invX = panelLeft + 360;
    const invY = this._cy - PANEL_H / 2 + 50;
    this._invLabel = this.scene.add.text(invX, invY, 'Inventory', {
      fontFamily: 'monospace', fontSize: '13px', color: '#818cf8',
    });
    this._modalObjects.push(this._invLabel);
  }

  _open() {
    this._selectedItemId = null;
    super._open();
  }

  _close() {
    this._selectedItemId = null;
    super._close();
  }

  _buildContent() {
    this._renderEquipmentSilhouette();
    this._renderInventoryGrid();
    this._renderItemDetail();
  }

  // --- Equipment Silhouette (left zone) ---

  _renderEquipmentSilhouette() {
    const state = Store.getState();
    const maxTier = getMaxEquipTier();
    const leftSlots = getLeftSlots(maxTier);
    const rightSlots = getRightSlots(maxTier);
    const accSlots = getAccessorySlots(maxTier);

    const silCx = this._silCx;
    const silCy = this._silCy;

    // Connector lines graphics
    const gfx = this.scene.add.graphics();
    gfx.lineStyle(1, 0x555566, 0.6);
    this._dynamicObjects.push(gfx);

    // Left column — slot boxes at silhouetteCx - 150
    const leftX = silCx - 150;
    this._layoutColumn(leftSlots, leftX, silCy, state, gfx, silCx, silCy, 'left');

    // Right column — slot boxes at silhouetteCx + 66
    const rightX = silCx + 66;
    this._layoutColumn(rightSlots, rightX, silCy, state, gfx, silCx, silCy, 'right');

    // Accessory grid — bottom row
    if (accSlots.length > 0) {
      this._layoutAccessories(accSlots, silCx, silCy + 100, state);
    }
  }

  /**
   * Stack slots vertically in a column, centered on silCy.
   */
  _layoutColumn(slots, x, centerY, state, gfx, silCx, silCy, side) {
    if (slots.length === 0) return;

    // Panel bounds for clamping connector line endpoints
    const panelLeft = this._cx - PANEL_W / 2;
    const panelTop = this._cy - PANEL_H / 2 + 40; // below title
    const panelBottom = this._cy + PANEL_H / 2 - 10;
    const leftZoneRight = panelLeft + 340;

    const totalH = slots.length * EQ_H + (slots.length - 1) * EQ_GAP;
    let y = centerY - totalH / 2;

    for (const slotDef of slots) {
      const stackKey = state.equipped[slotDef.id];
      const item = stackKey ? getItem(stackKey) : null;
      const rarity = stackKey ? parseStackKey(stackKey).rarity : null;

      this._createEquipSlotSmall(x, y, slotDef, item, rarity);

      // Connector line from slot edge to body anchor (clamped to panel bounds)
      if (slotDef.anchor) {
        const rawAnchorX = silCx + slotDef.anchor.x;
        const rawAnchorY = silCy + slotDef.anchor.y;
        const anchorX = Math.max(panelLeft + 5, Math.min(rawAnchorX, leftZoneRight - 5));
        const anchorY = Math.max(panelTop, Math.min(rawAnchorY, panelBottom));
        const lineStartX = side === 'left' ? x + EQ_W : x;
        const lineStartY = y + EQ_H / 2;

        gfx.beginPath();
        gfx.moveTo(lineStartX, lineStartY);
        gfx.lineTo(anchorX, anchorY);
        gfx.strokePath();

        // Small dot at anchor point
        gfx.fillStyle(0x555566, 0.8);
        gfx.fillCircle(anchorX, anchorY, 2);
      }

      y += EQ_H + EQ_GAP;
    }
  }

  /**
   * Layout accessory slots in a horizontal grid below the silhouette.
   */
  _layoutAccessories(slots, centerX, startY, state) {
    const cols = 4;
    const totalW = cols * ACC_W + (cols - 1) * ACC_GAP;
    const originX = centerX - totalW / 2;

    for (let i = 0; i < slots.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = originX + col * (ACC_W + ACC_GAP);
      const y = startY + row * (ACC_H + ACC_GAP);

      const slotDef = slots[i];
      const stackKey = state.equipped[slotDef.id];
      const item = stackKey ? getItem(stackKey) : null;
      const rarity = stackKey ? parseStackKey(stackKey).rarity : null;

      this._createAccessorySlot(x, y, slotDef, item, rarity);
    }
  }

  /**
   * Small equipment slot box (84x32) for body slots around silhouette.
   */
  _createEquipSlotSmall(x, y, slotDef, item, rarity) {
    const displayRarity = rarity || (item ? item.rarity : null);
    const rarityColor = displayRarity ? (RARITY_HEX[displayRarity] || 0xa1a1aa) : 0x333333;
    const borderWidth = item ? 2 : 1;

    const bg = this.scene.add.rectangle(
      x + EQ_W / 2, y + EQ_H / 2, EQ_W, EQ_H, 0x1a1a1a
    );
    bg.setStrokeStyle(borderWidth, rarityColor);
    bg.setInteractive({ useHandCursor: !!item });
    this._dynamicObjects.push(bg);

    // Slot label (top-left, 8px grey)
    const label = this.scene.add.text(x + 3, y + 2, slotDef.label.toUpperCase(), {
      fontFamily: 'monospace', fontSize: '8px', color: '#666666',
    });
    this._dynamicObjects.push(label);

    if (item) {
      const nameText = this.scene.add.text(
        x + EQ_W / 2, y + EQ_H / 2 + 4, item.name,
        {
          fontFamily: 'monospace', fontSize: '9px',
          color: COLORS.rarity[displayRarity] || '#a1a1aa',
          fontStyle: 'bold', align: 'center',
          wordWrap: { width: EQ_W - 8 },
        }
      ).setOrigin(0.5);
      this._dynamicObjects.push(nameText);

      bg.on('pointerdown', () => InventorySystem.unequipItem(slotDef.id));
      bg.on('pointerover', () => bg.setStrokeStyle(3, 0xffffff));
      bg.on('pointerout', () => bg.setStrokeStyle(borderWidth, rarityColor));
    } else {
      const emptyText = this.scene.add.text(
        x + EQ_W / 2, y + EQ_H / 2 + 4, 'empty',
        { fontFamily: 'monospace', fontSize: '8px', color: '#444444' }
      ).setOrigin(0.5);
      this._dynamicObjects.push(emptyText);
    }
  }

  /**
   * Accessory slot box (72x26) for bottom accessories.
   */
  _createAccessorySlot(x, y, slotDef, item, rarity) {
    const displayRarity = rarity || (item ? item.rarity : null);
    const rarityColor = displayRarity ? (RARITY_HEX[displayRarity] || 0xa1a1aa) : 0x333333;
    const borderWidth = item ? 2 : 1;

    const bg = this.scene.add.rectangle(
      x + ACC_W / 2, y + ACC_H / 2, ACC_W, ACC_H, 0x1a1a1a
    );
    bg.setStrokeStyle(borderWidth, rarityColor);
    bg.setInteractive({ useHandCursor: !!item });
    this._dynamicObjects.push(bg);

    const label = this.scene.add.text(x + 3, y + 1, slotDef.label.toUpperCase(), {
      fontFamily: 'monospace', fontSize: '7px', color: '#666666',
    });
    this._dynamicObjects.push(label);

    if (item) {
      const nameText = this.scene.add.text(
        x + ACC_W / 2, y + ACC_H / 2 + 3, item.name,
        {
          fontFamily: 'monospace', fontSize: '8px',
          color: COLORS.rarity[displayRarity] || '#a1a1aa',
          fontStyle: 'bold', align: 'center',
          wordWrap: { width: ACC_W - 6 },
        }
      ).setOrigin(0.5);
      this._dynamicObjects.push(nameText);

      bg.on('pointerdown', () => InventorySystem.unequipItem(slotDef.id));
      bg.on('pointerover', () => bg.setStrokeStyle(3, 0xffffff));
      bg.on('pointerout', () => bg.setStrokeStyle(borderWidth, rarityColor));
    } else {
      const emptyText = this.scene.add.text(
        x + ACC_W / 2, y + ACC_H / 2 + 3, 'empty',
        { fontFamily: 'monospace', fontSize: '7px', color: '#444444' }
      ).setOrigin(0.5);
      this._dynamicObjects.push(emptyText);
    }
  }

  // --- Inventory Grid (5x4 on right) ---

  _renderInventoryGrid() {
    const state = Store.getState();
    const stacks = state.inventoryStacks;
    const entries = Object.entries(stacks);

    const panelLeft = this._cx - PANEL_W / 2;
    const gridOriginX = panelLeft + 360;
    const gridOriginY = this._cy - PANEL_H / 2 + 75;

    // Count label
    const countText = this.scene.add.text(
      this._cx + PANEL_W / 2 - 20, this._cy - PANEL_H / 2 + 50,
      `${entries.length}/20`,
      { fontFamily: 'monospace', fontSize: '11px', color: '#a1a1aa' }
    ).setOrigin(1, 0);
    this._dynamicObjects.push(countText);

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const idx = row * GRID_COLS + col;
        const x = gridOriginX + col * SLOT_STEP;
        const y = gridOriginY + row * SLOT_STEP;

        if (idx < entries.length) {
          const [stackKey, stack] = entries[idx];
          const item = getItem(stackKey);
          if (item) {
            const isSelected = this._selectedItemId === stackKey;
            const rarity = stack.rarity || item.rarity;
            this._createSlot(x, y, item, stackKey, stack.count, isSelected, rarity);
          } else {
            this._createEmptySlot(x, y);
          }
        } else {
          this._createEmptySlot(x, y);
        }
      }
    }
  }

  _createSlot(x, y, item, stackKey, count, isSelected, rarity) {
    const rarityColor = RARITY_HEX[rarity] || 0xa1a1aa;
    const borderWidth = isSelected ? 3 : 2;
    const borderColor = isSelected ? 0xffffff : rarityColor;

    const bg = this.scene.add.rectangle(
      x + SLOT_SIZE / 2, y + SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 0x1a1a1a
    );
    bg.setStrokeStyle(borderWidth, borderColor);
    bg.setInteractive({ useHandCursor: true });
    this._dynamicObjects.push(bg);

    if (isSelected) {
      const glow = this.scene.add.rectangle(
        x + SLOT_SIZE / 2, y + SLOT_SIZE / 2, SLOT_SIZE + 6, SLOT_SIZE + 6
      );
      glow.setStrokeStyle(1, rarityColor);
      glow.setFillStyle(0x000000, 0);
      this._dynamicObjects.push(glow);
    }

    const nameText = this.scene.add.text(
      x + SLOT_SIZE / 2, y + SLOT_SIZE / 2 - (count > 1 ? 5 : 0), item.name,
      {
        fontFamily: 'monospace', fontSize: '9px',
        color: COLORS.rarity[rarity] || '#a1a1aa',
        fontStyle: 'bold', align: 'center',
        wordWrap: { width: SLOT_SIZE - 6 },
      }
    ).setOrigin(0.5);
    this._dynamicObjects.push(nameText);

    if (count > 1) {
      const badge = this.scene.add.text(
        x + SLOT_SIZE - 4, y + SLOT_SIZE - 4, `x${count}`,
        { fontFamily: 'monospace', fontSize: '10px', color: '#eab308', fontStyle: 'bold' }
      ).setOrigin(1, 1);
      this._dynamicObjects.push(badge);
    }

    bg.on('pointerdown', (pointer) => {
      if (pointer.event.shiftKey) {
        InventorySystem.sellItem(stackKey, count);
      } else if (this._selectedItemId === stackKey) {
        InventorySystem.equipItem(stackKey);
        this._selectedItemId = null;
      } else {
        this._selectedItemId = stackKey;
        this._refresh();
      }
    });

    bg.on('pointerover', () => { if (!isSelected) bg.setStrokeStyle(2, 0xffffff); });
    bg.on('pointerout', () => { if (!isSelected) bg.setStrokeStyle(borderWidth, borderColor); });
  }

  _createEmptySlot(x, y) {
    const bg = this.scene.add.rectangle(
      x + SLOT_SIZE / 2, y + SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 0x1a1a1a
    );
    bg.setStrokeStyle(1, 0x333333);
    this._dynamicObjects.push(bg);
  }

  // --- Item Detail Panel (below grid) ---

  _renderItemDetail() {
    if (!this._selectedItemId) return;

    const state = Store.getState();
    const stack = state.inventoryStacks[this._selectedItemId];
    if (!stack) {
      this._selectedItemId = null;
      return;
    }

    const rarity = stack.rarity || 'common';
    const scaled = getScaledItem(this._selectedItemId, rarity);
    if (!scaled) return;

    const panelLeft = this._cx - PANEL_W / 2;
    const detailX = panelLeft + 360;
    const detailY = this._cy + PANEL_H / 2 - 80;

    const rarityColor = COLORS.rarity[rarity] || '#a1a1aa';
    const statStr = scaled.statBonuses.atk > 0
      ? `+${scaled.statBonuses.atk} ATK`
      : `+${scaled.statBonuses.def} DEF`;

    const headerText = this.scene.add.text(
      detailX, detailY,
      `${scaled.name}  ${rarity} ${scaled.slot}  ${statStr}`,
      { fontFamily: 'monospace', fontSize: '11px', color: rarityColor }
    );
    this._dynamicObjects.push(headerText);

    const descText = this.scene.add.text(
      detailX, detailY + 16, `"${scaled.description}"`,
      {
        fontFamily: 'monospace', fontSize: '10px', color: '#888888',
        fontStyle: 'italic', wordWrap: { width: PANEL_W - 400 },
      }
    );
    this._dynamicObjects.push(descText);

    // Action buttons
    const btnY = detailY + 36;
    let btnX = detailX;

    const sell1 = makeButton(this.scene, btnX, btnY, `Sell 1 (${scaled.sellValue}g)`, {
      color: '#eab308',
      onDown: () => {
        InventorySystem.sellItem(this._selectedItemId, 1);
        const s = Store.getState().inventoryStacks[this._selectedItemId];
        if (!s) this._selectedItemId = null;
      },
    });
    this._dynamicObjects.push(sell1);

    btnX += sell1.width + 8;

    if (stack.count > 1) {
      const totalGold = scaled.sellValue * stack.count;
      const sellAll = makeButton(this.scene, btnX, btnY, `Sell All x${stack.count} (${totalGold}g)`, {
        color: '#eab308',
        onDown: () => {
          InventorySystem.sellItem(this._selectedItemId, stack.count);
          this._selectedItemId = null;
        },
      });
      this._dynamicObjects.push(sellAll);
      btnX += sellAll.width + 8;
    }

    const equipBtn = makeButton(this.scene, btnX, btnY, 'Equip', {
      color: '#22c55e',
      onDown: () => {
        InventorySystem.equipItem(this._selectedItemId);
        this._selectedItemId = null;
      },
    });
    this._dynamicObjects.push(equipBtn);
  }
}

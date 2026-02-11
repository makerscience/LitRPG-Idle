// InventoryPanel — modal overlay for inventory and equipment.
// Toggle via BAG button or I key. Equipment slots on left, inventory grid on right.

import ModalPanel from './ModalPanel.js';
import { EVENTS } from '../events.js';
import { COLORS } from '../config.js';
import { getItem, getScaledItem } from '../data/items.js';
import Store from '../systems/Store.js';
import InventorySystem from '../systems/InventorySystem.js';
import { parseStackKey } from '../systems/InventorySystem.js';
import { makeButton } from './ui-utils.js';

const PANEL_W = 700;
const PANEL_H = 450;

// Grid constants
const GRID_COLS = 5;
const GRID_ROWS = 4;
const SLOT_SIZE = 64;
const SLOT_GAP = 6;
const SLOT_STEP = SLOT_SIZE + SLOT_GAP; // 70px

// Equipment slot dimensions
const EQ_SLOT_W = 120;
const EQ_SLOT_H = 60;
const EQ_SLOT_GAP = 8;
const SLOT_LABELS = ['head', 'body', 'weapon', 'legs'];
const SLOT_DISPLAY = { head: 'HEAD', body: 'BODY', weapon: 'WEAPON', legs: 'LEGS' };

// Rarity colors as hex numbers for Phaser graphics — sourced from COLORS.rarity
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
    // Equipment section label
    const eqX = this._cx - PANEL_W / 2 + 20;
    const eqY = this._cy - PANEL_H / 2 + 50;
    this._eqLabel = this.scene.add.text(eqX, eqY, 'Equipment', {
      fontFamily: 'monospace', fontSize: '13px', color: '#818cf8',
    });
    this._modalObjects.push(this._eqLabel);

    // Separator line between equipment and inventory
    const sepX = this._cx - PANEL_W / 2 + 170;
    this._sepLine = this.scene.add.rectangle(sepX, this._cy, 1, PANEL_H - 30, 0x444444);
    this._modalObjects.push(this._sepLine);

    // Inventory section label
    const invX = this._cx - PANEL_W / 2 + 190;
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
    this._renderEquipment();
    this._renderInventoryGrid();
    this._renderItemDetail();
  }

  // --- Equipment Slots (4 vertical boxes on left) ---

  _renderEquipment() {
    const state = Store.getState();
    const panelLeft = this._cx - PANEL_W / 2;
    const startX = panelLeft + 20;
    let y = this._cy - PANEL_H / 2 + 75;

    for (const slot of SLOT_LABELS) {
      const stackKey = state.equipped[slot];
      const item = stackKey ? getItem(stackKey) : null;
      const rarity = stackKey ? parseStackKey(stackKey).rarity : null;
      this._createEquipSlot(startX, y, slot, item, rarity);
      y += EQ_SLOT_H + EQ_SLOT_GAP;
    }
  }

  _createEquipSlot(x, y, slot, item, rarity) {
    const displayRarity = rarity || (item ? item.rarity : null);
    const rarityColor = displayRarity ? (RARITY_HEX[displayRarity] || 0xa1a1aa) : 0x333333;
    const borderWidth = item ? 2 : 1;

    const bg = this.scene.add.rectangle(
      x + EQ_SLOT_W / 2, y + EQ_SLOT_H / 2, EQ_SLOT_W, EQ_SLOT_H, 0x1a1a1a
    );
    bg.setStrokeStyle(borderWidth, rarityColor);
    bg.setInteractive({ useHandCursor: !!item });
    this._dynamicObjects.push(bg);

    const label = this.scene.add.text(x + 5, y + 4, SLOT_DISPLAY[slot], {
      fontFamily: 'monospace', fontSize: '9px', color: '#666666',
    });
    this._dynamicObjects.push(label);

    if (item) {
      const nameText = this.scene.add.text(
        x + EQ_SLOT_W / 2, y + EQ_SLOT_H / 2, item.name,
        {
          fontFamily: 'monospace', fontSize: '10px',
          color: COLORS.rarity[displayRarity] || '#a1a1aa',
          fontStyle: 'bold', align: 'center',
          wordWrap: { width: EQ_SLOT_W - 10 },
        }
      ).setOrigin(0.5);
      this._dynamicObjects.push(nameText);

      bg.on('pointerdown', () => InventorySystem.unequipItem(slot));
      bg.on('pointerover', () => bg.setStrokeStyle(3, 0xffffff));
      bg.on('pointerout', () => bg.setStrokeStyle(borderWidth, rarityColor));
    } else {
      const emptyText = this.scene.add.text(
        x + EQ_SLOT_W / 2, y + EQ_SLOT_H / 2 + 4, 'empty',
        { fontFamily: 'monospace', fontSize: '10px', color: '#444444' }
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
    const gridOriginX = panelLeft + 190;
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
    const detailX = panelLeft + 190;
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
        fontStyle: 'italic', wordWrap: { width: PANEL_W - 220 },
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

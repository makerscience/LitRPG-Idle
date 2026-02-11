// InventoryPanel — modal overlay for inventory and equipment.
// Toggle via BAG button or I key. Equipment slots on left, inventory grid on right.

import Phaser from 'phaser';
import { on, EVENTS } from '../events.js';
import { LAYOUT, COLORS } from '../config.js';
import { getItem } from '../data/items.js';
import Store from '../systems/Store.js';
import InventorySystem from '../systems/InventorySystem.js';

const PANEL_W = 700;
const PANEL_H = 450;
const SLOT_LABELS = ['head', 'body', 'weapon', 'legs'];
const SLOT_DISPLAY = { head: 'HEAD', body: 'BODY', weapon: 'WEAPON', legs: 'LEGS' };

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

// Rarity colors as hex numbers for Phaser graphics
const RARITY_HEX = {
  common:   0xa1a1aa,
  uncommon: 0x22c55e,
  rare:     0x3b82f6,
  epic:     0xa855f7,
};

export default class InventoryPanel {
  constructor(scene) {
    this.scene = scene;
    this._unsubs = [];
    this._isOpen = false;
    this._selectedItemId = null;

    // All modal objects stored here for bulk show/hide
    this._modalObjects = [];
    this._equipSlotObjects = [];
    this._invGridObjects = [];
    this._detailObjects = [];

    // Panel center
    this._cx = LAYOUT.gameArea.x + LAYOUT.gameArea.w / 2;
    this._cy = LAYOUT.gameArea.y + LAYOUT.gameArea.h / 2;

    this._createToggleButton();
    this._createModal();
    this._hideModal();

    // Keyboard toggle: I key
    this._iKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this._iKey.on('down', () => this._toggle());

    // Subscribe to events that require refresh
    this._unsubs.push(on(EVENTS.INV_ITEM_ADDED, () => this._refresh()));
    this._unsubs.push(on(EVENTS.INV_ITEM_EQUIPPED, () => this._refresh()));
    this._unsubs.push(on(EVENTS.INV_ITEM_SOLD, () => this._refresh()));
    this._unsubs.push(on(EVENTS.INV_FULL, () => this._refresh()));
    this._unsubs.push(on(EVENTS.SAVE_LOADED, () => this._refresh()));
  }

  _createToggleButton() {
    const bb = LAYOUT.bottomBar;
    const bx = bb.x + bb.w / 2 - 80;
    const by = bb.y + bb.h / 2;

    this._bagBtn = this.scene.add.text(bx, by, 'BAG [I]', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this._bagBtn.on('pointerdown', () => this._toggle());
    this._bagBtn.on('pointerover', () => this._bagBtn.setStyle({ backgroundColor: '#555555' }));
    this._bagBtn.on('pointerout', () => this._bagBtn.setStyle({ backgroundColor: '#333333' }));
  }

  _createModal() {
    // Backdrop — semi-transparent dark overlay over game area
    const ga = LAYOUT.gameArea;
    this._backdrop = this.scene.add.rectangle(
      ga.x + ga.w / 2, ga.y + ga.h / 2, ga.w, ga.h, 0x000000, 0.7
    );
    this._backdrop.setInteractive(); // blocks clicks through
    this._backdrop.on('pointerdown', (pointer) => {
      // Close if clicking outside the panel
      const px = pointer.x;
      const py = pointer.y;
      const left = this._cx - PANEL_W / 2;
      const right = this._cx + PANEL_W / 2;
      const top = this._cy - PANEL_H / 2;
      const bottom = this._cy + PANEL_H / 2;
      if (px < left || px > right || py < top || py > bottom) {
        this._close();
      }
    });
    this._modalObjects.push(this._backdrop);

    // Panel background
    this._panelBg = this.scene.add.rectangle(this._cx, this._cy, PANEL_W, PANEL_H, 0x1a1a2e);
    this._panelBg.setStrokeStyle(2, 0x444444);
    this._modalObjects.push(this._panelBg);

    // Title
    this._title = this.scene.add.text(this._cx, this._cy - PANEL_H / 2 + 20, 'INVENTORY', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this._modalObjects.push(this._title);

    // Close button — X in top-right corner
    const closeX = this._cx + PANEL_W / 2 - 20;
    const closeY = this._cy - PANEL_H / 2 + 20;
    this._closeBtn = this.scene.add.text(closeX, closeY, 'X', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ef4444',
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this._closeBtn.on('pointerdown', () => this._close());
    this._modalObjects.push(this._closeBtn);

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

  _toggle() {
    if (this._isOpen) {
      this._close();
    } else {
      this._open();
    }
  }

  _open() {
    // Mutual exclusion — close other panels if open
    if (this.scene.upgradePanel?._isOpen) {
      this.scene.upgradePanel._close();
    }
    if (this.scene.prestigePanel?._isOpen) {
      this.scene.prestigePanel._close();
    }
    if (this.scene.settingsPanel?._isOpen) {
      this.scene.settingsPanel._close();
    }
    this._isOpen = true;
    this._selectedItemId = null;
    this._showModal();
    this._refresh();
  }

  _close() {
    this._isOpen = false;
    this._selectedItemId = null;
    this._hideModal();
  }

  _showModal() {
    for (const obj of this._modalObjects) obj.setVisible(true);
  }

  _hideModal() {
    for (const obj of this._modalObjects) obj.setVisible(false);
    this._clearDynamic();
  }

  _clearDynamic() {
    for (const obj of this._equipSlotObjects) obj.destroy();
    this._equipSlotObjects = [];
    for (const obj of this._invGridObjects) obj.destroy();
    this._invGridObjects = [];
    for (const obj of this._detailObjects) obj.destroy();
    this._detailObjects = [];
  }

  _refresh() {
    if (!this._isOpen) return;
    this._clearDynamic();
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
      const equipped = state.equipped[slot];
      const item = equipped ? getItem(equipped) : null;

      this._createEquipSlot(startX, y, slot, item);
      y += EQ_SLOT_H + EQ_SLOT_GAP;
    }
  }

  _createEquipSlot(x, y, slot, item) {
    const rarityColor = item ? (RARITY_HEX[item.rarity] || 0xa1a1aa) : 0x333333;
    const borderWidth = item ? 2 : 1;

    // Box background
    const bg = this.scene.add.rectangle(
      x + EQ_SLOT_W / 2, y + EQ_SLOT_H / 2,
      EQ_SLOT_W, EQ_SLOT_H, 0x1a1a1a
    );
    bg.setStrokeStyle(borderWidth, rarityColor);
    bg.setInteractive({ useHandCursor: !!item });
    this._equipSlotObjects.push(bg);

    // Slot label (top-left)
    const label = this.scene.add.text(x + 5, y + 4, SLOT_DISPLAY[slot], {
      fontFamily: 'monospace', fontSize: '9px', color: '#666666',
    });
    this._equipSlotObjects.push(label);

    if (item) {
      // Item name centered
      const nameText = this.scene.add.text(
        x + EQ_SLOT_W / 2, y + EQ_SLOT_H / 2,
        item.name,
        {
          fontFamily: 'monospace', fontSize: '10px',
          color: COLORS.rarity[item.rarity] || '#a1a1aa',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: EQ_SLOT_W - 10 },
        }
      ).setOrigin(0.5);
      this._equipSlotObjects.push(nameText);

      // Click to unequip
      bg.on('pointerdown', () => {
        InventorySystem.unequipItem(slot);
      });
      bg.on('pointerover', () => bg.setStrokeStyle(3, 0xffffff));
      bg.on('pointerout', () => bg.setStrokeStyle(borderWidth, rarityColor));
    } else {
      // Empty label
      const emptyText = this.scene.add.text(
        x + EQ_SLOT_W / 2, y + EQ_SLOT_H / 2 + 4,
        'empty',
        { fontFamily: 'monospace', fontSize: '10px', color: '#444444' }
      ).setOrigin(0.5);
      this._equipSlotObjects.push(emptyText);
    }
  }

  // --- Inventory Grid (5x4 on right) ---

  _renderInventoryGrid() {
    const state = Store.getState();
    const stacks = state.inventoryStacks;
    const entries = Object.entries(stacks);

    // Grid origin — right of separator
    const panelLeft = this._cx - PANEL_W / 2;
    const gridOriginX = panelLeft + 190;
    const gridOriginY = this._cy - PANEL_H / 2 + 75;

    // Count label (top-right of inventory section)
    const countText = this.scene.add.text(
      this._cx + PANEL_W / 2 - 20, this._cy - PANEL_H / 2 + 50,
      `${entries.length}/20`,
      { fontFamily: 'monospace', fontSize: '11px', color: '#a1a1aa' }
    ).setOrigin(1, 0);
    this._invGridObjects.push(countText);

    // Render 20 slots in 5x4 grid
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const idx = row * GRID_COLS + col;
        const x = gridOriginX + col * SLOT_STEP;
        const y = gridOriginY + row * SLOT_STEP;

        if (idx < entries.length) {
          const [itemId, stack] = entries[idx];
          const item = getItem(itemId);
          if (item) {
            const isSelected = this._selectedItemId === itemId;
            this._createSlot(x, y, item, itemId, stack.count, isSelected);
          } else {
            this._createEmptySlot(x, y);
          }
        } else {
          this._createEmptySlot(x, y);
        }
      }
    }
  }

  _createSlot(x, y, item, itemId, count, isSelected) {
    const rarityColor = RARITY_HEX[item.rarity] || 0xa1a1aa;
    const borderWidth = isSelected ? 3 : 2;
    const borderColor = isSelected ? 0xffffff : rarityColor;

    // Slot background
    const bg = this.scene.add.rectangle(
      x + SLOT_SIZE / 2, y + SLOT_SIZE / 2,
      SLOT_SIZE, SLOT_SIZE, 0x1a1a1a
    );
    bg.setStrokeStyle(borderWidth, borderColor);
    bg.setInteractive({ useHandCursor: true });
    this._invGridObjects.push(bg);

    // Selected glow — subtle outer border
    if (isSelected) {
      const glow = this.scene.add.rectangle(
        x + SLOT_SIZE / 2, y + SLOT_SIZE / 2,
        SLOT_SIZE + 6, SLOT_SIZE + 6
      );
      glow.setStrokeStyle(1, rarityColor);
      glow.setFillStyle(0x000000, 0);
      this._invGridObjects.push(glow);
    }

    // Item name centered (small word-wrapped text)
    const nameText = this.scene.add.text(
      x + SLOT_SIZE / 2, y + SLOT_SIZE / 2 - (count > 1 ? 5 : 0),
      item.name,
      {
        fontFamily: 'monospace', fontSize: '9px',
        color: COLORS.rarity[item.rarity] || '#a1a1aa',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: SLOT_SIZE - 6 },
      }
    ).setOrigin(0.5);
    this._invGridObjects.push(nameText);

    // Count badge (bottom-right) if count > 1
    if (count > 1) {
      const badge = this.scene.add.text(
        x + SLOT_SIZE - 4, y + SLOT_SIZE - 4,
        `x${count}`,
        {
          fontFamily: 'monospace', fontSize: '10px',
          color: '#eab308', fontStyle: 'bold',
        }
      ).setOrigin(1, 1);
      this._invGridObjects.push(badge);
    }

    // Click interactions
    bg.on('pointerdown', (pointer) => {
      if (pointer.event.shiftKey) {
        InventorySystem.sellItem(itemId, count);
      } else if (this._selectedItemId === itemId) {
        InventorySystem.equipItem(itemId);
        this._selectedItemId = null;
      } else {
        this._selectedItemId = itemId;
        this._refresh();
      }
    });

    bg.on('pointerover', () => {
      if (!isSelected) bg.setStrokeStyle(2, 0xffffff);
    });
    bg.on('pointerout', () => {
      if (!isSelected) bg.setStrokeStyle(borderWidth, borderColor);
    });
  }

  _createEmptySlot(x, y) {
    const bg = this.scene.add.rectangle(
      x + SLOT_SIZE / 2, y + SLOT_SIZE / 2,
      SLOT_SIZE, SLOT_SIZE, 0x1a1a1a
    );
    bg.setStrokeStyle(1, 0x333333);
    this._invGridObjects.push(bg);
  }

  // --- Item Detail Panel (below grid) ---

  _renderItemDetail() {
    if (!this._selectedItemId) return;

    const item = getItem(this._selectedItemId);
    if (!item) return;

    const state = Store.getState();
    const stack = state.inventoryStacks[this._selectedItemId];
    if (!stack) {
      this._selectedItemId = null;
      return;
    }

    const panelLeft = this._cx - PANEL_W / 2;
    const detailX = panelLeft + 190;
    const detailY = this._cy + PANEL_H / 2 - 80;

    // Item name + rarity + slot + stat
    const rarityColor = COLORS.rarity[item.rarity] || '#a1a1aa';
    const statStr = item.statBonuses.atk > 0
      ? `+${item.statBonuses.atk} ATK`
      : `+${item.statBonuses.def} DEF`;

    const headerText = this.scene.add.text(
      detailX, detailY,
      `${item.name}  ${item.rarity} ${item.slot}  ${statStr}`,
      { fontFamily: 'monospace', fontSize: '11px', color: rarityColor }
    );
    this._detailObjects.push(headerText);

    // Description
    const descText = this.scene.add.text(
      detailX, detailY + 16,
      `"${item.description}"`,
      {
        fontFamily: 'monospace', fontSize: '10px', color: '#888888',
        fontStyle: 'italic',
        wordWrap: { width: PANEL_W - 220 },
      }
    );
    this._detailObjects.push(descText);

    // Action buttons row
    const btnY = detailY + 36;
    let btnX = detailX;

    // Sell 1 button
    const sell1 = this.scene.add.text(btnX, btnY, `Sell 1 (${item.sellValue}g)`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#eab308',
      backgroundColor: '#333333', padding: { x: 6, y: 3 },
    }).setInteractive({ useHandCursor: true });

    sell1.on('pointerdown', () => {
      InventorySystem.sellItem(this._selectedItemId, 1);
      const s = Store.getState().inventoryStacks[this._selectedItemId];
      if (!s) this._selectedItemId = null;
    });
    sell1.on('pointerover', () => sell1.setStyle({ backgroundColor: '#555555' }));
    sell1.on('pointerout', () => sell1.setStyle({ backgroundColor: '#333333' }));
    this._detailObjects.push(sell1);

    btnX += sell1.width + 8;

    // Sell all button (if more than 1)
    if (stack.count > 1) {
      const totalGold = item.sellValue * stack.count;
      const sellAll = this.scene.add.text(btnX, btnY, `Sell All x${stack.count} (${totalGold}g)`, {
        fontFamily: 'monospace', fontSize: '11px', color: '#eab308',
        backgroundColor: '#333333', padding: { x: 6, y: 3 },
      }).setInteractive({ useHandCursor: true });

      sellAll.on('pointerdown', () => {
        InventorySystem.sellItem(this._selectedItemId, stack.count);
        this._selectedItemId = null;
      });
      sellAll.on('pointerover', () => sellAll.setStyle({ backgroundColor: '#555555' }));
      sellAll.on('pointerout', () => sellAll.setStyle({ backgroundColor: '#333333' }));
      this._detailObjects.push(sellAll);

      btnX += sellAll.width + 8;
    }

    // Equip button
    const equipBtn = this.scene.add.text(btnX, btnY, `Equip`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#22c55e',
      backgroundColor: '#333333', padding: { x: 6, y: 3 },
    }).setInteractive({ useHandCursor: true });

    equipBtn.on('pointerdown', () => {
      InventorySystem.equipItem(this._selectedItemId);
      this._selectedItemId = null;
    });
    equipBtn.on('pointerover', () => equipBtn.setStyle({ backgroundColor: '#555555' }));
    equipBtn.on('pointerout', () => equipBtn.setStyle({ backgroundColor: '#333333' }));
    this._detailObjects.push(equipBtn);
  }

  destroy() {
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
    this._clearDynamic();
    for (const obj of this._modalObjects) obj.destroy();
    this._modalObjects = [];
    if (this._bagBtn) { this._bagBtn.destroy(); this._bagBtn = null; }
    if (this._iKey) { this._iKey.destroy(); this._iKey = null; }
  }
}

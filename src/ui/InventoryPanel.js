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
const SLOT_DISPLAY = { head: 'Head', body: 'Body', weapon: 'Weapon', legs: 'Legs' };

export default class InventoryPanel {
  constructor(scene) {
    this.scene = scene;
    this._unsubs = [];
    this._isOpen = false;
    this._selectedItemId = null;

    // All modal objects stored here for bulk show/hide
    this._modalObjects = [];
    this._equipSlotObjects = [];
    this._invListObjects = [];
    this._sellObjects = [];

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
    this._eqLabel = this.scene.add.text(eqX, eqY, '-- Equipment --', {
      fontFamily: 'monospace', fontSize: '13px', color: '#818cf8',
    });
    this._modalObjects.push(this._eqLabel);

    // Inventory section label
    const invX = this._cx - PANEL_W / 2 + 240;
    const invY = this._cy - PANEL_H / 2 + 50;
    this._invLabel = this.scene.add.text(invX, invY, '-- Inventory --', {
      fontFamily: 'monospace', fontSize: '13px', color: '#818cf8',
    });
    this._modalObjects.push(this._invLabel);

    // Separator line between equipment and inventory
    const sepX = this._cx - PANEL_W / 2 + 220;
    const sepY1 = this._cy - PANEL_H / 2 + 45;
    this._sepLine = this.scene.add.rectangle(sepX, this._cy, 1, PANEL_H - 30, 0x444444);
    this._modalObjects.push(this._sepLine);
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
    for (const obj of this._invListObjects) obj.destroy();
    this._invListObjects = [];
    for (const obj of this._sellObjects) obj.destroy();
    this._sellObjects = [];
  }

  _refresh() {
    if (!this._isOpen) return;
    this._clearDynamic();
    this._renderEquipment();
    this._renderInventory();
    this._renderSellButton();
  }

  _renderEquipment() {
    const state = Store.getState();
    const startX = this._cx - PANEL_W / 2 + 20;
    let y = this._cy - PANEL_H / 2 + 75;

    for (const slot of SLOT_LABELS) {
      const equipped = state.equipped[slot];
      const item = equipped ? getItem(equipped) : null;
      const label = SLOT_DISPLAY[slot];

      const displayText = item
        ? `${label}: ${item.name}`
        : `${label}: [Empty]`;

      const color = item ? (COLORS.rarity[item.rarity] || '#a1a1aa') : '#555555';

      const text = this.scene.add.text(startX, y, displayText, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color,
      }).setInteractive({ useHandCursor: !!item });

      if (item) {
        // Show stat bonus inline
        const statText = item.statBonuses.atk > 0
          ? ` [+${item.statBonuses.atk} ATK]`
          : ` [+${item.statBonuses.def} DEF]`;
        const statObj = this.scene.add.text(startX + text.width + 4, y, statText, {
          fontFamily: 'monospace', fontSize: '11px', color: '#a1a1aa',
        });
        this._equipSlotObjects.push(statObj);

        // Click to unequip
        text.on('pointerdown', () => {
          InventorySystem.unequipItem(slot);
        });
        text.on('pointerover', () => text.setStyle({ color: '#ffffff' }));
        text.on('pointerout', () => text.setStyle({ color }));
      }

      this._equipSlotObjects.push(text);
      y += 28;
    }
  }

  _renderInventory() {
    const state = Store.getState();
    const stacks = state.inventoryStacks;
    const entries = Object.entries(stacks);

    const startX = this._cx - PANEL_W / 2 + 240;
    let y = this._cy - PANEL_H / 2 + 75;
    const maxVisible = 14; // max items visible without scrolling

    // Count label
    const countText = this.scene.add.text(
      this._cx + PANEL_W / 2 - 20, this._cy - PANEL_H / 2 + 50,
      `${entries.length}/20`,
      { fontFamily: 'monospace', fontSize: '11px', color: '#a1a1aa' }
    ).setOrigin(1, 0);
    this._invListObjects.push(countText);

    for (let i = 0; i < Math.min(entries.length, maxVisible); i++) {
      const [itemId, stack] = entries[i];
      const item = getItem(itemId);
      if (!item) continue;

      const isSelected = this._selectedItemId === itemId;
      const rarityColor = COLORS.rarity[item.rarity] || '#a1a1aa';
      const displayColor = isSelected ? '#ffffff' : rarityColor;

      const name = stack.count > 1 ? `${item.name} x${stack.count}` : item.name;
      const prefix = isSelected ? '> ' : '  ';

      const text = this.scene.add.text(startX, y, `${prefix}${name}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: displayColor,
      }).setInteractive({ useHandCursor: true });

      text.on('pointerdown', (pointer) => {
        if (pointer.event.shiftKey) {
          // Shift+click to sell all
          InventorySystem.sellItem(itemId, stack.count);
        } else if (this._selectedItemId === itemId) {
          // Second click on selected item — equip it
          InventorySystem.equipItem(itemId);
          this._selectedItemId = null;
        } else {
          // First click — select it
          this._selectedItemId = itemId;
          this._refresh();
        }
      });

      text.on('pointerover', () => text.setStyle({ color: '#ffffff' }));
      text.on('pointerout', () => text.setStyle({ color: displayColor }));

      this._invListObjects.push(text);
      y += 24;
    }

    if (entries.length > maxVisible) {
      const moreText = this.scene.add.text(startX, y, `  ... and ${entries.length - maxVisible} more`, {
        fontFamily: 'monospace', fontSize: '11px', color: '#666666',
      });
      this._invListObjects.push(moreText);
    }
  }

  _renderSellButton() {
    if (!this._selectedItemId) return;

    const item = getItem(this._selectedItemId);
    if (!item) return;

    const state = Store.getState();
    const stack = state.inventoryStacks[this._selectedItemId];
    if (!stack) {
      this._selectedItemId = null;
      return;
    }

    const btnX = this._cx - PANEL_W / 2 + 240;
    const btnY = this._cy + PANEL_H / 2 - 60;

    // Item description
    const descText = this.scene.add.text(btnX, btnY - 30, item.description, {
      fontFamily: 'monospace', fontSize: '11px', color: '#888888',
      wordWrap: { width: PANEL_W - 280 },
    });
    this._sellObjects.push(descText);

    // Sell 1 button
    const sell1 = this.scene.add.text(btnX, btnY, `Sell 1 (${item.sellValue}g)`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#eab308',
      backgroundColor: '#333333', padding: { x: 8, y: 4 },
    }).setInteractive({ useHandCursor: true });

    sell1.on('pointerdown', () => {
      InventorySystem.sellItem(this._selectedItemId, 1);
      // If stack depleted, deselect
      const s = Store.getState().inventoryStacks[this._selectedItemId];
      if (!s) this._selectedItemId = null;
    });
    sell1.on('pointerover', () => sell1.setStyle({ backgroundColor: '#555555' }));
    sell1.on('pointerout', () => sell1.setStyle({ backgroundColor: '#333333' }));
    this._sellObjects.push(sell1);

    // Sell all button (if more than 1)
    if (stack.count > 1) {
      const totalGold = item.sellValue * stack.count;
      const sellAll = this.scene.add.text(btnX + sell1.width + 12, btnY, `Sell All x${stack.count} (${totalGold}g)`, {
        fontFamily: 'monospace', fontSize: '12px', color: '#eab308',
        backgroundColor: '#333333', padding: { x: 8, y: 4 },
      }).setInteractive({ useHandCursor: true });

      sellAll.on('pointerdown', () => {
        InventorySystem.sellItem(this._selectedItemId, stack.count);
        this._selectedItemId = null;
      });
      sellAll.on('pointerover', () => sellAll.setStyle({ backgroundColor: '#555555' }));
      sellAll.on('pointerout', () => sellAll.setStyle({ backgroundColor: '#333333' }));
      this._sellObjects.push(sellAll);
    }

    // Equip button
    const equipBtn = this.scene.add.text(btnX, btnY + 28, `Equip (${item.slot})`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#22c55e',
      backgroundColor: '#333333', padding: { x: 8, y: 4 },
    }).setInteractive({ useHandCursor: true });

    equipBtn.on('pointerdown', () => {
      InventorySystem.equipItem(this._selectedItemId);
      this._selectedItemId = null;
    });
    equipBtn.on('pointerover', () => equipBtn.setStyle({ backgroundColor: '#555555' }));
    equipBtn.on('pointerout', () => equipBtn.setStyle({ backgroundColor: '#333333' }));
    this._sellObjects.push(equipBtn);
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

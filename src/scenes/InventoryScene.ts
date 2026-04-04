import { Scene, GameObjects, Input } from 'phaser';
import type { IItemDef } from '../entities/types.js';
import type { InventorySystem } from '../systems/InventorySystem.js';

const SLOT_SIZE = 64;
const SLOT_GAP = 8;
const INVENTORY_HEIGHT = SLOT_SIZE + SLOT_GAP * 2 + 30;
const TOOLTIP_WIDTH = 280;
const TOOLTIP_PADDING = 12;

export class InventoryScene extends Scene {
  #inventorySystem!: InventorySystem;
  #slots: GameObjects.Container[] = [];
  #tooltip: GameObjects.Container | null = null;
  #tooltipText: GameObjects.Text | null = null;
  #tooltipBg: GameObjects.Graphics | null = null;
  #selectedSlot: number = -1;
  #combineMode = false;
  #combineSourceIdx = -1;
  #combineText: GameObjects.Text | null = null;

  constructor() {
    super({ key: 'inventory' });
  }

  init(data: { inventorySystem: InventorySystem }) {
    this.#inventorySystem = data.inventorySystem;
  }

  create() {
    this.#createInventoryBar();
    this.#renderSlots();

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.#combineMode) {
        this.#exitCombineMode();
      } else {
        this.scene.stop();
      }
    });

    this.input.keyboard?.on('keydown-I', () => {
      this.scene.stop();
    });
  }

  #createInventoryBar() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.85);
    bg.fillRect(0, height - INVENTORY_HEIGHT, width, INVENTORY_HEIGHT);
    bg.lineStyle(2, 0x4488ff, 0.5);
    bg.strokeRect(0, height - INVENTORY_HEIGHT, width, INVENTORY_HEIGHT);
    bg.setDepth(100);

    const title = this.add.text(width / 2, height - INVENTORY_HEIGHT + 4, 'INVENTORY', {
      font: 'bold 14px monospace',
      color: '#4488ff',
    }).setOrigin(0.5, 0).setDepth(101);

    this.#combineText = this.add.text(width - 20, height - INVENTORY_HEIGHT + 4, '', {
      font: 'bold 14px monospace',
      color: '#ffaa44',
    }).setOrigin(1, 0).setDepth(101);
  }

  #renderSlots() {
    const inventory = this.#inventorySystem.inventory;
    const startX = (this.cameras.main.width - (inventory.length * (SLOT_SIZE + SLOT_GAP))) / 2;
    const y = this.cameras.main.height - INVENTORY_HEIGHT + SLOT_GAP + 18;

    for (let i = 0; i < inventory.length; i++) {
      const itemId = inventory[i];
      if (!itemId) continue;
      const itemDef = this.#inventorySystem.getItemDef(itemId);
      if (!itemDef) continue;

      const x = startX + i * (SLOT_SIZE + SLOT_GAP);
      const slot = this.#createSlot(x, y, itemDef, i);
      this.#slots.push(slot);
    }
  }

  #createSlot(x: number, y: number, itemDef: IItemDef, index: number): GameObjects.Container {
    const container = this.add.container(x, y).setDepth(102);

    const bg = this.add.graphics();
    const isSelected = index === this.#selectedSlot;
    const borderColor = isSelected ? 0xffffff : 0x444466;
    const borderAlpha = isSelected ? 1 : 0.6;

    bg.lineStyle(2, borderColor, borderAlpha);
    bg.strokeRect(0, 0, SLOT_SIZE, SLOT_SIZE);

    if (isSelected) {
      bg.fillStyle(0x4488ff, 0.2);
      bg.fillRect(0, 0, SLOT_SIZE, SLOT_SIZE);
    }

    const iconX = SLOT_SIZE / 2;
    const iconY = SLOT_SIZE / 2;
    const color = parseInt(itemDef.iconColor.slice(1), 16) || 0x888888;

    bg.fillStyle(color, 0.8);
    bg.fillCircle(iconX, iconY, 16);

    bg.fillStyle(0xffffff, 0.3);
    bg.fillCircle(iconX - 3, iconY - 3, 6);

    container.add(bg);

    const nameText = this.add.text(iconX, SLOT_SIZE + 2, itemDef.name, {
      font: '9px monospace',
      color: '#aaccff',
    }).setOrigin(0.5, 0);
    container.add(nameText);

    container.setSize(SLOT_SIZE, SLOT_SIZE + 14);
    container.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, SLOT_SIZE, SLOT_SIZE),
      Phaser.Geom.Rectangle.Contains,
    );

    container.on('pointerover', () => {
      this.#showTooltip(itemDef);
      bg.clear();
      bg.lineStyle(2, 0xffffff, 1);
      bg.strokeRect(0, 0, SLOT_SIZE, SLOT_SIZE);
      bg.fillStyle(0x4488ff, 0.3);
      bg.fillRect(0, 0, SLOT_SIZE, SLOT_SIZE);
    });

    container.on('pointerout', () => {
      this.#hideTooltip();
      bg.clear();
      bg.lineStyle(2, borderColor, borderAlpha);
      bg.strokeRect(0, 0, SLOT_SIZE, SLOT_SIZE);
      if (isSelected) {
        bg.fillStyle(0x4488ff, 0.2);
        bg.fillRect(0, 0, SLOT_SIZE, SLOT_SIZE);
      }
    });

    container.on('pointerdown', (pointer: Input.Pointer) => {
      if (this.#combineMode) {
        if (this.#combineSourceIdx !== index) {
          this.#executeCombine(this.#combineSourceIdx, index);
        }
        return;
      }

      if (pointer.button === 0) {
        this.#selectSlot(index);
      } else if (pointer.button === 2) {
        this.#enterCombineMode(index);
      }
    });

    return container;
  }

  #selectSlot(index: number) {
    this.#selectedSlot = index;
    const inventory = this.#inventorySystem.inventory;
    const itemId = inventory[index] ?? null;
    this.#inventorySystem.selectedItem = itemId;

    for (const slot of this.#slots) {
      slot.destroy();
    }
    this.#slots = [];
    this.#renderSlots();

    if (itemId) {
      const itemDef = this.#inventorySystem.getItemDef(itemId);
      if (itemDef) {
        this.#showTooltip(itemDef);
      }
    }
  }

  #enterCombineMode(index: number) {
    this.#combineMode = true;
    this.#combineSourceIdx = index;
    this.#combineText?.setText('SELECT ITEM TO COMBINE');

    const inventory = this.#inventorySystem.inventory;
    const itemDef = this.#inventorySystem.getItemDef(inventory[index]!);
    if (itemDef) {
      this.#showTooltip(itemDef, `Right-click another item to combine with ${itemDef.name}`);
    }
  }

  #exitCombineMode() {
    this.#combineMode = false;
    this.#combineSourceIdx = -1;
    this.#combineText?.setText('');
    this.#hideTooltip();
  }

  #executeCombine(sourceIdx: number, targetIdx: number) {
    const inventory = this.#inventorySystem.inventory;
    const sourceId = inventory[sourceIdx];
    const targetId = inventory[targetIdx];

    if (!sourceId || !targetId) return;

    const result = this.#inventorySystem.combineItems(sourceId, targetId);

    if (result.success) {
      this.#showMessage(result.message, '#44ff44');
    } else {
      this.#showMessage(result.message, '#ff4444');
    }

    this.#exitCombineMode();
    for (const slot of this.#slots) {
      slot.destroy();
    }
    this.#slots = [];
    this.#renderSlots();
  }

  #showTooltip(itemDef: IItemDef, extra?: string) {
    this.#hideTooltip();

    const pointer = this.input.activePointer;
    let tx = pointer.x + 16;
    let ty = pointer.y - 10;

    if (tx + TOOLTIP_WIDTH > this.cameras.main.width) {
      tx = pointer.x - TOOLTIP_WIDTH - 16;
    }

    this.#tooltipBg = this.add.graphics().setDepth(200);
    this.#tooltipBg.fillStyle(0x0a0a2e, 0.95);
    this.#tooltipBg.fillRoundedRect(tx, ty, TOOLTIP_WIDTH, 80, 6);
    this.#tooltipBg.lineStyle(1, parseInt(itemDef.iconColor.slice(1), 16), 0.8);
    this.#tooltipBg.strokeRoundedRect(tx, ty, TOOLTIP_WIDTH, 80, 6);

    let desc = itemDef.description;
    if (extra) desc += `\n${extra}`;
    if (itemDef.usable) desc += '\n[Usable]';
    if (itemDef.combineWith) desc += `\n[Combine with: ${itemDef.combineWith}]`;

    this.#tooltipText = this.add.text(tx + TOOLTIP_PADDING, ty + 6, `${itemDef.name}\n\n${desc}`, {
      font: '12px monospace',
      color: '#cccccc',
      wordWrap: { width: TOOLTIP_WIDTH - TOOLTIP_PADDING * 2 },
    }).setDepth(201);

    const textHeight = this.#tooltipText.height + 12;
    this.#tooltipBg.clear();
    this.#tooltipBg.fillStyle(0x0a0a2e, 0.95);
    this.#tooltipBg.fillRoundedRect(tx, ty, TOOLTIP_WIDTH, textHeight, 6);
    this.#tooltipBg.lineStyle(1, parseInt(itemDef.iconColor.slice(1), 16), 0.8);
    this.#tooltipBg.strokeRoundedRect(tx, ty, TOOLTIP_WIDTH, textHeight, 6);

    this.#tooltip = this.add.container(tx, ty).setDepth(200);
    this.#tooltip.add(this.#tooltipBg);
    this.#tooltip.add(this.#tooltipText);
  }

  #hideTooltip() {
    this.#tooltip?.destroy();
    this.#tooltip = null;
    this.#tooltipText = null;
    this.#tooltipBg = null;
  }

  #showMessage(text: string, color: string) {
    const msg = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - INVENTORY_HEIGHT - 30, text, {
      font: 'bold 16px monospace',
      color,
      backgroundColor: '#000000aa',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5, 0).setDepth(150);

    this.tweens.add({
      targets: msg,
      alpha: 0,
      delay: 2000,
      duration: 500,
      onComplete: () => msg.destroy(),
    });
  }
}

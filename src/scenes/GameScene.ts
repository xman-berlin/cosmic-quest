import { Scene, GameObjects } from 'phaser';
import { RoomManager } from '../systems/RoomManager.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { Hotspot } from '../entities/Hotspot.js';
import { Player } from '../entities/Player.js';
import { BackgroundRenderer } from '../effects/BackgroundRenderer.js';
import type { IRoomsData, IItemsData } from '../entities/types.js';

import roomsJson from '../data/rooms.json' with { type: 'json' };
import itemsJson from '../data/items.json' with { type: 'json' };

export class GameScene extends Scene {
  #roomManager!: RoomManager;
  #inventorySystem!: InventorySystem;
  #player!: Player;
  #bgRenderer!: BackgroundRenderer;
  #hotspots: Hotspot[] = [];
  #roomNameText!: GameObjects.Text;
  #minimapText!: GameObjects.Text;
  #messageText!: GameObjects.Text;
  #isTransitioning = false;

  constructor() {
    super({ key: 'game' });
  }

  create() {
    const roomsData = roomsJson as IRoomsData;
    const itemsData = itemsJson as IItemsData;

    this.#roomManager = new RoomManager(roomsData);
    this.#inventorySystem = new InventorySystem(itemsData, this.#roomManager.saveData);
    this.#bgRenderer = new BackgroundRenderer(this);
    this.#player = new Player(this);

    this.#inventorySystem.onEvent = (_event, result) => {
      this.#showMessage(result.message, result.success ? '#44ff44' : '#ff4444');
    };

    this.#roomManager.onRoomChange = () => {
      this.#renderRoom();
    };

    this.#createMinimap();
    this.#createMessageArea();
    this.#createInventoryToggle();

    this.cameras.main.fadeIn(500);

    this.#roomManager.enterRoom('ship_bridge');
  }

  #renderRoom() {
    this.#clearRoom();

    const room = this.#roomManager.currentRoom;
    if (!room) return;

    this.#bgRenderer.drawGradient(room.theme.bgTop, room.theme.bgBottom);
    this.#bgRenderer.createParallaxLayers(room.parallaxLayers);

    const accentNum = parseInt(room.theme.accent.slice(1), 16);

    for (const exit of room.exits) {
      const hotspot = new Hotspot(
        this,
        exit.hotspot.x,
        exit.hotspot.y,
        exit,
        'exit',
        accentNum,
      );

      hotspot.on('pointerdown', () => {
        if (!this.#isTransitioning) {
          this.#navigateToRoom(exit.target);
        }
      });

      this.add.existing(hotspot);
      this.#hotspots.push(hotspot);
    }

    for (const hs of room.hotspots) {
      const hotspot = new Hotspot(
        this,
        hs.x,
        hs.y,
        hs,
        'interactive',
        accentNum,
      );

      hotspot.on('pointerdown', () => {
        this.#handleHotspotInteraction(room.id, hs);
      });

      this.add.existing(hotspot);
      this.#hotspots.push(hotspot);
    }

    const roomState = this.#roomManager.getRoomState(room.id);
    const collectedItems = roomState?.itemsCollected ?? [];

    for (const pickup of room.items) {
      if (collectedItems.includes(pickup.id)) continue;

      const hotspot = new Hotspot(
        this,
        pickup.x,
        pickup.y,
        pickup,
        'pickup',
        0x44ffaa,
      );

      hotspot.on('pointerdown', () => {
        this.#handleItemPickup(room.id, pickup);
      });

      this.add.existing(hotspot);
      this.#hotspots.push(hotspot);
    }

    this.#roomNameText = this.add.text(960, 40, room.name, {
      font: 'bold 28px monospace',
      color: room.theme.accent,
      shadow: { offsetX: 0, offsetY: 0, blur: 10, color: room.theme.accent, fill: true },
    }).setOrigin(0.5, 0);

    this.#updateMinimap();
  }

  #handleHotspotInteraction(roomId: string, hs: { id: string; label: string; action: string }) {
    const selectedItem = this.#inventorySystem.selectedItem;

    if (selectedItem) {
      const result = this.#inventorySystem.useItemOn(selectedItem, hs.id);
      if (result.success) {
        this.#showMessage(result.message, '#44ff44');
        return;
      }
    }

    const hotspot = this.#hotspots.find((h) => h.hotspotType === 'interactive');
    hotspot?.activate();
    this.#roomManager.activateHotspot(roomId, hs.id);
    this.#showMessage(`You examine the ${hs.label}...`, '#aaccff');
  }

  #handleItemPickup(roomId: string, pickup: { id: string; itemId: string; label: string }) {
    const result = this.#inventorySystem.addItem(pickup.itemId);

    if (result.success) {
      const roomState = this.#roomManager.getRoomState(roomId);
      if (roomState && !roomState.itemsCollected.includes(pickup.id)) {
        roomState.itemsCollected.push(pickup.id);
      }
      this.#showMessage(result.message, '#44ffaa');
      this.#renderRoom();
    } else {
      this.#showMessage(result.message, '#ff4444');
    }
  }

  #clearRoom() {
    for (const hs of this.#hotspots) {
      hs.destroy();
    }
    this.#hotspots = [];
    this.#bgRenderer.destroy();
    this.#bgRenderer = new BackgroundRenderer(this);
    this.#roomNameText?.destroy();
  }

  #navigateToRoom(targetId: string) {
    this.#isTransitioning = true;

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.#roomManager.navigateTo(targetId);
      this.cameras.main.fadeIn(500);
      this.cameras.main.once('camerafadeincomplete', () => {
        this.#isTransitioning = false;
      });
    });
  }

  #showMessage(text: string, color: string) {
    this.#messageText?.destroy();
    this.#messageText = this.add.text(960, 1000, text, {
      font: '20px monospace',
      color,
      backgroundColor: '#00000088',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5, 0);

    this.tweens.add({
      targets: this.#messageText,
      alpha: 0,
      delay: 2500,
      duration: 500,
      onComplete: () => {
        if (this.#messageText) {
          this.#messageText.destroy();
          this.#messageText = undefined as unknown as GameObjects.Text;
        }
      },
    });
  }

  #createMinimap() {
    this.#minimapText = this.add.text(20, 20, '', {
      font: '14px monospace',
      color: '#888888',
      backgroundColor: '#000000aa',
      padding: { x: 10, y: 8 },
    }).setScrollFactor(0);
  }

  #updateMinimap() {
    const allRooms = this.#roomManager.getAllRooms();
    const visited = this.#roomManager.visitedRooms;
    const current = this.#roomManager.currentRoom;

    let text = 'ROOMS\n';
    text += '─'.repeat(20) + '\n';

    for (const room of allRooms) {
      const isCurrent = current?.id === room.id;
      const isVisited = visited.has(room.id);

      if (isCurrent) {
        text += `▶ ${room.name}\n`;
      } else if (isVisited) {
        text += `  ${room.name} [visit]\n`;
      } else {
        text += `  ???\n`;
      }
    }

    this.#minimapText.setText(text);

    this.#minimapText.removeAllListeners('pointerdown');

    for (const room of allRooms) {
      if (visited.has(room.id) && current?.id !== room.id) {
        this.#minimapText.setInteractive(
          new Phaser.Geom.Rectangle(
            20,
            20 + (allRooms.indexOf(room) + 2) * 18,
            180,
            18,
          ),
          Phaser.Geom.Rectangle.Contains,
        );

        this.#minimapText.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          const lineIndex = Math.floor((pointer.y - 20) / 18) - 2;
          if (lineIndex >= 0 && lineIndex < allRooms.length) {
            const target = allRooms[lineIndex];
            if (target && visited.has(target.id)) {
              this.#navigateToRoom(target.id);
            }
          }
        });
      }
    }
  }

  #createMessageArea() {
    this.#messageText = this.add.text(960, 1000, '', {
      font: '20px monospace',
      color: '#ffffff',
    }).setOrigin(0.5, 0).setVisible(false);
  }

  #createInventoryToggle() {
    const toggleBtn = this.add.text(this.cameras.main.width - 20, 20, '[I]', {
      font: 'bold 16px monospace',
      color: '#4488ff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setScrollFactor(0);

    toggleBtn.on('pointerdown', () => {
      if (!this.#isTransitioning) {
        this.scene.launch('inventory', { inventorySystem: this.#inventorySystem });
      }
    });

    toggleBtn.on('pointerover', () => {
      toggleBtn.setStyle({ backgroundColor: '#2244aa' });
    });

    toggleBtn.on('pointerout', () => {
      toggleBtn.setStyle({ backgroundColor: '#000000aa' });
    });

    this.input.keyboard?.on('keydown-I', () => {
      if (!this.#isTransitioning) {
        this.scene.launch('inventory', { inventorySystem: this.#inventorySystem });
      }
    });

    this.input.keyboard?.on('keydown-Q', () => {
      const selectedItem = this.#inventorySystem.selectedItem;
      if (selectedItem) {
        const result = this.#inventorySystem.removeItem(selectedItem);
        this.#showMessage(result.message, result.success ? '#ffaa44' : '#ff4444');
      } else {
        this.#showMessage('No item selected to drop', '#ff4444');
      }
    });

    this.input.keyboard?.on('keydown-ONE', () => {
      this.#player.setMode('look');
    });

    this.input.keyboard?.on('keydown-TWO', () => {
      this.#player.setMode('use');
    });

    this.input.keyboard?.on('keydown-THREE', () => {
      this.#player.setMode('talk');
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.#player.setMode('default');
    });
  }

  update(_time: number, _delta: number) {
    // Game loop — handled by room manager and hotspots
  }
}

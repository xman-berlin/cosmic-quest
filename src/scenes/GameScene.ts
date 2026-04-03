import { Scene, GameObjects } from 'phaser';
import { RoomManager } from '../systems/RoomManager.js';
import { Hotspot } from '../entities/Hotspot.js';
import { Player } from '../entities/Player.js';
import { BackgroundRenderer } from '../effects/BackgroundRenderer.js';
import type { IRoomsData } from '../entities/types.js';

import roomsJson from '../data/rooms.json' with { type: 'json' };

export class GameScene extends Scene {
  #roomManager!: RoomManager;
  #player!: Player;
  #bgRenderer!: BackgroundRenderer;
  #hotspots: Hotspot[] = [];
  #roomNameText!: GameObjects.Text;
  #minimapText!: GameObjects.Text;
  #isTransitioning = false;

  constructor() {
    super({ key: 'game' });
  }

  create() {
    const roomsData = roomsJson as IRoomsData;
    this.#roomManager = new RoomManager(roomsData);
    this.#bgRenderer = new BackgroundRenderer(this);
    this.#player = new Player(this);

    this.#roomManager.onRoomChange = () => {
      this.#renderRoom();
    };

    this.#createMinimap();

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
        hotspot.activate();
        this.#roomManager.activateHotspot(room.id, hs.id);
        this.#showInteractionMessage(hs.label, hs.action);
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

  #showInteractionMessage(label: string, _action: string) {
    const msg = this.add.text(960, 1000, `You examine the ${label}...`, {
      font: '20px monospace',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5, 0);

    this.tweens.add({
      targets: msg,
      alpha: 0,
      delay: 2000,
      duration: 500,
      onComplete: () => msg.destroy(),
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
        const targetId = room.id;
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

  update(_time: number, _delta: number) {
    // Game loop — handled by room manager and hotspots
  }
}

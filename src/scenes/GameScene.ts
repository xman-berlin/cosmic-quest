import { Scene, GameObjects } from 'phaser';
import { RoomManager } from '../systems/RoomManager.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { PuzzleEngine } from '../systems/PuzzleEngine.js';
import { DialogSystem } from '../systems/DialogSystem.js';
import { AudioManager } from '../systems/AudioManager.js';
import { Hotspot } from '../entities/Hotspot.js';
import { Player } from '../entities/Player.js';
import { BackgroundRenderer } from '../effects/BackgroundRenderer.js';
import { ParticleEffects } from '../effects/ParticleEffects.js';
import { Lighting } from '../effects/Lighting.js';
import { PostProcessing } from '../effects/PostProcessing.js';
import type { IRoomsData, IItemsData, IPuzzlesData, IDialogsData } from '../entities/types.js';

import roomsJson from '../data/rooms.json' with { type: 'json' };
import itemsJson from '../data/items.json' with { type: 'json' };
import puzzlesJson from '../data/puzzles.json' with { type: 'json' };
import dialogsJson from '../data/dialogs.json' with { type: 'json' };

const DIALOG_TREE_MAP: Record<string, string> = {
  captain_chair: 'captain_dialog',
  engineering_console: 'engineer_dialog',
  observation_window: 'science_officer_dialog',
};

export class GameScene extends Scene {
  #roomManager!: RoomManager;
  #inventorySystem!: InventorySystem;
  #puzzleEngine!: PuzzleEngine;
  #dialogSystem!: DialogSystem;
  #audioManager!: AudioManager;
  #player!: Player;
  #bgRenderer!: BackgroundRenderer;
  #particles!: ParticleEffects;
  #lighting!: Lighting;
  #postProcessing!: PostProcessing;
  #hotspots: Hotspot[] = [];
  #roomNameText!: GameObjects.Text;
  #minimapText!: GameObjects.Text;
  #messageText!: GameObjects.Text;
  #puzzleStatusText!: GameObjects.Text;
  #isTransitioning = false;

  constructor() {
    super({ key: 'game' });
  }

  create() {
    const roomsData = roomsJson as IRoomsData;
    const itemsData = itemsJson as IItemsData;
    const puzzlesData = puzzlesJson as IPuzzlesData;
    const dialogsData = dialogsJson as IDialogsData;

    this.#roomManager = new RoomManager(roomsData);
    this.#inventorySystem = new InventorySystem(itemsData, this.#roomManager.saveData);
    this.#puzzleEngine = new PuzzleEngine(puzzlesData, this.#roomManager.saveData);
    this.#dialogSystem = new DialogSystem(dialogsData, this.#roomManager.saveData);
    this.#dialogSystem.setInventorySystem(this.#inventorySystem);
    this.#audioManager = new AudioManager();
    this.#bgRenderer = new BackgroundRenderer(this);
    this.#particles = new ParticleEffects(this);
    this.#lighting = new Lighting(this);
    this.#postProcessing = new PostProcessing(this);
    this.#player = new Player(this);

    this.#inventorySystem.onEvent = (event, result) => {
      this.#showMessage(result.message, result.success ? '#44ff44' : '#ff4444');
      if (event === 'itemAdded' && result.success) {
        this.#particles.createSparkle(960, 540, 0x44ffaa, 25);
        this.#audioManager.playSfx('pickup');
      }
    };

    this.#puzzleEngine.onEvent = (event, result) => {
      this.#showMessage(result.message, result.success ? '#44ff44' : '#ff4444');
      if (event === 'puzzleCompleted' && result.success) {
        this.#particles.createExplosion(960, 540, 0xffaa44, 50);
        this.#postProcessing.screenShake(0.008, 400);
        this.#postProcessing.flashScreen(0x44ff44, 300);
        this.#audioManager.playSfx('success');
      } else if (event === 'stepCompleted') {
        this.#audioManager.playSfx('puzzle');
      }
    };

    this.#roomManager.onRoomChange = () => {
      this.#renderRoom();
    };

    this.#createMinimap();
    this.#createMessageArea();
    this.#createInventoryToggle();
    this.#createPuzzleStatusText();

    this.cameras.main.fadeIn(500);

    this.#roomManager.enterRoom('ship_bridge');
  }

  #renderRoom() {
    this.#clearRoom();

    const room = this.#roomManager.currentRoom;
    if (!room) return;

    this.#bgRenderer.drawGradient(room.theme.bgTop, room.theme.bgBottom);
    this.#bgRenderer.createParallaxLayers(room.parallaxLayers);

    this.#particles.createAmbientParticles(0, 0, 1920, 1080, parseInt(room.theme.accent.slice(1), 16) || 0x8888ff, 25);

    const accentNum = parseInt(room.theme.accent.slice(1), 16);

    this.#setupRoomLighting(room);
    this.#setupPostProcessing(room);

    this.#audioManager.fadeAmbientTo(room.id, 800);

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
          this.#audioManager.playSfx('click');
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
        this.#audioManager.playSfx('click');
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
    this.#updatePuzzleStatus();
  }

  #handleHotspotInteraction(roomId: string, hs: { id: string; label: string; action: string }) {
    const selectedItem = this.#inventorySystem.selectedItem;

    const puzzles = this.#puzzleEngine.getPuzzlesForHotspot(hs.id);
    if (puzzles.length > 0) {
      const puzzle = puzzles[0]!;
      const result = this.#puzzleEngine.activatePuzzle(puzzle.id);
      if (result.success) {
        if (selectedItem) {
          const useResult = this.#puzzleEngine.submitItemUse(selectedItem, hs.id);
          if (useResult.success) {
            this.#showMessage(useResult.message, '#44ff44');
            this.#updatePuzzleStatus();
            return;
          }
        }
        this.scene.launch('puzzle', { puzzleEngine: this.#puzzleEngine, puzzleId: puzzle.id });
        return;
      }
    }

    if (selectedItem) {
      const result = this.#inventorySystem.useItemOn(selectedItem, hs.id);
      if (result.success) {
        this.#showMessage(result.message, '#44ff44');
        return;
      }
    }

    const treeId = DIALOG_TREE_MAP[hs.id];
    if (treeId && this.#player.mode === 'talk') {
      this.scene.launch('dialog', { dialogSystem: this.#dialogSystem, treeId });
      return;
    }

    const hotspot = this.#hotspots.find((h) => h.hotspotType === 'interactive');
    hotspot?.activate();
    this.#roomManager.activateHotspot(roomId, hs.id);
    this.#showMessage(`You examine the ${hs.label}...`, '#aaccff');
  }

  #handleItemPickup(roomId: string, pickup: { id: string; itemId: string; label: string; x: number; y: number }) {
    const result = this.#inventorySystem.addItem(pickup.itemId);

    if (result.success) {
      const roomState = this.#roomManager.getRoomState(roomId);
      if (roomState && !roomState.itemsCollected.includes(pickup.id)) {
        roomState.itemsCollected.push(pickup.id);
      }
      this.#particles.createSparkle(pickup.x, pickup.y, 0x44ffaa, 30);
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
    this.#particles.destroy();
    this.#lighting.destroy();
    this.#postProcessing.destroy();
    this.#particles = new ParticleEffects(this);
    this.#lighting = new Lighting(this);
    this.#postProcessing = new PostProcessing(this);
  }

  #setupRoomLighting(room: { id: string; theme: { accent: string }; hotspots: { x: number; y: number; id: string }[] }): void {
    const color = parseInt(room.theme.accent.slice(1), 16);

    this.#lighting.addLight('ambient', {
      x: 960,
      y: 540,
      radius: 600,
      color,
      intensity: 0.15,
      flicker: true,
      flickerSpeed: 300,
      flickerIntensity: 0.05,
    });

    for (const hs of room.hotspots) {
      this.#lighting.addLight(`hotspot_${hs.id}`, {
        x: hs.x,
        y: hs.y,
        radius: 80,
        color,
        intensity: 0.1,
        flicker: true,
        flickerSpeed: 500,
        flickerIntensity: 0.03,
      });
    }

    if (room.id === 'engine_room') {
      this.#particles.createEngineGlow(960, 550);
    }
  }

  #setupPostProcessing(room: { theme: { accent: string } }): void {
    this.#postProcessing.enableVignette(0.4);
    this.#postProcessing.setColorGrade(room.theme.accent, 0.05);
  }

  #navigateToRoom(targetId: string) {
    this.#isTransitioning = true;
    this.#audioManager.playSfx('transition');

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

  #createPuzzleStatusText() {
    this.#puzzleStatusText = this.add.text(this.cameras.main.width - 20, 60, '', {
      font: '12px monospace',
      color: '#ffaa44',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
    }).setOrigin(1, 0).setScrollFactor(0);
  }

  #updatePuzzleStatus() {
    const active = this.#puzzleEngine.getActivePuzzle();
    if (!active) {
      this.#puzzleStatusText.setText('');
      return;
    }
    const progress = this.#puzzleEngine.getActivePuzzleProgress();
    this.#puzzleStatusText.setText(`PUZZLE: ${active.title} (${progress.current}/${progress.total})`);
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
        this.#audioManager.playSfx('click');
        this.scene.launch('inventory', { inventorySystem: this.#inventorySystem });
      }
    });

    toggleBtn.on('pointerover', () => {
      toggleBtn.setStyle({ backgroundColor: '#2244aa' });
      this.#audioManager.playSfx('hover');
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
      this.#puzzleEngine.resetActivePuzzle();
      this.#updatePuzzleStatus();
    });
  }

  update(_time: number, _delta: number) {
    // Game loop — handled by room manager and hotspots
  }
}

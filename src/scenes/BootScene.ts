import { Scene, GameObjects } from 'phaser';

const LOADING_TIPS = [
  'Tip: Press I to open your inventory at any time.',
  'Tip: Select an item in your inventory, then click a hotspot to use it.',
  'Tip: Right-click an item in the inventory to enter combine mode.',
  'Tip: Press 3 to switch to TALK mode, then click NPC hotspots to converse.',
  'Tip: Press V to open the audio settings panel.',
  'Tip: Press Q to drop your currently selected item.',
  'Tip: Explore all 5 rooms: Bridge, Corridor, Engine Room, Quarters, and Observation Deck.',
  'Tip: Combine Ration Pack + Water Filter to create a Survival Kit.',
  'Tip: Talk to Engineer Chen for hints about the warp core repair sequence.',
  'Tip: The wall panel in the corridor has a hidden security code.',
  'Tip: Use the telescope on the Observation Deck to find coordinates.',
  'Tip: Complete all 10 puzzles to send a distress signal and finish the game.',
];

export class BootScene extends Scene {
  #progressBar!: GameObjects.Graphics;
  #progressBox!: GameObjects.Graphics;
  #loadingText!: GameObjects.Text;
  #percentText!: GameObjects.Text;
  #tipText!: GameObjects.Text;
  #tipIndex = 0;
  #tipTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'boot' });
  }

  preload() {
    this.#createLoadingUI();
    this.#showRandomTip();

    this.load.on('progress', (value: number) => {
      this.#percentText.setText(`${Math.round(value * 100)}%`);
      this.#drawProgress(value);
    });

    this.load.on('complete', () => {
      this.#tipTimer?.destroy();
      this.scene.start('menu');
    });

    this.#loadAssets();
  }

  #createLoadingUI() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.#createStarfield();

    this.#loadingText = this.add.text(width / 2, height / 2 - 80, 'Loading Cosmic Quest...', {
      font: 'bold 32px monospace',
      color: '#4488ff',
      shadow: { offsetX: 0, offsetY: 0, blur: 15, color: '#2244aa', fill: true },
    }).setOrigin(0.5);

    this.#progressBox = this.add.graphics();
    this.#progressBox.fillStyle(0x111133, 0.8);
    this.#progressBox.fillRoundedRect(width / 2 - 250, height / 2 - 20, 500, 40, 8);
    this.#progressBox.lineStyle(2, 0x4488ff, 0.5);
    this.#progressBox.strokeRoundedRect(width / 2 - 250, height / 2 - 20, 500, 40, 8);

    this.#progressBar = this.add.graphics();

    this.#percentText = this.add.text(width / 2, height / 2 + 40, '0%', {
      font: 'bold 20px monospace',
      color: '#aaccff',
    }).setOrigin(0.5);

    this.#tipText = this.add.text(width / 2, height / 2 + 100, '', {
      font: '16px monospace',
      color: '#888888',
      wordWrap: { width: 600 },
    }).setOrigin(0.5);
  }

  #createStarfield() {
    const stars = this.add.graphics();
    for (let i = 0; i < 200; i++) {
      const x = Phaser.Math.Between(0, this.cameras.main.width);
      const y = Phaser.Math.Between(0, this.cameras.main.height);
      const size = Phaser.Math.FloatBetween(0.5, 2);
      const alpha = Phaser.Math.FloatBetween(0.3, 1);
      stars.fillStyle(0xffffff, alpha);
      stars.fillCircle(x, y, size);
    }
  }

  #drawProgress(value: number) {
    this.#progressBar.clear();
    this.#progressBar.fillStyle(0x4488ff, 1);
    this.#progressBar.fillRoundedRect(
      this.cameras.main.width / 2 - 248,
      this.cameras.main.height / 2 - 18,
      496 * value,
      36,
      6,
    );
  }

  #showRandomTip() {
    this.#tipText.setText(LOADING_TIPS[this.#tipIndex]!);
    this.#tipIndex = (this.#tipIndex + 1) % LOADING_TIPS.length;

    this.#tipTimer = this.time.delayedCall(4000, () => {
      this.#showRandomTip();
    });
  }

  #loadAssets() {
    // No external assets yet — all visuals are procedural
  }
}

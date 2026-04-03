import { Scene, GameObjects } from 'phaser';

export class BootScene extends Scene {
  #progressBar!: GameObjects.Graphics;
  #progressBox!: GameObjects.Graphics;
  #loadingText!: GameObjects.Text;
  #percentText!: GameObjects.Text;

  constructor() {
    super({ key: 'boot' });
  }

  preload() {
    this.#createLoadingUI();

    this.load.on('progress', (value: number) => {
      this.#percentText.setText(`${Math.round(value * 100)}%`);
      this.#drawProgress(value);
    });

    this.load.on('complete', () => {
      this.#progressBar.destroy();
      this.#progressBox.destroy();
      this.scene.start('menu');
    });

    this.#loadAssets();
  }

  #createLoadingUI() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.#loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading Cosmic Quest...', {
      font: '32px monospace',
      color: '#aaccff',
    }).setOrigin(0.5);

    this.#progressBox = this.add.graphics();
    this.#progressBox.fillStyle(0x222244, 0.8);
    this.#progressBox.fillRect(width / 2 - 250, height / 2, 500, 40);

    this.#progressBar = this.add.graphics();

    this.#percentText = this.add.text(width / 2, height / 2 + 60, '0%', {
      font: '24px monospace',
      color: '#aaccff',
    }).setOrigin(0.5);
  }

  #drawProgress(value: number) {
    this.#progressBar.clear();
    this.#progressBar.fillStyle(0x4488ff, 1);
    this.#progressBar.fillRect(
      this.cameras.main.width / 2 - 248,
      this.cameras.main.height / 2 + 2,
      496 * value,
      36,
    );
  }

  #loadAssets() {
    // Placeholder: no real assets yet, but structure is ready
    // this.load.image('stars_far', 'assets/backgrounds/stars_far.png');
    // this.load.image('stars_near', 'assets/backgrounds/stars_near.png');
    // this.load.audio('ambient_spaceship', 'audio/ambient/spaceship.mp3');
  }
}

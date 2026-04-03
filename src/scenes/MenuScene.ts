import { Scene, GameObjects } from 'phaser';

export class MenuScene extends Scene {
  #titleText!: GameObjects.Text;
  #startButton!: GameObjects.Text;
  #subtitleText!: GameObjects.Text;

  constructor() {
    super({ key: 'menu' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.#createStarfield();

    this.#titleText = this.add.text(width / 2, height / 2 - 120, 'COSMIC QUEST', {
      font: 'bold 72px monospace',
      color: '#4488ff',
      shadow: { offsetX: 0, offsetY: 0, blur: 20, color: '#2244aa', fill: true },
    }).setOrigin(0.5);

    this.#subtitleText = this.add.text(width / 2, height / 2 - 40, 'A Space Adventure', {
      font: '28px monospace',
      color: '#aaccff',
    }).setOrigin(0.5);

    this.#startButton = this.add.text(width / 2, height / 2 + 80, '[ START GAME ]', {
      font: 'bold 36px monospace',
      color: '#ffffff',
      backgroundColor: '#2244aa',
      padding: { x: 30, y: 15 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.#startButton.on('pointerover', () => {
      this.#startButton.setStyle({ backgroundColor: '#3366cc' });
    });

    this.#startButton.on('pointerout', () => {
      this.#startButton.setStyle({ backgroundColor: '#2244aa' });
    });

    this.#startButton.on('pointerdown', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('game');
      });
    });

    this.#animateTitle();
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

  #animateTitle() {
    this.tweens.add({
      targets: this.#titleText,
      alpha: 0.7,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.add({
      targets: this.#startButton,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}

import { Scene, GameObjects } from 'phaser';

export class CreditsScene extends Scene {
  #stats: { puzzlesSolved: number; itemsCollected: number; timePlayed: number } = {
    puzzlesSolved: 0,
    itemsCollected: 0,
    timePlayed: 0,
  };

  constructor() {
    super({ key: 'credits' });
  }

  init(data: { puzzlesSolved: number; itemsCollected: number; timePlayed: number }) {
    this.#stats = data;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.cameras.main.fadeIn(1000);

    this.#createStarfield();

    const title = this.add.text(width / 2, 100, 'MISSION COMPLETE', {
      font: 'bold 48px monospace',
      color: '#44ff44',
      shadow: { offsetX: 0, offsetY: 0, blur: 20, color: '#22aa22', fill: true },
    }).setOrigin(0.5, 0);

    this.tweens.add({
      targets: title,
      alpha: 0.7,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const subtitle = this.add.text(width / 2, 180, 'The distress signal has been sent. Help is on the way.', {
      font: '20px monospace',
      color: '#aaccff',
    }).setOrigin(0.5, 0);

    const statsY = 260;
    const stats = [
      { label: 'Puzzles Solved', value: `${this.#stats.puzzlesSolved}` },
      { label: 'Items Collected', value: `${this.#stats.itemsCollected}` },
      { label: 'Time Played', value: `${this.#stats.timePlayed} minutes` },
    ];

    stats.forEach((stat, i) => {
      const y = statsY + i * 40;

      const label = this.add.text(width / 2 - 100, y, stat.label, {
        font: '16px monospace',
        color: '#888888',
      }).setOrigin(0, 0);

      const value = this.add.text(width / 2 + 100, y, stat.value, {
        font: 'bold 16px monospace',
        color: '#4488ff',
      }).setOrigin(0, 0);
    });

    const creditsY = statsY + stats.length * 40 + 60;
    const credits = [
      'COSMIC QUEST',
      '',
      'A Space Adventure',
      '',
      'Built with Phaser 3 + TypeScript + Vite',
      '',
      'Thank you for playing!',
    ];

    credits.forEach((line, i) => {
      const y = creditsY + i * 25;
      const color = i === 0 ? '#4488ff' : '#666666';
      const size = i === 0 ? 'bold 24px' : '14px';

      this.add.text(width / 2, y, line, {
        font: `${size} monospace`,
        color,
      }).setOrigin(0.5, 0);
    });

    const restartBtn = this.add.text(width / 2, height - 100, '[ PLAY AGAIN ]', {
      font: 'bold 24px monospace',
      color: '#ffffff',
      backgroundColor: '#2244aa',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerover', () => {
      restartBtn.setStyle({ backgroundColor: '#3366cc' });
    });

    restartBtn.on('pointerout', () => {
      restartBtn.setStyle({ backgroundColor: '#2244aa' });
    });

    restartBtn.on('pointerdown', () => {
      localStorage.removeItem('cosmic_quest_save_1');
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('menu');
      });
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('menu');
      });
    });
  }

  #createStarfield() {
    const stars = this.add.graphics();
    for (let i = 0; i < 300; i++) {
      const x = Phaser.Math.Between(0, this.cameras.main.width);
      const y = Phaser.Math.Between(0, this.cameras.main.height);
      const size = Phaser.Math.FloatBetween(0.5, 2.5);
      const alpha = Phaser.Math.FloatBetween(0.3, 1);
      stars.fillStyle(0xffffff, alpha);
      stars.fillCircle(x, y, size);
    }
  }
}

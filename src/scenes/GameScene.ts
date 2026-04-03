import { Scene } from 'phaser';

export class GameScene extends Scene {
  constructor() {
    super({ key: 'game' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.text(width / 2, height / 2, 'Game Scene — Room System Coming Soon', {
      font: '24px monospace',
      color: '#aaccff',
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(500);
  }

  update(_time: number, _delta: number) {
    // Game loop — room updates, input handling, etc.
  }
}

import { GameObjects, Scene } from 'phaser';

export class Player {
  #scene: Scene;
  #cursor: GameObjects.Graphics;
  #glow: GameObjects.Graphics;
  #visible = true;

  constructor(scene: Scene) {
    this.#scene = scene;

    this.#cursor = scene.add.graphics();
    this.#drawCursor(0xffffff);

    this.#glow = scene.add.graphics();
    this.#glow.setAlpha(0.3);
    this.#drawGlow(0x4488ff);

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.#visible) {
        this.#cursor.setPosition(pointer.x, pointer.y);
        this.#glow.setPosition(pointer.x, pointer.y);
      }
    });
  }

  #drawCursor(color: number) {
    this.#cursor.clear();
    this.#cursor.fillStyle(color, 1);
    this.#cursor.fillCircle(0, 0, 4);
  }

  #drawGlow(color: number) {
    this.#glow.clear();
    this.#glow.fillStyle(color, 0.3);
    this.#glow.fillCircle(0, 0, 12);
  }

  hide(): void {
    this.#visible = false;
    this.#cursor.setVisible(false);
    this.#glow.setVisible(false);
  }

  show(): void {
    this.#visible = true;
    this.#cursor.setVisible(true);
    this.#glow.setVisible(true);
  }

  setCursorColor(color: number): void {
    this.#drawCursor(color);
  }

  destroy(): void {
    this.#cursor.destroy();
    this.#glow.destroy();
  }
}

import { GameObjects, Scene } from 'phaser';

export type CursorMode = 'default' | 'use' | 'look' | 'talk';

export class Player {
  #scene: Scene;
  #cursor: GameObjects.Graphics;
  #glow: GameObjects.Graphics;
  #modeText: GameObjects.Text;
  #visible = true;
  #mode: CursorMode = 'default';

  constructor(scene: Scene) {
    this.#scene = scene;

    this.#cursor = scene.add.graphics();
    this.#drawCursor(0xffffff);

    this.#glow = scene.add.graphics();
    this.#glow.setAlpha(0.3);
    this.#drawGlow(0x4488ff);

    this.#modeText = scene.add.text(scene.input.x + 16, scene.input.y - 16, '', {
      font: 'bold 10px monospace',
      color: '#ffaa44',
    }).setDepth(9999);

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.#visible) {
        this.#cursor.setPosition(pointer.x, pointer.y);
        this.#glow.setPosition(pointer.x, pointer.y);
        this.#modeText.setPosition(pointer.x + 16, pointer.y - 16);
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

  setMode(mode: CursorMode): void {
    this.#mode = mode;

    const modeColors: Record<CursorMode, number> = {
      default: 0xffffff,
      use: 0x44ff44,
      look: 0x4488ff,
      talk: 0xffaa44,
    };

    const modeLabels: Record<CursorMode, string> = {
      default: '',
      use: 'USE',
      look: 'LOOK',
      talk: 'TALK',
    };

    this.#drawCursor(modeColors[mode]);
    this.#drawGlow(modeColors[mode]);
    this.#modeText.setText(modeLabels[mode]);
  }

  hide(): void {
    this.#visible = false;
    this.#cursor.setVisible(false);
    this.#glow.setVisible(false);
    this.#modeText.setVisible(false);
  }

  show(): void {
    this.#visible = true;
    this.#cursor.setVisible(true);
    this.#glow.setVisible(true);
    this.#modeText.setVisible(true);
  }

  setCursorColor(color: number): void {
    this.#drawCursor(color);
  }

  get mode(): CursorMode {
    return this.#mode;
  }

  destroy(): void {
    this.#cursor.destroy();
    this.#glow.destroy();
    this.#modeText.destroy();
  }
}

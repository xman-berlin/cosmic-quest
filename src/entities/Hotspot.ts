import { GameObjects, Scene } from 'phaser';
import type { IHotspotDef, IExitDef, IItemPickupDef } from '../entities/types.js';

export type HotspotType = 'exit' | 'interactive' | 'pickup';

export class Hotspot extends GameObjects.Container {
  #bg: GameObjects.Graphics;
  #border: GameObjects.Graphics;
  #label: GameObjects.Text;
  #hotspotType: HotspotType;
  #accentColor: number;
  #width: number;
  #height: number;

  constructor(
    scene: Scene,
    x: number,
    y: number,
    def: IHotspotDef | IExitDef | IItemPickupDef,
    hotspotType: HotspotType,
    accentColor: number,
  ) {
    super(scene, x, y);

    this.#hotspotType = hotspotType;
    this.#accentColor = accentColor;

    let hsX: number, hsY: number, hsW: number, hsH: number, labelText: string;

    if ('hotspot' in def) {
      const exit = def as IExitDef;
      hsX = exit.hotspot.x;
      hsY = exit.hotspot.y;
      hsW = exit.hotspot.width;
      hsH = exit.hotspot.height;
      labelText = exit.label;
    } else if ('itemId' in def) {
      const pickup = def as IItemPickupDef;
      hsW = 48;
      hsH = 48;
      hsX = pickup.x - hsW / 2;
      hsY = pickup.y - hsH / 2;
      labelText = pickup.label;
    } else {
      const hs = def as IHotspotDef;
      hsX = hs.x;
      hsY = hs.y;
      hsW = hs.width;
      hsH = hs.height;
      labelText = hs.label;
    }

    this.#width = hsW;
    this.#height = hsH;

    this.#bg = scene.add.graphics();
    this.#bg.fillStyle(0x000000, 0);
    this.#bg.fillRect(0, 0, hsW, hsH);
    this.add(this.#bg);

    this.#border = scene.add.graphics();
    this.#drawBorder(false);
    this.add(this.#border);

    this.#label = scene.add.text(hsW / 2, hsH + 8, labelText, {
      font: '14px monospace',
      color: '#aaccff',
    }).setOrigin(0.5, 0);
    this.add(this.#label);

    this.setSize(hsW, hsH + 24);
    this.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, hsW, hsH),
      Phaser.Geom.Rectangle.Contains,
    );

    this.on('pointerover', () => this.#onHover(true));
    this.on('pointerout', () => this.#onHover(false));
  }

  #drawBorder(active: boolean) {
    this.#border.clear();

    const color = active ? this.#accentColor : 0x4488ff;
    const alpha = active ? 0.8 : 0.3;

    this.#border.lineStyle(2, color, alpha);
    this.#border.strokeRect(0, 0, this.#width, this.#height);

    if (active) {
      this.#border.fillStyle(color, 0.15);
      this.#border.fillRect(0, 0, this.#width, this.#height);
    }
  }

  #onHover(hovered: boolean) {
    this.#drawBorder(hovered);

    if (this.#hotspotType === 'exit' && hovered) {
      this.scene.input.setDefaultCursor('pointer');
    } else if (this.#hotspotType === 'exit') {
      this.scene.input.setDefaultCursor('default');
    }
  }

  activate(): void {
    this.#drawBorder(true);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 100,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  setLabelText(text: string): void {
    this.#label.setText(text);
  }

  get hotspotType(): HotspotType {
    return this.#hotspotType;
  }

  destroy(fromScene?: boolean): void {
    if (this.#hotspotType === 'exit') {
      this.scene.input.setDefaultCursor('default');
    }
    super.destroy(fromScene);
  }
}

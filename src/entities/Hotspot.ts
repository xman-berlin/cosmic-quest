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
  #pulseTween: Phaser.Tweens.Tween | null = null;

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
    this.#drawFill(false);
    this.add(this.#bg);

    this.#border = scene.add.graphics();
    this.#drawBorder(false);
    this.add(this.#border);

    this.#label = scene.add.text(hsW / 2, hsH + 8, labelText, {
      font: 'bold 14px monospace',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 0);
    this.add(this.#label);

    this.setSize(hsW, hsH + 24);
    this.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, hsW, hsH),
      Phaser.Geom.Rectangle.Contains,
    );

    this.on('pointerover', () => this.#onHover(true));
    this.on('pointerout', () => this.#onHover(false));

    if (this.#hotspotType === 'interactive') {
      this.#pulseTween = scene.tweens.add({
        targets: this,
        alpha: 0.6,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  #drawFill(active: boolean) {
    this.#bg.clear();

    if (this.#hotspotType === 'interactive') {
      const alpha = active ? 0.25 : 0.12;
      this.#bg.fillStyle(this.#accentColor, alpha);
      this.#bg.fillRect(0, 0, this.#width, this.#height);
    } else if (this.#hotspotType === 'pickup') {
      this.#bg.fillStyle(0x44ffaa, active ? 0.3 : 0.15);
      this.#bg.fillRect(0, 0, this.#width, this.#height);
    } else if (this.#hotspotType === 'exit') {
      this.#bg.fillStyle(0x4488ff, active ? 0.2 : 0.08);
      this.#bg.fillRect(0, 0, this.#width, this.#height);
    }
  }

  #drawBorder(active: boolean) {
    this.#border.clear();

    let color: number;
    let alpha: number;
    let lineWidth: number;

    if (this.#hotspotType === 'interactive') {
      color = active ? 0xffffff : this.#accentColor;
      alpha = active ? 1 : 0.6;
      lineWidth = active ? 3 : 2;
    } else if (this.#hotspotType === 'pickup') {
      color = active ? 0xffffff : 0x44ffaa;
      alpha = active ? 1 : 0.7;
      lineWidth = 2;
    } else {
      color = active ? 0xffffff : 0x4488ff;
      alpha = active ? 1 : 0.4;
      lineWidth = 2;
    }

    this.#border.lineStyle(lineWidth, color, alpha);
    this.#border.strokeRect(0, 0, this.#width, this.#height);

    if (active) {
      this.#border.fillStyle(color, 0.1);
      this.#border.fillRect(0, 0, this.#width, this.#height);
    }
  }

  #onHover(hovered: boolean) {
    this.#drawFill(hovered);
    this.#drawBorder(hovered);

    if (hovered) {
      this.scene.input.setDefaultCursor('pointer');
    } else {
      this.scene.input.setDefaultCursor('default');
    }
  }

  activate(): void {
    this.#drawBorder(true);
    this.#drawFill(true);
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
    this.#pulseTween?.destroy();
    this.scene.input.setDefaultCursor('default');
    super.destroy(fromScene);
  }
}

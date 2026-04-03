import { Scene, GameObjects } from 'phaser';
import type { IParallaxLayer } from '../entities/types.js';

export class BackgroundRenderer {
  #scene: Scene;
  #stars: GameObjects.Graphics[] = [];
  #gradient: GameObjects.Graphics;

  constructor(scene: Scene) {
    this.#scene = scene;
    this.#gradient = scene.add.graphics();
  }

  drawGradient(topColor: string, bottomColor: string): void {
    this.#gradient.clear();
    const width = this.#scene.cameras.main.width;
    const height = this.#scene.cameras.main.height;
    const steps = 20;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = (height / steps) * i;
      const h = height / steps + 1;
      const color = this.#interpolateColor(topColor, bottomColor, t);
      this.#gradient.fillStyle(this.#hexToNumber(color), 1);
      this.#gradient.fillRect(0, y, width, h);
    }
  }

  createParallaxLayers(layers: IParallaxLayer[]): void {
    this.destroy();

    const width = this.#scene.cameras.main.width;
    const height = this.#scene.cameras.main.height;

    for (const layer of layers) {
      const stars = this.#scene.add.graphics();
      this.#renderStars(stars, width, height, layer);
      stars.setScrollFactor(layer.speed, layer.speed);
      this.#stars.push(stars);
    }
  }

  #renderStars(
    graphics: GameObjects.Graphics,
    width: number,
    height: number,
    layer: IParallaxLayer,
  ): void {
    const color = parseInt(layer.color, 16);

    for (let i = 0; i < layer.starCount; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.FloatBetween(layer.starSize * 0.5, layer.starSize * 1.5);
      const alpha = Phaser.Math.FloatBetween(0.3, 1);

      graphics.fillStyle(color, alpha);
      graphics.fillCircle(x, y, size);
    }
  }

  #interpolateColor(c1: string, c2: string, t: number): string {
    const r1 = parseInt(c1.slice(1, 3), 16);
    const g1 = parseInt(c1.slice(3, 5), 16);
    const b1 = parseInt(c1.slice(5, 7), 16);
    const r2 = parseInt(c2.slice(1, 3), 16);
    const g2 = parseInt(c2.slice(3, 5), 16);
    const b2 = parseInt(c2.slice(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  #hexToNumber(hex: string): number {
    return parseInt(hex.slice(1), 16);
  }

  destroy(): void {
    for (const star of this.#stars) {
      star.destroy();
    }
    this.#stars = [];
    this.#gradient.destroy();
  }
}

import { Scene, GameObjects } from 'phaser';

export class PostProcessing {
  #scene: Scene;
  #vignette: GameObjects.Graphics | null = null;
  #colorOverlay: GameObjects.Graphics | null = null;
  #shakeCamera: Phaser.Cameras.Scene2D.Camera | null = null;

  constructor(scene: Scene) {
    this.#scene = scene;
  }

  enableVignette(intensity = 0.6, color = 0x000000): void {
    this.#vignette = this.#scene.add.graphics();
    this.#vignette.setDepth(15);
    this.#vignette.setScrollFactor(0);

    const width = this.#scene.cameras.main.width;
    const height = this.#scene.cameras.main.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.max(width, height) * 0.7;

    this.#drawVignette(this.#vignette, centerX, centerY, maxRadius, intensity, color);
  }

  #drawVignette(
    graphics: GameObjects.Graphics,
    cx: number,
    cy: number,
    maxRadius: number,
    intensity: number,
    color: number,
  ): void {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    const steps = 12;

    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const radius = maxRadius * (0.3 + t * 0.7);
      const alpha = t * t * intensity;

      graphics.lineStyle(4, (r << 16) | (g << 8) | b, alpha);
      graphics.strokeCircle(cx, cy, radius);
    }
  }

  setColorGrade(color: string, intensity = 0.1): void {
    this.#colorOverlay = this.#scene.add.graphics();
    this.#colorOverlay.setDepth(14);
    this.#colorOverlay.setScrollFactor(0);

    const num = parseInt(color.slice(1), 16);
    this.#colorOverlay.fillStyle(num, intensity);
    this.#colorOverlay.fillRect(0, 0, this.#scene.cameras.main.width, this.#scene.cameras.main.height);
  }

  screenShake(intensity = 0.005, duration = 300): void {
    this.#scene.cameras.main.shake(duration, intensity);
  }

  flashScreen(color = 0xffffff, duration = 200): void {
    this.#scene.cameras.main.flash(duration, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff);
  }

  pulseEffect(x: number, y: number, color = 0x4488ff, radius = 100, duration = 500): void {
    const pulse = this.#scene.add.graphics();
    pulse.setDepth(12);
    pulse.setBlendMode(Phaser.BlendModes.ADD);

    pulse.fillStyle(color, 0.5);
    pulse.fillCircle(x, y, radius);

    this.#scene.tweens.add({
      targets: pulse,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration,
      ease: 'Power2',
      onComplete: () => pulse.destroy(),
    });
  }

  destroy(): void {
    this.#vignette?.destroy();
    this.#vignette = null;
    this.#colorOverlay?.destroy();
    this.#colorOverlay = null;
  }
}

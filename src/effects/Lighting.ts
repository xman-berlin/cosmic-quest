import { Scene, GameObjects } from 'phaser';

export interface ILightSource {
  x: number;
  y: number;
  radius: number;
  color: number;
  intensity: number;
  flicker?: boolean;
  flickerSpeed?: number;
  flickerIntensity?: number;
}

export class Lighting {
  #scene: Scene;
  #lights: Map<string, GameObjects.Graphics> = new Map();
  #lightOverlay: GameObjects.Graphics;
  #tweens: Phaser.Tweens.Tween[] = [];

  constructor(scene: Scene) {
    this.#scene = scene;
    this.#lightOverlay = scene.add.graphics();
    this.#lightOverlay.setDepth(10);
  }

  addLight(id: string, config: ILightSource): void {
    const light = this.#scene.add.graphics();
    light.setBlendMode(Phaser.BlendModes.ADD);
    light.setDepth(11);

    this.#renderLight(light, config);
    this.#lights.set(id, light);

    if (config.flicker) {
      const speed = config.flickerSpeed ?? 200;
      const intensity = config.flickerIntensity ?? 0.3;

      const tween = this.#scene.tweens.add({
        targets: light,
        alpha: config.intensity - intensity,
        duration: speed,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.#tweens.push(tween);
    }
  }

  addRoomLights(lights: ILightSource[]): void {
    for (let i = 0; i < lights.length; i++) {
      this.addLight(`room_light_${i}`, lights[i]!);
    }
  }

  updateLightPosition(id: string, x: number, y: number): void {
    const light = this.#lights.get(id);
    if (light) {
      light.setPosition(x, y);
    }
  }

  removeLight(id: string): void {
    const light = this.#lights.get(id);
    if (light) {
      light.destroy();
      this.#lights.delete(id);
    }
  }

  #renderLight(graphics: GameObjects.Graphics, config: ILightSource): void {
    const { x, y, radius, color, intensity } = config;

    graphics.clear();
    graphics.alpha = intensity;

    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;

    const gradientStops = 8;
    for (let i = gradientStops; i >= 0; i--) {
      const t = i / gradientStops;
      const r2 = radius * (1 - t * 0.3);
      const alpha = t * intensity;

      graphics.fillStyle(
        (Math.round(r * t) << 16) | (Math.round(g * t) << 8) | Math.round(b * t),
        alpha,
      );
      graphics.fillCircle(x, y, r2);
    }
  }

  setGlobalBrightness(brightness: number): void {
    this.#lightOverlay.clear();
    if (brightness < 1) {
      const darkness = 1 - brightness;
      this.#lightOverlay.fillStyle(0x000000, darkness * 0.5);
      this.#lightOverlay.fillRect(0, 0, this.#scene.cameras.main.width, this.#scene.cameras.main.height);
    }
  }

  destroy(): void {
    for (const [, light] of this.#lights) {
      light.destroy();
    }
    this.#lights.clear();

    for (const tween of this.#tweens) {
      tween.destroy();
    }
    this.#tweens = [];

    this.#lightOverlay.destroy();
  }
}

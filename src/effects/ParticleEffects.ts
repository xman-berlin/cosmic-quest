import { Scene, GameObjects } from 'phaser';

export class ParticleEffects {
  #scene: Scene;
  #ambientEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  #sparkleEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  #explosionEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  #glowEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  #textureKeys: string[] = [];

  constructor(scene: Scene) {
    this.#scene = scene;
  }

  createSparkle(x: number, y: number, color = 0x44ffaa, count = 20): void {
    const particles = this.#scene.add.particles(0, 0, this.#getOrCreateParticleTexture('sparkle', color), {
      x,
      y,
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      lifespan: 600,
      gravityY: 0,
      emitting: false,
      quantity: count,
      blendMode: 'ADD',
    });

    particles.explode(count);
    this.#sparkleEmitters.push(particles);

    this.#scene.time.delayedCall(800, () => {
      particles.destroy();
      const idx = this.#sparkleEmitters.indexOf(particles);
      if (idx !== -1) this.#sparkleEmitters.splice(idx, 1);
    });
  }

  createExplosion(x: number, y: number, color = 0xff4444, count = 40): void {
    const particles = this.#scene.add.particles(0, 0, this.#getOrCreateParticleTexture('explosion', color), {
      x,
      y,
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 800,
      gravityY: 0,
      emitting: false,
      quantity: count,
      blendMode: 'ADD',
    });

    particles.explode(count);
    this.#explosionEmitters.push(particles);

    this.#scene.time.delayedCall(1000, () => {
      particles.destroy();
      const idx = this.#explosionEmitters.indexOf(particles);
      if (idx !== -1) this.#explosionEmitters.splice(idx, 1);
    });
  }

  createAmbientParticles(x: number, y: number, width: number, height: number, color = 0x8888ff, count = 30): void {
    const particles = this.#scene.add.particles(0, 0, this.#getOrCreateParticleTexture('ambient', color), {
      x: { min: x, max: x + width },
      y: { min: y, max: y + height },
      speed: { min: 5, max: 20 },
      angle: { min: 260, max: 280 },
      scale: { start: 0.3, end: 0 },
      lifespan: 3000,
      gravityY: -5,
      emitting: true,
      frequency: 200,
      quantity: 1,
      blendMode: 'ADD',
      alpha: { start: 0.6, end: 0 },
    });

    this.#ambientEmitters.push(particles);
  }

  createGlow(x: number, y: number, color = 0x4488ff, radius = 60): void {
    const glow = this.#scene.add.graphics();
    glow.fillStyle(color, 0.15);
    glow.fillCircle(x, y, radius);
    glow.setBlendMode(Phaser.BlendModes.ADD);

    this.#scene.tweens.add({
      targets: glow,
      alpha: 0.05,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.#glowEmitters.push(glow as unknown as Phaser.GameObjects.Particles.ParticleEmitter);
  }

  createEngineGlow(x: number, y: number): void {
    const glow = this.#scene.add.graphics();
    glow.fillStyle(0xff6644, 0.2);
    glow.fillCircle(x, y, 80);
    glow.setBlendMode(Phaser.BlendModes.ADD);

    this.#scene.tweens.add({
      targets: glow,
      alpha: 0.08,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.#glowEmitters.push(glow as unknown as Phaser.GameObjects.Particles.ParticleEmitter);

    const particles = this.#scene.add.particles(0, 0, this.#getOrCreateParticleTexture('engine', 0xff8866), {
      x,
      y,
      speed: { min: 10, max: 40 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.5, end: 0 },
      lifespan: 1500,
      gravityY: -10,
      emitting: true,
      frequency: 100,
      quantity: 1,
      blendMode: 'ADD',
      alpha: { start: 0.8, end: 0 },
    });

    this.#ambientEmitters.push(particles);
  }

  destroy(): void {
    for (const emitter of this.#ambientEmitters) {
      emitter.destroy();
    }
    for (const emitter of this.#sparkleEmitters) {
      emitter.destroy();
    }
    for (const emitter of this.#explosionEmitters) {
      emitter.destroy();
    }
    for (const glow of this.#glowEmitters) {
      (glow as unknown as GameObjects.Graphics).destroy();
    }
    this.#ambientEmitters = [];
    this.#sparkleEmitters = [];
    this.#explosionEmitters = [];
    this.#glowEmitters = [];
  }

  #getOrCreateParticleTexture(key: string, color: number): string {
    const textureKey = `particle_${key}_${color.toString(16)}`;
    if (this.#scene.textures.exists(textureKey)) {
      return textureKey;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d')!;

    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;

    const gradient = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
    gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.6)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 8, 8);

    this.#scene.textures.addCanvas(textureKey, canvas);
    this.#textureKeys.push(textureKey);

    return textureKey;
  }
}

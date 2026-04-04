export interface IAudioConfig {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  ambientVolume: number;
}

export type SfxType = 'pickup' | 'use' | 'transition' | 'puzzle' | 'click' | 'hover' | 'error' | 'success';

export interface IAmbientDef {
  baseFreq: number;
  harmonics: number[];
  lfoRate: number;
  lfoDepth: number;
  filterFreq: number;
  noiseLevel: number;
}

const ROOM_AMBIENTS: Record<string, IAmbientDef> = {
  ship_bridge: {
    baseFreq: 80,
    harmonics: [120, 160, 240],
    lfoRate: 0.3,
    lfoDepth: 0.02,
    filterFreq: 400,
    noiseLevel: 0.01,
  },
  corridor: {
    baseFreq: 60,
    harmonics: [90, 150],
    lfoRate: 0.15,
    lfoDepth: 0.01,
    filterFreq: 300,
    noiseLevel: 0.015,
  },
  engine_room: {
    baseFreq: 100,
    harmonics: [150, 200, 300, 400],
    lfoRate: 0.8,
    lfoDepth: 0.05,
    filterFreq: 600,
    noiseLevel: 0.04,
  },
  crew_quarters: {
    baseFreq: 70,
    harmonics: [105, 140],
    lfoRate: 0.2,
    lfoDepth: 0.015,
    filterFreq: 350,
    noiseLevel: 0.008,
  },
  observation_deck: {
    baseFreq: 50,
    harmonics: [75, 100, 200],
    lfoRate: 0.1,
    lfoDepth: 0.03,
    filterFreq: 500,
    noiseLevel: 0.005,
  },
};

export class AudioManager {
  #ctx: AudioContext | null = null;
  #masterGain: GainNode | null = null;
  #musicGain: GainNode | null = null;
  #sfxGain: GainNode | null = null;
  #ambientGain: GainNode | null = null;
  #config: IAudioConfig;
  #currentAmbient: string | null = null;
  #ambientNodes: Map<string, AudioNode[]> = new Map();
  #initialized = false;

  constructor(config?: Partial<IAudioConfig>) {
    this.#config = {
      masterVolume: 0.7,
      musicVolume: 0.5,
      sfxVolume: 0.8,
      ambientVolume: 0.4,
      ...config,
    };
  }

  async init(): Promise<void> {
    if (this.#initialized) return;

    this.#ctx = new AudioContext();
    this.#masterGain = this.#ctx.createGain();
    this.#masterGain.gain.value = this.#config.masterVolume;
    this.#masterGain.connect(this.#ctx.destination);

    this.#musicGain = this.#ctx.createGain();
    this.#musicGain.gain.value = this.#config.musicVolume;
    this.#musicGain.connect(this.#masterGain);

    this.#sfxGain = this.#ctx.createGain();
    this.#sfxGain.gain.value = this.#config.sfxVolume;
    this.#sfxGain.connect(this.#masterGain);

    this.#ambientGain = this.#ctx.createGain();
    this.#ambientGain.gain.value = this.#config.ambientVolume;
    this.#ambientGain.connect(this.#masterGain);

    this.#initialized = true;
  }

  ensureContext(): void {
    if (!this.#initialized) {
      this.init().catch(() => {});
    }
    if (this.#ctx?.state === 'suspended') {
      this.#ctx.resume().catch(() => {});
    }
  }

  playSfx(type: SfxType): void {
    this.ensureContext();
    if (!this.#ctx || !this.#sfxGain) return;

    const now = this.#ctx.currentTime;
    const osc = this.#ctx.createOscillator();
    const gain = this.#ctx.createGain();

    osc.connect(gain);
    gain.connect(this.#sfxGain);

    switch (type) {
      case 'pickup':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.exponentialRampToValueAtTime(1047, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'use':
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case 'transition':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case 'puzzle':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.setValueAtTime(440, now + 0.1);
        osc.frequency.setValueAtTime(550, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;

      case 'hover':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
        break;

      case 'error':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.setValueAtTime(150, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'success':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.12);
        osc.frequency.setValueAtTime(784, now + 0.24);
        osc.frequency.setValueAtTime(1047, now + 0.36);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
        break;
    }
  }

  startAmbient(roomId: string): void {
    this.ensureContext();
    if (!this.#ctx || !this.#ambientGain) return;

    if (this.#currentAmbient === roomId) return;
    this.stopAmbient();

    const def = ROOM_AMBIENTS[roomId];
    if (!def) return;

    this.#currentAmbient = roomId;
    const nodes: AudioNode[] = [];

    const baseOsc = this.#ctx.createOscillator();
    baseOsc.type = 'sine';
    baseOsc.frequency.value = def.baseFreq;

    const baseGain = this.#ctx.createGain();
    baseGain.gain.value = 0.08;

    const lfo = this.#ctx.createOscillator();
    lfo.frequency.value = def.lfoRate;
    const lfoGain = this.#ctx.createGain();
    lfoGain.gain.value = def.lfoDepth;

    lfo.connect(lfoGain);
    lfoGain.connect(baseGain.gain);

    baseOsc.connect(baseGain);
    baseGain.connect(this.#ambientGain);

    baseOsc.start();
    lfo.start();

    nodes.push(baseOsc, baseGain, lfo, lfoGain);

    for (const freq of def.harmonics) {
      const osc = this.#ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const g = this.#ctx.createGain();
      g.gain.value = 0.03;

      osc.connect(g);
      g.connect(this.#ambientGain);
      osc.start();

      nodes.push(osc, g);
    }

    const bufferSize = this.#ctx.sampleRate * 2;
    const noiseBuffer = this.#ctx.createBuffer(1, bufferSize, this.#ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.#ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const noiseFilter = this.#ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = def.filterFreq;

    const noiseGain = this.#ctx.createGain();
    noiseGain.gain.value = def.noiseLevel;

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.#ambientGain);
    noise.start();

    nodes.push(noise, noiseFilter, noiseGain);

    this.#ambientNodes.set(roomId, nodes);
  }

  stopAmbient(): void {
    for (const [, nodes] of this.#ambientNodes) {
      for (const node of nodes) {
        if ('stop' in node) {
          try {
            (node as AudioScheduledSourceNode).stop();
          } catch {
            // Already stopped
          }
        }
        node.disconnect();
      }
    }
    this.#ambientNodes.clear();
    this.#currentAmbient = null;
  }

  fadeAmbientTo(roomId: string, duration = 1000): void {
    this.ensureContext();
    if (!this.#ctx || !this.#ambientGain) return;

    const now = this.#ctx.currentTime;
    const fadeTime = duration / 1000;

    this.#ambientGain.gain.setValueAtTime(this.#ambientGain.gain.value, now);
    this.#ambientGain.gain.linearRampToValueAtTime(0, now + fadeTime * 0.5);

    this.stopAmbient();

    this.#ambientGain.gain.setValueAtTime(0, now + fadeTime * 0.5);
    this.#ambientGain.gain.linearRampToValueAtTime(this.#config.ambientVolume, now + fadeTime);

    this.startAmbient(roomId);
  }

  setMasterVolume(vol: number): void {
    this.#config.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.#masterGain) {
      this.#masterGain.gain.value = this.#config.masterVolume;
    }
  }

  setMusicVolume(vol: number): void {
    this.#config.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.#musicGain) {
      this.#musicGain.gain.value = this.#config.musicVolume;
    }
  }

  setSfxVolume(vol: number): void {
    this.#config.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.#sfxGain) {
      this.#sfxGain.gain.value = this.#config.sfxVolume;
    }
  }

  setAmbientVolume(vol: number): void {
    this.#config.ambientVolume = Math.max(0, Math.min(1, vol));
    if (this.#ambientGain) {
      this.#ambientGain.gain.value = this.#config.ambientVolume;
    }
  }

  get config(): Readonly<IAudioConfig> {
    return { ...this.#config };
  }

  destroy(): void {
    this.stopAmbient();
    this.#ctx?.close().catch(() => {});
    this.#ctx = null;
    this.#masterGain = null;
    this.#musicGain = null;
    this.#sfxGain = null;
    this.#ambientGain = null;
    this.#initialized = false;
  }
}

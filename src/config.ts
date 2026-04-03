import type { Types } from 'phaser';

export const SCREEN_WIDTH = 1920;
export const SCREEN_HEIGHT = 1080;

export const gameConfig: Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  backgroundColor: '#0a0a1a',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [],
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: false,
  },
};

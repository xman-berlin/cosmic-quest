import { Game } from 'phaser';
import { gameConfig } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';

gameConfig.scene = [BootScene, MenuScene, GameScene];

const game = new Game(gameConfig);

export default game;

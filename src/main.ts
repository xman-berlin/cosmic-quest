import { Game } from 'phaser';
import { gameConfig } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { InventoryScene } from './scenes/InventoryScene.js';

gameConfig.scene = [BootScene, MenuScene, GameScene, InventoryScene];

const game = new Game(gameConfig);

export default game;

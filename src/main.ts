import { Game } from 'phaser';
import { gameConfig } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { InventoryScene } from './scenes/InventoryScene.js';
import { DialogScene } from './scenes/DialogScene.js';
import { PuzzleScene } from './scenes/PuzzleScene.js';

gameConfig.scene = [BootScene, MenuScene, GameScene, InventoryScene, DialogScene, PuzzleScene];

const game = new Game(gameConfig);

export default game;

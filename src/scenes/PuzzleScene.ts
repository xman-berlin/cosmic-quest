import { Scene, GameObjects } from 'phaser';
import type { PuzzleEngine } from '../systems/PuzzleEngine.js';
import type { IPuzzleDef, IPuzzleStepDef } from '../entities/types.js';

const PANEL_WIDTH = 600;
const PANEL_HEIGHT = 400;
const PANEL_X = 660;
const PANEL_Y = 340;

export class PuzzleScene extends Scene {
  #puzzleEngine!: PuzzleEngine;
  #puzzle!: IPuzzleDef;
  #panel!: GameObjects.Container;
  #bgOverlay!: GameObjects.Graphics;
  #titleText!: GameObjects.Text;
  #descText!: GameObjects.Text;
  #progressText!: GameObjects.Text;
  #sequenceButtons: GameObjects.Container[] = [];
  #inputText!: GameObjects.Text;
  #cursorBlink = true;

  constructor() {
    super({ key: 'puzzle' });
  }

  init(data: { puzzleEngine: PuzzleEngine; puzzleId: string }) {
    this.#puzzleEngine = data.puzzleEngine;
    const puzzle = this.#puzzleEngine.getPuzzle(data.puzzleId);
    if (!puzzle) {
      this.scene.stop();
      return;
    }
    this.#puzzle = puzzle;
  }

  create() {
    this.scene.pause('game');

    this.#bgOverlay = this.add.graphics();
    this.#bgOverlay.fillStyle(0x000000, 0.6);
    this.#bgOverlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    this.#bgOverlay.setDepth(50);

    this.#panel = this.add.container(PANEL_X, PANEL_Y).setDepth(51);

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x0a0a2e, 0.95);
    panelBg.fillRoundedRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT, 12);
    panelBg.lineStyle(2, 0x4488ff, 0.8);
    panelBg.strokeRoundedRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT, 12);
    this.#panel.add(panelBg);

    this.#titleText = this.add.text(PANEL_WIDTH / 2, 20, this.#puzzle.title, {
      font: 'bold 24px monospace',
      color: '#4488ff',
    }).setOrigin(0.5, 0);
    this.#panel.add(this.#titleText);

    this.#descText = this.add.text(30, 60, this.#puzzle.description, {
      font: '16px monospace',
      color: '#aaccff',
      wordWrap: { width: PANEL_WIDTH - 60 },
    });
    this.#panel.add(this.#descText);

    const progress = this.#puzzleEngine.getActivePuzzleProgress();
    this.#progressText = this.add.text(30, PANEL_HEIGHT - 40, `Progress: ${progress.current}/${progress.total}`, {
      font: '14px monospace',
      color: '#888888',
    });
    this.#panel.add(this.#progressText);

    this.#renderPuzzleInput();

    this.#puzzleEngine.onEvent = (event, result) => {
      if (event === 'puzzleCompleted') {
        this.#showCompletion(result.message);
      } else if (event === 'stepCompleted') {
        this.#showMessage(result.message, '#44ff44');
      } else if (event === 'puzzleFailed') {
        this.#showMessage(result.message, '#ff4444');
      }
    };

    this.input.keyboard?.on('keydown-ESC', () => {
      this.#closePuzzle();
    });
  }

  #renderPuzzleInput() {
    const currentStep = this.#getCurrentStep();
    if (!currentStep) return;

    if (currentStep.type === 'sequence') {
      this.#renderSequenceInput(currentStep);
    } else if (currentStep.type === 'inventory') {
      this.#renderInventoryHint(currentStep);
    }
  }

  #renderSequenceInput(step: IPuzzleStepDef) {
    const sequence = step.sequence ?? [];
    const input = this.#puzzleEngine.getSequenceInput();

    const label = this.add.text(PANEL_WIDTH / 2, 120, 'Enter the sequence:', {
      font: '16px monospace',
      color: '#ffaa44',
    }).setOrigin(0.5, 0);
    this.#panel.add(label);

    const display = this.add.text(PANEL_WIDTH / 2, 160, '', {
      font: 'bold 20px monospace',
      color: '#44ff44',
    }).setOrigin(0.5, 0);

    const displayParts = sequence.map((s, i) => {
      return i < input.length ? s : '_';
    });
    display.setText(displayParts.join('  '));
    this.#panel.add(display);

    const codes = ['ALPHA', 'BETA', 'GAMMA', 'DELTA', 'HIGH', 'LOW', 'MEDIUM'];
    const btnWidth = 100;
    const btnHeight = 40;
    const startX = (PANEL_WIDTH - (codes.length * (btnWidth + 10))) / 2;
    const btnY = 220;

    for (let i = 0; i < codes.length; i++) {
      const code = codes[i]!;
      const btn = this.#createSequenceButton(startX + i * (btnWidth + 10), btnY, code, btnWidth, btnHeight);
      this.#sequenceButtons.push(btn);
      this.add.existing(btn);
    }
  }

  #createSequenceButton(x: number, y: number, code: string, w: number, h: number): GameObjects.Container {
    const container = this.add.container(x, y).setDepth(52);

    const bg = this.add.graphics();
    bg.fillStyle(0x2244aa, 0.8);
    bg.fillRoundedRect(0, 0, w, h, 6);
    bg.lineStyle(1, 0x4488ff, 0.6);
    bg.strokeRoundedRect(0, 0, w, h, 6);
    container.add(bg);

    const text = this.add.text(w / 2, h / 2, code, {
      font: 'bold 14px monospace',
      color: '#ffffff',
    }).setOrigin(0.5);
    container.add(text);

    container.setSize(w, h);
    container.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, w, h),
      Phaser.Geom.Rectangle.Contains,
    );

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x3366cc, 0.9);
      bg.fillRoundedRect(0, 0, w, h, 6);
      bg.lineStyle(1, 0x66aaff, 1);
      bg.strokeRoundedRect(0, 0, w, h, 6);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x2244aa, 0.8);
      bg.fillRoundedRect(0, 0, w, h, 6);
      bg.lineStyle(1, 0x4488ff, 0.6);
      bg.strokeRoundedRect(0, 0, w, h, 6);
    });

    container.on('pointerdown', () => {
      this.#puzzleEngine.submitSequenceInput(code);
      this.#updateSequenceDisplay();
    });

    return container;
  }

  #updateSequenceDisplay() {
    this.#panel.destroy(true);
    this.#sequenceButtons.forEach((b) => b.destroy());
    this.#sequenceButtons = [];

    this.#panel = this.add.container(PANEL_X, PANEL_Y).setDepth(51);

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x0a0a2e, 0.95);
    panelBg.fillRoundedRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT, 12);
    panelBg.lineStyle(2, 0x4488ff, 0.8);
    panelBg.strokeRoundedRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT, 12);
    this.#panel.add(panelBg);

    this.#titleText = this.add.text(PANEL_WIDTH / 2, 20, this.#puzzle.title, {
      font: 'bold 24px monospace',
      color: '#4488ff',
    }).setOrigin(0.5, 0);
    this.#panel.add(this.#titleText);

    this.#descText = this.add.text(30, 60, this.#puzzle.description, {
      font: '16px monospace',
      color: '#aaccff',
      wordWrap: { width: PANEL_WIDTH - 60 },
    });
    this.#panel.add(this.#descText);

    const progress = this.#puzzleEngine.getActivePuzzleProgress();
    this.#progressText = this.add.text(30, PANEL_HEIGHT - 40, `Progress: ${progress.current}/${progress.total}`, {
      font: '14px monospace',
      color: '#888888',
    });
    this.#panel.add(this.#progressText);

    this.#renderPuzzleInput();
  }

  #renderInventoryHint(step: IPuzzleStepDef) {
    const hint = this.add.text(PANEL_WIDTH / 2, 140, step.description, {
      font: '16px monospace',
      color: '#ffaa44',
      wordWrap: { width: PANEL_WIDTH - 60 },
    }).setOrigin(0.5, 0);
    this.#panel.add(hint);

    const required = step.required ?? [];
    if (required.length > 0) {
      const itemsText = this.add.text(PANEL_WIDTH / 2, 200, `Required: ${required.join(', ')}`, {
        font: '14px monospace',
        color: '#888888',
      }).setOrigin(0.5, 0);
      this.#panel.add(itemsText);
    }

    const closeHint = this.add.text(PANEL_WIDTH / 2, 280, 'Select the item in your inventory and click the hotspot to use it', {
      font: '14px monospace',
      color: '#666666',
    }).setOrigin(0.5, 0);
    this.#panel.add(closeHint);

    const closeBtn = this.add.text(PANEL_WIDTH / 2, 340, '[ESC] Close', {
      font: 'bold 16px monospace',
      color: '#4488ff',
      backgroundColor: '#2244aa',
      padding: { x: 20, y: 8 },
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      this.#closePuzzle();
    });

    this.#panel.add(closeBtn);
  }

  #getCurrentStep(): IPuzzleStepDef | null {
    const puzzle = this.#puzzleEngine.getPuzzle(this.#puzzle.id);
    if (!puzzle) return null;
    for (const step of puzzle.steps) {
      if (!this.#puzzleEngine.isStepCompleted(puzzle.id, step.id)) {
        return step;
      }
    }
    return null;
  }

  #showCompletion(message: string) {
    const completionText = this.add.text(PANEL_WIDTH / 2, PANEL_HEIGHT / 2, message, {
      font: 'bold 20px monospace',
      color: '#44ff44',
      backgroundColor: '#00000088',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5);

    this.tweens.add({
      targets: completionText,
      alpha: 0,
      delay: 2000,
      duration: 500,
      onComplete: () => {
        completionText.destroy();
        this.#closePuzzle();
      },
    });
  }

  #showMessage(text: string, color: string) {
    const msg = this.add.text(PANEL_WIDTH / 2, PANEL_HEIGHT - 80, text, {
      font: '16px monospace',
      color,
    }).setOrigin(0.5, 0);

    this.tweens.add({
      targets: msg,
      alpha: 0,
      delay: 1500,
      duration: 300,
      onComplete: () => msg.destroy(),
    });
  }

  #closePuzzle() {
    this.scene.resume('game');
    this.#panel.destroy();
    this.#bgOverlay.destroy();
    for (const btn of this.#sequenceButtons) {
      btn.destroy();
    }
    this.scene.stop();
  }
}

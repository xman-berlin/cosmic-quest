import { Scene, GameObjects } from 'phaser';
import type { DialogSystem } from '../systems/DialogSystem.js';
import type { IDialogNodeDef, IDialogChoiceDef } from '../entities/types.js';

const DIALOG_BOX_WIDTH = 1200;
const DIALOG_BOX_HEIGHT = 300;
const DIALOG_BOX_X = 360;
const DIALOG_BOX_Y = 700;
const CHOICE_WIDTH = 500;
const CHOICE_HEIGHT = 40;
const CHOICE_START_X = 460;
const CHOICE_START_Y = 760;
const CHOICE_GAP = 50;

export class DialogScene extends Scene {
  #dialogSystem!: DialogSystem;
  #dialogBox!: GameObjects.Container;
  #speakerText!: GameObjects.Text;
  #dialogText!: GameObjects.Text;
  #choiceButtons: GameObjects.Container[] = [];
  #bgOverlay!: GameObjects.Graphics;

  constructor() {
    super({ key: 'dialog' });
  }

  init(data: { dialogSystem: DialogSystem; treeId: string }) {
    this.#dialogSystem = data.dialogSystem;
    this.#dialogSystem.startDialog(data.treeId);
  }

  create() {
    this.scene.pause('game');

    this.#bgOverlay = this.add.graphics();
    this.#bgOverlay.fillStyle(0x000000, 0.5);
    this.#bgOverlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    this.#bgOverlay.setDepth(50);

    this.#dialogBox = this.add.container(DIALOG_BOX_X, DIALOG_BOX_Y).setDepth(51);

    const boxBg = this.add.graphics();
    boxBg.fillStyle(0x0a0a2e, 0.95);
    boxBg.fillRoundedRect(0, 0, DIALOG_BOX_WIDTH, DIALOG_BOX_HEIGHT, 12);
    boxBg.lineStyle(2, 0x4488ff, 0.8);
    boxBg.strokeRoundedRect(0, 0, DIALOG_BOX_WIDTH, DIALOG_BOX_HEIGHT, 12);
    this.#dialogBox.add(boxBg);

    this.#speakerText = this.add.text(30, 15, '', {
      font: 'bold 20px monospace',
      color: '#4488ff',
    });
    this.#dialogBox.add(this.#speakerText);

    this.#dialogText = this.add.text(30, 50, '', {
      font: '18px monospace',
      color: '#cccccc',
      wordWrap: { width: DIALOG_BOX_WIDTH - 60 },
    });
    this.#dialogBox.add(this.#dialogText);

    this.#dialogSystem.onEvent = (event, result) => {
      if (event === 'dialogStarted' || event === 'dialogNodeChanged') {
        this.#renderNode(result.node ?? null, result.choices ?? []);
      } else if (event === 'dialogEnded') {
        this.#closeDialog();
      }
    };

    const node = this.#dialogSystem.currentNode;
    const choices = this.#dialogSystem.currentChoices;
    this.#renderNode(node, choices);

    this.input.keyboard?.on('keydown-ESC', () => {
      this.#dialogSystem.endDialog();
    });
  }

  #renderNode(node: IDialogNodeDef | null, choices: IDialogChoiceDef[]) {
    if (!node) {
      this.#dialogSystem.endDialog();
      return;
    }

    this.#speakerText.setText(node.speaker);
    this.#dialogText.setText(node.text);

    for (const btn of this.#choiceButtons) {
      btn.destroy();
    }
    this.#choiceButtons = [];

    for (let i = 0; i < choices.length; i++) {
      const choice = choices[i]!;
      const btn = this.#createChoiceButton(choice, i);
      this.#choiceButtons.push(btn);
      this.add.existing(btn);
    }
  }

  #createChoiceButton(choice: IDialogChoiceDef, index: number): GameObjects.Container {
    const x = CHOICE_START_X;
    const y = CHOICE_START_Y + index * CHOICE_GAP;

    const container = this.add.container(x, y).setDepth(52);

    const bg = this.add.graphics();
    bg.fillStyle(0x2244aa, 0.8);
    bg.fillRoundedRect(0, 0, CHOICE_WIDTH, CHOICE_HEIGHT, 6);
    bg.lineStyle(1, 0x4488ff, 0.6);
    bg.strokeRoundedRect(0, 0, CHOICE_WIDTH, CHOICE_HEIGHT, 6);
    container.add(bg);

    const text = this.add.text(CHOICE_WIDTH / 2, CHOICE_HEIGHT / 2, choice.text, {
      font: '16px monospace',
      color: '#ffffff',
    }).setOrigin(0.5);
    container.add(text);

    container.setSize(CHOICE_WIDTH, CHOICE_HEIGHT);
    container.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, CHOICE_WIDTH, CHOICE_HEIGHT),
      Phaser.Geom.Rectangle.Contains,
    );

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x3366cc, 0.9);
      bg.fillRoundedRect(0, 0, CHOICE_WIDTH, CHOICE_HEIGHT, 6);
      bg.lineStyle(1, 0x66aaff, 1);
      bg.strokeRoundedRect(0, 0, CHOICE_WIDTH, CHOICE_HEIGHT, 6);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x2244aa, 0.8);
      bg.fillRoundedRect(0, 0, CHOICE_WIDTH, CHOICE_HEIGHT, 6);
      bg.lineStyle(1, 0x4488ff, 0.6);
      bg.strokeRoundedRect(0, 0, CHOICE_WIDTH, CHOICE_HEIGHT, 6);
    });

    container.on('pointerdown', () => {
      this.#dialogSystem.selectChoice(index);
    });

    return container;
  }

  #closeDialog() {
    this.scene.resume('game');
    this.#dialogBox.destroy();
    this.#bgOverlay.destroy();
    for (const btn of this.#choiceButtons) {
      btn.destroy();
    }
    this.scene.stop();
  }
}

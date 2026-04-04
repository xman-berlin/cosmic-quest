import type {
  IDialogTreeDef,
  IDialogsData,
  IDialogNodeDef,
  IDialogChoiceDef,
} from '../entities/types.js';
import type { ISaveData } from './SaveSystem.js';
import type { InventorySystem } from './InventorySystem.js';

export type DialogEvent = 'dialogStarted' | 'dialogNodeChanged' | 'dialogEnded';

export interface IDialogResult {
  success: boolean;
  message: string;
  node?: IDialogNodeDef;
  choices?: IDialogChoiceDef[];
}

export class DialogSystem {
  #dialogs: Map<string, IDialogTreeDef> = new Map();
  #nodes: Map<string, IDialogNodeDef> = new Map();
  #saveData: ISaveData;
  #inventorySystem: InventorySystem | null = null;
  #listeners: Map<DialogEvent, ((result: IDialogResult) => void)[]> = new Map();
  #activeTree: string | null = null;
  #currentNode: string | null = null;

  constructor(dialogsData: IDialogsData, saveData: ISaveData) {
    for (const tree of dialogsData.dialogs) {
      this.#dialogs.set(tree.id, tree);
      for (const node of tree.nodes) {
        this.#nodes.set(node.id, node);
      }
    }
    this.#saveData = saveData;
  }

  setInventorySystem(inventory: InventorySystem): void {
    this.#inventorySystem = inventory;
  }

  set onEvent(callback: (event: DialogEvent, result: IDialogResult) => void) {
    this.#listeners.set('dialogStarted', [(r) => callback('dialogStarted', r)]);
    this.#listeners.set('dialogNodeChanged', [(r) => callback('dialogNodeChanged', r)]);
    this.#listeners.set('dialogEnded', [(r) => callback('dialogEnded', r)]);
  }

  get activeTree(): string | null {
    return this.#activeTree;
  }

  get currentNode(): IDialogNodeDef | null {
    if (!this.#currentNode) return null;
    return this.#nodes.get(this.#currentNode) ?? null;
  }

  get currentChoices(): IDialogChoiceDef[] {
    const node = this.currentNode;
    if (!node) return [];
    return node.choices.filter((choice) => this.#choiceAvailable(choice));
  }

  startDialog(treeId: string): IDialogResult {
    const tree = this.#dialogs.get(treeId);
    if (!tree) {
      return { success: false, message: `Unknown dialog tree: ${treeId}` };
    }

    this.#activeTree = treeId;
    this.#currentNode = tree.nodes[0]?.id ?? null;

    const node = this.currentNode;
    const result: IDialogResult = {
      success: true,
      message: `Started conversation with ${tree.npc}`,
      choices: node?.choices ?? [],
    };
    if (node) result.node = node;
    this.#emit('dialogStarted', result);
    return result;
  }

  selectChoice(choiceIndex: number): IDialogResult {
    const node = this.currentNode;
    if (!node) {
      return { success: false, message: 'No active dialog node' };
    }

    const availableChoices = node.choices.filter((c) => this.#choiceAvailable(c));
    const choice = availableChoices[choiceIndex];
    if (!choice) {
      return { success: false, message: 'Invalid choice' };
    }

    if (choice.effects) {
      if (choice.effects.setFlag) {
        this.#saveData.flags[choice.effects.setFlag] = true;
      }
      if (choice.effects.grantItem && this.#inventorySystem) {
        this.#inventorySystem.addItem(choice.effects.grantItem);
      }
      if (choice.effects.triggerPuzzle) {
        this.#saveData.flags[`puzzle_triggered_${choice.effects.triggerPuzzle}`] = true;
      }
    }

    if (!choice.nextNode) {
      return this.#endDialog();
    }

    const nextNode = this.#nodes.get(choice.nextNode);
    if (!nextNode) {
      return this.#endDialog();
    }

    this.#currentNode = nextNode.id;

    const result: IDialogResult = {
      success: true,
      message: nextNode.text,
      node: nextNode,
      choices: this.currentChoices,
    };
    this.#emit('dialogNodeChanged', result);
    return result;
  }

  endDialog(): IDialogResult {
    return this.#endDialog();
  }

  #endDialog(): IDialogResult {
    const tree = this.#activeTree ? this.#dialogs.get(this.#activeTree) : null;
    this.#activeTree = null;
    this.#currentNode = null;

    const result: IDialogResult = {
      success: true,
      message: tree ? `Conversation with ${tree.npc} ended` : 'Conversation ended',
    };
    this.#emit('dialogEnded', result);
    return result;
  }

  #choiceAvailable(choice: IDialogChoiceDef): boolean {
    if (!choice.requires) return true;
    if (choice.requires.flag && !this.#saveData.flags[choice.requires.flag]) {
      return false;
    }
    if (choice.requires.hasItem && this.#inventorySystem) {
      return this.#inventorySystem.hasItem(choice.requires.hasItem);
    }
    return true;
  }

  #emit(event: DialogEvent, result: IDialogResult): void {
    const handlers = this.#listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(result);
      }
    }
  }
}

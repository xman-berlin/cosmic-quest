import type { IItemDef, IItemsData } from '../entities/types.js';
import type { ISaveData } from './SaveSystem.js';
import { SaveSystem } from './SaveSystem.js';

export type InventoryEvent = 'itemAdded' | 'itemRemoved' | 'itemUsed' | 'itemCombined';

export interface IInventoryResult {
  success: boolean;
  message: string;
  itemId?: string;
}

export class InventorySystem {
  #items: Map<string, IItemDef> = new Map();
  #saveData: ISaveData;
  #listeners: Map<InventoryEvent, ((result: IInventoryResult) => void)[]> = new Map();
  #selectedItem: string | null = null;

  constructor(itemsData: IItemsData, saveData: ISaveData) {
    for (const item of itemsData.items) {
      this.#items.set(item.id, item);
    }
    this.#saveData = saveData;
  }

  set onEvent(callback: (event: InventoryEvent, result: IInventoryResult) => void) {
    this.#listeners.set('itemAdded', [(r) => callback('itemAdded', r)]);
    this.#listeners.set('itemRemoved', [(r) => callback('itemRemoved', r)]);
    this.#listeners.set('itemUsed', [(r) => callback('itemUsed', r)]);
    this.#listeners.set('itemCombined', [(r) => callback('itemCombined', r)]);
  }

  get inventory(): string[] {
    return [...this.#saveData.inventory];
  }

  get selectedItem(): string | null {
    return this.#selectedItem;
  }

  set selectedItem(itemId: string | null) {
    this.#selectedItem = itemId;
  }

  getItemDef(itemId: string): IItemDef | undefined {
    return this.#items.get(itemId);
  }

  getAllItemDefs(): IItemDef[] {
    return Array.from(this.#items.values());
  }

  hasItem(itemId: string): boolean {
    return this.#saveData.inventory.includes(itemId);
  }

  addItem(itemId: string): IInventoryResult {
    if (!this.#items.has(itemId)) {
      return { success: false, message: `Unknown item: ${itemId}` };
    }
    if (this.hasItem(itemId)) {
      return { success: false, message: `Already have: ${this.#items.get(itemId)!.name}` };
    }

    this.#saveData.inventory.push(itemId);
    this.#saveData.timestamp = Date.now();
    SaveSystem.autoSave(this.#saveData);

    const item = this.#items.get(itemId)!;
    const result: IInventoryResult = { success: true, message: `Picked up: ${item.name}`, itemId };
    this.#emit('itemAdded', result);
    return result;
  }

  removeItem(itemId: string): IInventoryResult {
    const idx = this.#saveData.inventory.indexOf(itemId);
    if (idx === -1) {
      return { success: false, message: `Don't have: ${itemId}` };
    }

    this.#saveData.inventory.splice(idx, 1);
    if (this.#selectedItem === itemId) {
      this.#selectedItem = null;
    }
    this.#saveData.timestamp = Date.now();
    SaveSystem.autoSave(this.#saveData);

    const item = this.#items.get(itemId);
    const result: IInventoryResult = {
      success: true,
      message: `Dropped: ${item?.name ?? itemId}`,
      itemId,
    };
    this.#emit('itemRemoved', result);
    return result;
  }

  useItemOn(itemId: string, targetId: string): IInventoryResult {
    if (!this.hasItem(itemId)) {
      return { success: false, message: `Don't have: ${itemId}` };
    }

    const item = this.#items.get(itemId);
    if (!item) {
      return { success: false, message: `Unknown item: ${itemId}` };
    }
    if (!item.usable) {
      return { success: false, message: `${item.name} cannot be used directly` };
    }
    if (!item.useTargets.includes(targetId)) {
      return { success: false, message: `${item.name} doesn't work on that` };
    }

    const result: IInventoryResult = {
      success: true,
      message: `Used ${item.name} on ${targetId}`,
      itemId,
    };
    this.#emit('itemUsed', result);
    return result;
  }

  combineItems(itemA: string, itemB: string): IInventoryResult {
    if (!this.hasItem(itemA)) {
      return { success: false, message: `Don't have: ${itemA}` };
    }
    if (!this.hasItem(itemB)) {
      return { success: false, message: `Don't have: ${itemB}` };
    }

    const defA = this.#items.get(itemA)!;
    const defB = this.#items.get(itemB)!;

    const canCombine =
      (defA.combineWith === itemB && defA.combineResult) ||
      (defB.combineWith === itemA && defB.combineResult);

    if (!canCombine) {
      return { success: false, message: `${defA.name} and ${defB.name} can't be combined` };
    }

    const resultId = defA.combineResult || defB.combineResult!;
    this.removeItem(itemA);
    this.removeItem(itemB);

    const addResult = this.addItem(resultId);
    if (!addResult.success) {
      return addResult;
    }

    const result: IInventoryResult = {
      success: true,
      message: `Combined ${defA.name} + ${defB.name} → ${addResult.message.split(': ')[1]}`,
      itemId: resultId,
    };
    this.#emit('itemCombined', result);
    return result;
  }

  canUseOnAny(itemId: string, targetIds: string[]): boolean {
    const item = this.#items.get(itemId);
    if (!item || !item.usable) return false;
    return item.useTargets.some((t) => targetIds.includes(t));
  }

  getUsableItemsForTargets(targetIds: string[]): IItemDef[] {
    return this.getAllItemDefs().filter((item) => {
      if (!item.usable) return false;
      return item.useTargets.some((t) => targetIds.includes(t));
    });
  }

  #emit(event: InventoryEvent, result: IInventoryResult): void {
    const handlers = this.#listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(result);
      }
    }
  }
}

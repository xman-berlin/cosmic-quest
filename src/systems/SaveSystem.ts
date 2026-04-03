import type { IRoomDef } from '../entities/types.js';

export interface ISaveData {
  version: number;
  currentRoom: string;
  visitedRooms: string[];
  roomStates: Record<string, IRoomState>;
  inventory: string[];
  flags: Record<string, boolean>;
  timestamp: number;
}

export interface IRoomState {
  visited: boolean;
  itemsCollected: string[];
  puzzlesCompleted: string[];
  hotspotsActivated: string[];
}

export const SAVE_VERSION = 1;
const SAVE_KEY_PREFIX = 'cosmic_quest_save_';
const NUM_SLOTS = 3;

export class SaveSystem {
  static save(slot: number, data: ISaveData): void {
    if (slot < 1 || slot > NUM_SLOTS) {
      throw new Error(`Invalid save slot: ${slot}. Must be 1-${NUM_SLOTS}.`);
    }
    const key = `${SAVE_KEY_PREFIX}${slot}`;
    const serialized = JSON.stringify(data);
    try {
      localStorage.setItem(key, serialized);
    } catch (e) {
      console.error('Failed to save game:', e);
      throw new Error('Save failed: localStorage is full or unavailable.');
    }
  }

  static load(slot: number): ISaveData | null {
    if (slot < 1 || slot > NUM_SLOTS) {
      throw new Error(`Invalid save slot: ${slot}. Must be 1-${NUM_SLOTS}.`);
    }
    const key = `${SAVE_KEY_PREFIX}${slot}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ISaveData;
    } catch (e) {
      console.error('Failed to load save data:', e);
      return null;
    }
  }

  static deleteSave(slot: number): void {
    if (slot < 1 || slot > NUM_SLOTS) {
      throw new Error(`Invalid save slot: ${slot}. Must be 1-${NUM_SLOTS}.`);
    }
    const key = `${SAVE_KEY_PREFIX}${slot}`;
    localStorage.removeItem(key);
  }

  static hasSave(slot: number): boolean {
    if (slot < 1 || slot > NUM_SLOTS) {
      throw new Error(`Invalid save slot: ${slot}. Must be 1-${NUM_SLOTS}.`);
    }
    const key = `${SAVE_KEY_PREFIX}${slot}`;
    return localStorage.getItem(key) !== null;
  }

  static getSaveInfo(slot: number): { room: string; timestamp: number } | null {
    const data = this.load(slot);
    if (!data) return null;
    return { room: data.currentRoom, timestamp: data.timestamp };
  }

  static createNewSave(currentRoom: string): ISaveData {
    return {
      version: SAVE_VERSION,
      currentRoom,
      visitedRooms: [],
      roomStates: {},
      inventory: [],
      flags: {},
      timestamp: Date.now(),
    };
  }

  static autoSave(data: ISaveData): void {
    this.save(1, data);
  }
}

import type { IRoomDef, IRoomsData } from '../entities/types.js';
import type { ISaveData, IRoomState } from './SaveSystem.js';
import { SaveSystem } from './SaveSystem.js';

export class RoomManager {
  #rooms: Map<string, IRoomDef> = new Map();
  #currentRoom: IRoomDef | null = null;
  #saveData: ISaveData;
  #onRoomChange: ((room: IRoomDef) => void) | null = null;

  constructor(roomsData: IRoomsData, saveData?: ISaveData | null) {
    for (const room of roomsData.rooms) {
      this.#rooms.set(room.id, room);
    }

    if (saveData) {
      this.#saveData = saveData;
    } else {
      this.#saveData = SaveSystem.createNewSave('ship_bridge');
    }
  }

  set onRoomChange(callback: (room: IRoomDef) => void) {
    this.#onRoomChange = callback;
  }

  get currentRoom(): IRoomDef | null {
    return this.#currentRoom;
  }

  get saveData(): ISaveData {
    return this.#saveData;
  }

  get visitedRooms(): Set<string> {
    return new Set(this.#saveData.visitedRooms);
  }

  getRoom(id: string): IRoomDef | undefined {
    return this.#rooms.get(id);
  }

  getAllRooms(): IRoomDef[] {
    return Array.from(this.#rooms.values());
  }

  isVisited(roomId: string): boolean {
    return this.#saveData.visitedRooms.includes(roomId);
  }

  enterRoom(roomId: string): IRoomDef {
    const room = this.#rooms.get(roomId);
    if (!room) {
      throw new Error(`Room "${roomId}" not found. Available rooms: ${Array.from(this.#rooms.keys()).join(', ')}`);
    }

    this.#currentRoom = room;

    if (!this.#saveData.visitedRooms.includes(roomId)) {
      this.#saveData.visitedRooms.push(roomId);
    }

    if (!this.#saveData.roomStates[roomId]) {
      this.#saveData.roomStates[roomId] = {
        visited: true,
        itemsCollected: [],
        puzzlesCompleted: [],
        hotspotsActivated: [],
      };
    } else {
      this.#saveData.roomStates[roomId].visited = true;
    }

    this.#saveData.currentRoom = roomId;
    this.#saveData.timestamp = Date.now();

    SaveSystem.autoSave(this.#saveData);

    if (this.#onRoomChange) {
      this.#onRoomChange(room);
    }

    return room;
  }

  navigateTo(targetRoomId: string): boolean {
    if (!this.#rooms.has(targetRoomId)) {
      console.error(`Cannot navigate to unknown room: ${targetRoomId}`);
      return false;
    }
    this.enterRoom(targetRoomId);
    return true;
  }

  activateHotspot(roomId: string, hotspotId: string): void {
    const state = this.#saveData.roomStates[roomId];
    if (!state) {
      throw new Error(`No state for room "${roomId}"`);
    }
    if (!state.hotspotsActivated.includes(hotspotId)) {
      state.hotspotsActivated.push(hotspotId);
    }
    this.#saveData.timestamp = Date.now();
    SaveSystem.autoSave(this.#saveData);
  }

  isHotspotActivated(roomId: string, hotspotId: string): boolean {
    const state = this.#saveData.roomStates[roomId];
    if (!state) return false;
    return state.hotspotsActivated.includes(hotspotId);
  }

  getRoomState(roomId: string): IRoomState | null {
    return this.#saveData.roomStates[roomId] ?? null;
  }

  reset(): void {
    this.#saveData = SaveSystem.createNewSave('ship_bridge');
    this.#currentRoom = null;
  }
}

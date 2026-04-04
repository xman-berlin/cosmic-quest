export interface IAchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (state: IAchievementState) => boolean;
}

export interface IAchievementState {
  itemsCollected: number;
  puzzlesSolved: number;
  roomsVisited: number;
  itemsCombined: number;
  dialogsCompleted: number;
  gameCompleted: boolean;
  timePlayed: number;
}

export interface IAchievementStatus {
  id: string;
  unlocked: boolean;
  unlockedAt?: number;
}

const ACHIEVEMENTS: IAchievementDef[] = [
  {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Visit your first room.',
    icon: '🚪',
    condition: (s) => s.roomsVisited >= 1,
  },
  {
    id: 'explorer',
    title: 'Explorer',
    description: 'Visit all 5 rooms.',
    icon: '🗺️',
    condition: (s) => s.roomsVisited >= 5,
  },
  {
    id: 'pack_rat',
    title: 'Pack Rat',
    description: 'Collect 10 items.',
    icon: '🎒',
    condition: (s) => s.itemsCollected >= 10,
  },
  {
    id: 'hoarder',
    title: 'Hoarder',
    description: 'Collect all 15 items.',
    icon: '💎',
    condition: (s) => s.itemsCollected >= 15,
  },
  {
    id: 'problem_solver',
    title: 'Problem Solver',
    description: 'Complete 5 puzzles.',
    icon: '🧩',
    condition: (s) => s.puzzlesSolved >= 5,
  },
  {
    id: 'master_engineer',
    title: 'Master Engineer',
    description: 'Complete all 10 puzzles.',
    icon: '🔧',
    condition: (s) => s.puzzlesSolved >= 10,
  },
  {
    id: 'macgyver',
    title: 'MacGyver',
    description: 'Combine items for the first time.',
    icon: '🔬',
    condition: (s) => s.itemsCombined >= 1,
  },
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Complete conversations with all 3 NPCs.',
    icon: '💬',
    condition: (s) => s.dialogsCompleted >= 3,
  },
  {
    id: 'rescued',
    title: 'Rescued!',
    description: 'Complete the game and send the distress signal.',
    icon: '🚀',
    condition: (s) => s.gameCompleted,
  },
  {
    id: 'speed_runner',
    title: 'Speed Runner',
    description: 'Complete the game in under 15 minutes.',
    icon: '⚡',
    condition: (s) => s.gameCompleted && s.timePlayed < 15,
  },
];

export class AchievementSystem {
  #achievements: Map<string, IAchievementDef> = new Map();
  #status: Map<string, IAchievementStatus> = new Map();
  #state: IAchievementState;
  #onUnlock: ((achievement: IAchievementDef) => void) | null = null;

  constructor(state: Partial<IAchievementState>) {
    for (const ach of ACHIEVEMENTS) {
      this.#achievements.set(ach.id, ach);
      this.#status.set(ach.id, { id: ach.id, unlocked: false });
    }

    this.#state = {
      itemsCollected: 0,
      puzzlesSolved: 0,
      roomsVisited: 0,
      itemsCombined: 0,
      dialogsCompleted: 0,
      gameCompleted: false,
      timePlayed: 0,
      ...state,
    };
  }

  set onUnlock(callback: (achievement: IAchievementDef) => void) {
    this.#onUnlock = callback;
  }

  updateState(updates: Partial<IAchievementState>): void {
    Object.assign(this.#state, updates);
    this.#checkAchievements();
  }

  getAchievements(): IAchievementDef[] {
    return Array.from(this.#achievements.values());
  }

  getStatus(): IAchievementStatus[] {
    return Array.from(this.#status.values());
  }

  getUnlockedCount(): number {
    let count = 0;
    for (const [, s] of this.#status) {
      if (s.unlocked) count++;
    }
    return count;
  }

  getTotalCount(): number {
    return this.#achievements.size;
  }

  #checkAchievements(): void {
    for (const [id, def] of this.#achievements) {
      const status = this.#status.get(id);
      if (!status || status.unlocked) continue;

      if (def.condition(this.#state)) {
        status.unlocked = true;
        status.unlockedAt = Date.now();
        this.#onUnlock?.(def);
      }
    }
  }
}

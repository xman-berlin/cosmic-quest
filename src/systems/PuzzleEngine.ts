import type { IPuzzleDef, IPuzzlesData, IPuzzleStepDef } from '../entities/types.js';
import type { ISaveData } from './SaveSystem.js';
import { SaveSystem } from './SaveSystem.js';

export type PuzzleEvent = 'puzzleActivated' | 'puzzleCompleted' | 'puzzleFailed' | 'stepCompleted';

export interface IPuzzleResult {
  success: boolean;
  message: string;
  puzzleId?: string;
  rewards?: string[];
}

export class PuzzleEngine {
  #puzzles: Map<string, IPuzzleDef> = new Map();
  #saveData: ISaveData;
  #listeners: Map<PuzzleEvent, ((result: IPuzzleResult) => void)[]> = new Map();
  #activePuzzle: string | null = null;
  #sequenceInput: string[] = [];

  constructor(puzzlesData: IPuzzlesData, saveData: ISaveData) {
    for (const puzzle of puzzlesData.puzzles) {
      this.#puzzles.set(puzzle.id, { ...puzzle });
    }
    this.#saveData = saveData;
  }

  set onEvent(callback: (event: PuzzleEvent, result: IPuzzleResult) => void) {
    this.#listeners.set('puzzleActivated', [(r) => callback('puzzleActivated', r)]);
    this.#listeners.set('puzzleCompleted', [(r) => callback('puzzleCompleted', r)]);
    this.#listeners.set('puzzleFailed', [(r) => callback('puzzleFailed', r)]);
    this.#listeners.set('stepCompleted', [(r) => callback('stepCompleted', r)]);
  }

  getPuzzle(id: string): IPuzzleDef | undefined {
    return this.#puzzles.get(id);
  }

  getAllPuzzles(): IPuzzleDef[] {
    return Array.from(this.#puzzles.values());
  }

  isCompleted(puzzleId: string): boolean {
    return this.#saveData.flags[`puzzle_${puzzleId}`] === true;
  }

  getAvailablePuzzles(): IPuzzleDef[] {
    return this.getAllPuzzles().filter((p) => {
      if (this.isCompleted(p.id)) return false;
      return this.#prerequisitesMet(p);
    });
  }

  getPuzzlesForHotspot(hotspotId: string): IPuzzleDef[] {
    return this.getAvailablePuzzles().filter((p) => p.trigger === hotspotId);
  }

  activatePuzzle(puzzleId: string): IPuzzleResult {
    const puzzle = this.#puzzles.get(puzzleId);
    if (!puzzle) {
      return { success: false, message: `Unknown puzzle: ${puzzleId}` };
    }
    if (this.isCompleted(puzzleId)) {
      return { success: false, message: `Puzzle already completed: ${puzzle.title}` };
    }
    if (!this.#prerequisitesMet(puzzle)) {
      return { success: false, message: `Prerequisites not met for: ${puzzle.title}` };
    }

    this.#activePuzzle = puzzleId;
    this.#sequenceInput = [];

    const result: IPuzzleResult = {
      success: true,
      message: `Puzzle activated: ${puzzle.title}`,
      puzzleId,
    };
    this.#emit('puzzleActivated', result);
    return result;
  }

  submitItemUse(itemId: string, targetId: string): IPuzzleResult {
    if (!this.#activePuzzle) {
      const puzzles = this.getPuzzlesForHotspot(targetId);
      if (puzzles.length > 0) {
        this.activatePuzzle(puzzles[0]!.id);
      } else {
        return { success: false, message: 'No active puzzle' };
      }
    }

    if (!this.#activePuzzle) {
      return { success: false, message: 'No active puzzle' };
    }

    const puzzle = this.#puzzles.get(this.#activePuzzle)!;
    const currentStep = this.#getCurrentStep(puzzle);

    if (!currentStep) {
      return { success: false, message: 'No active step in puzzle' };
    }

    if (currentStep.type !== 'inventory' && currentStep.type !== 'sequence') {
      return { success: false, message: 'Current step does not accept item use' };
    }

    if (currentStep.targetHotspot !== targetId) {
      return { success: false, message: 'Wrong target for this puzzle step' };
    }

    if (currentStep.required && !currentStep.required.includes(itemId)) {
      return { success: false, message: 'Wrong item for this step' };
    }

    return this.#completeStep(puzzle, currentStep);
  }

  submitSequenceInput(code: string): IPuzzleResult {
    if (!this.#activePuzzle) {
      return { success: false, message: 'No active puzzle' };
    }

    const puzzle = this.#puzzles.get(this.#activePuzzle)!;
    const currentStep = this.#getCurrentStep(puzzle);

    if (!currentStep || currentStep.type !== 'sequence' || !currentStep.sequence) {
      return { success: false, message: 'Current step does not accept sequence input' };
    }

    this.#sequenceInput.push(code);

    const expected = currentStep.sequence;
    const idx = this.#sequenceInput.length - 1;

    if (idx >= expected.length || this.#sequenceInput[idx] !== expected[idx]) {
      this.#sequenceInput = [];
      return { success: false, message: 'Incorrect sequence. Try again.' };
    }

    if (this.#sequenceInput.length === expected.length) {
      return this.#completeStep(puzzle, currentStep);
    }

    return { success: true, message: `Step ${this.#sequenceInput.length}/${expected.length} correct` };
  }

  #completeStep(puzzle: IPuzzleDef, step: IPuzzleStepDef): IPuzzleResult {
    const stepIdx = puzzle.steps.indexOf(step);
    const stateKey = `puzzle_step_${puzzle.id}_${step.id}`;
    this.#saveData.flags[stateKey] = true;

    const result: IPuzzleResult = {
      success: true,
      message: `Step completed: ${step.description}`,
      puzzleId: puzzle.id,
    };
    this.#emit('stepCompleted', result);

    if (stepIdx < puzzle.steps.length - 1) {
      this.#sequenceInput = [];
      return result;
    }

    return this.#completePuzzle(puzzle);
  }

  #completePuzzle(puzzle: IPuzzleDef): IPuzzleResult {
    this.#saveData.flags[`puzzle_${puzzle.id}`] = true;

    if (puzzle.effects.flag) {
      this.#saveData.flags[puzzle.effects.flag] = true;
    }

    for (const reward of puzzle.rewards) {
      this.#saveData.flags[`reward_${reward}`] = true;
    }

    this.#activePuzzle = null;
    this.#sequenceInput = [];

    this.#saveData.timestamp = Date.now();
    SaveSystem.autoSave(this.#saveData);

    const result: IPuzzleResult = {
      success: true,
      message: `Puzzle completed: ${puzzle.title}!`,
      puzzleId: puzzle.id,
      rewards: puzzle.rewards,
    };
    this.#emit('puzzleCompleted', result);
    return result;
  }

  #getCurrentStep(puzzle: IPuzzleDef): IPuzzleStepDef | null {
    for (const step of puzzle.steps) {
      const stateKey = `puzzle_step_${puzzle.id}_${step.id}`;
      if (!this.#saveData.flags[stateKey]) {
        return step;
      }
    }
    return null;
  }

  #prerequisitesMet(puzzle: IPuzzleDef): boolean {
    for (const prereq of puzzle.prerequisites) {
      if (!this.#saveData.flags[`puzzle_${prereq}`]) {
        return false;
      }
    }
    return true;
  }

  getActivePuzzle(): IPuzzleDef | null {
    if (!this.#activePuzzle) return null;
    return this.#puzzles.get(this.#activePuzzle) ?? null;
  }

  getActivePuzzleProgress(): { current: number; total: number } {
    if (!this.#activePuzzle) return { current: 0, total: 0 };
    const puzzle = this.#puzzles.get(this.#activePuzzle)!;
    let completed = 0;
    for (const step of puzzle.steps) {
      const stateKey = `puzzle_step_${puzzle.id}_${step.id}`;
      if (this.#saveData.flags[stateKey]) completed++;
    }
    return { current: completed, total: puzzle.steps.length };
  }

  getSequenceInput(): string[] {
    return [...this.#sequenceInput];
  }

  isStepCompleted(puzzleId: string, stepId: string): boolean {
    return this.#saveData.flags[`puzzle_step_${puzzleId}_${stepId}`] === true;
  }

  resetActivePuzzle(): void {
    this.#activePuzzle = null;
    this.#sequenceInput = [];
  }

  #emit(event: PuzzleEvent, result: IPuzzleResult): void {
    const handlers = this.#listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(result);
      }
    }
  }
}

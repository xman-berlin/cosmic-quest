export interface IExitDef {
  direction: string;
  target: string;
  label: string;
  hotspot: { x: number; y: number; width: number; height: number };
}

export interface IHotspotDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  action: string;
}

export interface IParallaxLayer {
  speed: number;
  starCount: number;
  starSize: number;
  color: string;
}

export interface IItemPickupDef {
  id: string;
  itemId: string;
  x: number;
  y: number;
  label: string;
}

export interface IRoomDef {
  id: string;
  name: string;
  theme: {
    bgTop: string;
    bgBottom: string;
    accent: string;
  };
  exits: IExitDef[];
  hotspots: IHotspotDef[];
  items: IItemPickupDef[];
  parallaxLayers: IParallaxLayer[];
}

export interface IItemDef {
  id: string;
  name: string;
  description: string;
  iconColor: string;
  usable: boolean;
  useTargets: string[];
  combineWith: string | null;
  combineResult: string | null;
}

export interface IPuzzleStepDef {
  id: string;
  type: 'sequence' | 'inventory' | 'dialog' | 'environment';
  description: string;
  required?: string[];
  sequence?: string[];
  targetHotspot?: string;
  dialogNode?: string;
}

export interface IPuzzleDef {
  id: string;
  type: 'sequence' | 'inventory' | 'dialog' | 'environment';
  title: string;
  description: string;
  trigger: string;
  state: 'locked' | 'active' | 'completed';
  steps: IPuzzleStepDef[];
  rewards: string[];
  effects: {
    unlock?: string;
    flag?: string;
    grantItem?: string;
  };
  prerequisites: string[];
}

export interface IDialogNodeDef {
  id: string;
  speaker: string;
  text: string;
  choices: IDialogChoiceDef[];
  conditions?: { flag?: string; hasItem?: string };
}

export interface IDialogChoiceDef {
  text: string;
  nextNode: string | null;
  requires?: { flag?: string; hasItem?: string };
  effects?: { setFlag?: string; grantItem?: string; triggerPuzzle?: string };
}

export interface IDialogTreeDef {
  id: string;
  npc: string;
  greeting: string;
  nodes: IDialogNodeDef[];
}

export interface IRoomsData {
  rooms: IRoomDef[];
}

export interface IItemsData {
  items: IItemDef[];
}

export interface IPuzzlesData {
  puzzles: IPuzzleDef[];
}

export interface IDialogsData {
  dialogs: IDialogTreeDef[];
}

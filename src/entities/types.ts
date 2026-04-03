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
  parallaxLayers: IParallaxLayer[];
}

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

export interface IRoomsData {
  rooms: IRoomDef[];
}

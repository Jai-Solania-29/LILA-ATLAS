export interface MatchMeta {
  id: string;
  map: string;
  date: string;
  duration: number;
  humans: number;
  bots: number;
  events_count: number;
}

export interface PlayerInfo {
  id: string;
  isBot: boolean;
}

// Event structure: [timestamp, playerId, eventType, x, z]
export type MatchEvent = [number, number, string, number, number];

export interface MatchData {
  match_id: string;
  map_id: string;
  date: string;
  players: Record<string, PlayerInfo>;
  events: MatchEvent[];
}

export interface MapConfig {
  scale: number;
  originX: number;
  originZ: number;
}

export const MAPS: Record<string, MapConfig> = {
  AmbroseValley: { scale: 900, originX: -370, originZ: -473 },
  GrandRift: { scale: 581, originX: -290, originZ: -290 },
  Lockdown: { scale: 1000, originX: -500, originZ: -500 }
};

export type ViewMode = 'timeline' | 'heatmap';
export type HeatmapType = 'Kill' | 'Death' | 'Loot' | 'Traffic' | 'StormDeath';

import { MAPS } from '../types';

export function worldToMinimap(x: number, z: number, mapId: string): { pixelX: number, pixelY: number } {
  const config = MAPS[mapId];
  if (!config) return { pixelX: 0, pixelY: 0 };
  
  // Step 1: Convert world coords to UV (0-1 range)
  const u = (x - config.originX) / config.scale;
  const v = (z - config.originZ) / config.scale;
  
  // Step 2: Convert UV to pixel coords (1024x1024 image)
  const pixelX = u * 1024;
  const pixelY = (1 - v) * 1024;
  
  return { pixelX, pixelY };
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor(ms % 1000);
  
  if (minutes === 0 && seconds === 0) {
    return `00:00.${milliseconds.toString().padStart(3, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

export function getEventColor(type: string): string {
  switch(type) {
    case 'Kill':
    case 'BotKill':
      return '#ef4444';
    case 'Killed':
    case 'BotKilled':
      return '#b91c1c';
    case 'Loot':
      return '#f59e0b';
    case 'KilledByStorm':
      return '#a855f7';
    default:
      return '#ffffff';
  }
}

import React, { useEffect, useRef, useState } from 'react';
import { MatchData, ViewMode, HeatmapType, MatchEvent } from '../types';
import { worldToMinimap, getEventColor } from '../lib/utils';

interface MapViewerProps {
  mapId: string;
  viewMode: ViewMode;
  matchData: MatchData | null;
  heatmapData: number[][] | null;
  heatmapType: HeatmapType | null;
  currentTime: number;
  showHumans: boolean;
  showBots: boolean;
  showKills: boolean;
  showDeaths: boolean;
  showLoot: boolean;
  showStorm: boolean;
}

export default function MapViewer({
  mapId,
  viewMode,
  matchData,
  heatmapData,
  heatmapType,
  currentTime,
  showHumans,
  showBots,
  showKills,
  showDeaths,
  showLoot,
  showStorm
}: MapViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle Canvas Resizing
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      // Keep canvas 1024x1024 to match image, use CSS transform to scale down
      // Actually, standardizing at 1024x1024 internally simplifies things
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main Render Loop
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // --- Core Render Loop ---
    // Clear the canvas on every frame before drawing new data.
    // The canvas is fixed at 1024x1024 to match the coordinate system of the background image.
    ctx.clearRect(0, 0, 1024, 1024);
    
    // Determine which mode we are in and delegate to the appropriate rendering function.
    if (viewMode === 'heatmap' && heatmapData) {
      renderHeatmap(ctx, heatmapData, mapId, heatmapType);
    } else if (viewMode === 'timeline' && matchData) {
      renderMatch(ctx, matchData, mapId, currentTime);
    }
    
  }, [mapId, viewMode, matchData, heatmapData, heatmapType, currentTime, showHumans, showBots, showKills, showDeaths, showLoot, showStorm]);

  const renderMatch = (ctx: CanvasRenderingContext2D, data: MatchData, mapId: string, maxTimeMs: number) => {
    // We maintain a dictionary of paths (lines) for each player up to the current 'maxTimeMs'.
    const paths: Record<number, { points: {x: number, y: number}[], isBot: boolean, lastTime: number }> = {};
    const events: {x: number, y: number, type: string}[] = [];
    
    // --- Data Processing: Reconstruct state at current time ---
    // Iterate through all recorded events. Since they are sorted chronologically,
    // we stop processing once we hit an event that happened *after* our current playback time.
    for (const evt of data.events) {
      const [time, pId, type, x, z] = evt;
      if (time > maxTimeMs) break;
      
      const pInfo = data.players[pId];
      if (!pInfo) continue;
      if (pInfo.isBot && !showBots) continue;
      if (!pInfo.isBot && !showHumans) continue;
      
      const { pixelX, pixelY } = worldToMinimap(x, z, mapId);
      
      if (type === 'Position' || type === 'BotPosition') {
        // Build movement paths over time.
        if (!paths[pId]) {
          paths[pId] = { points: [], isBot: pInfo.isBot, lastTime: 0 };
        }
        paths[pId].points.push({ x: pixelX, y: pixelY });
        paths[pId].lastTime = time;
      } else {
        // Record combat/loot events if the user hasn't filtered them out in the sidebar.
        if ((type === 'Kill' || type === 'BotKill') && showKills) {
          events.push({ x: pixelX, y: pixelY, type });
        } else if ((type === 'Killed' || type === 'BotKilled') && showDeaths) {
          events.push({ x: pixelX, y: pixelY, type });
        } else if (type === 'Loot' && showLoot) {
          events.push({ x: pixelX, y: pixelY, type });
        } else if (type === 'KilledByStorm' && showStorm) {
          events.push({ x: pixelX, y: pixelY, type });
        }
      }
    }
    
    // Draw paths
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    for (const pId in paths) {
      const path = paths[pId];
      if (path.points.length === 0) continue;
      
      // fade out old paths slightly
      const timeDiff = maxTimeMs - path.lastTime;
      const opacity = Math.max(0.2, 1 - (timeDiff / 60000)); // fade after 60s of inactivity
      
      if (path.points.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = path.isBot ? `rgba(156, 163, 175, ${opacity})` : `rgba(59, 130, 246, ${opacity})`;
        if (path.isBot) {
          ctx.setLineDash([5, 5]);
        } else {
          ctx.setLineDash([]);
        }
        
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.stroke();
      }
      
      // Draw head / current position
      const head = path.points[path.points.length - 1];
      ctx.beginPath();
      ctx.arc(head.x, head.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = path.isBot ? `rgba(209, 213, 219, ${opacity})` : `rgba(96, 165, 250, ${opacity})`;
      ctx.fill();
    }
    
    // Draw events
    ctx.setLineDash([]);
    for (const evt of events) {
      ctx.beginPath();
      if (evt.type === 'Loot') {
        // Draw square for loot
        ctx.rect(evt.x - 4, evt.y - 4, 8, 8);
        ctx.fillStyle = getEventColor(evt.type);
        ctx.fill();
      } else if (evt.type === 'Killed' || evt.type === 'BotKilled' || evt.type === 'KilledByStorm') {
        // Draw X for death
        ctx.strokeStyle = getEventColor(evt.type);
        ctx.lineWidth = 3;
        const s = 5;
        ctx.moveTo(evt.x - s, evt.y - s);
        ctx.lineTo(evt.x + s, evt.y + s);
        ctx.moveTo(evt.x + s, evt.y - s);
        ctx.lineTo(evt.x - s, evt.y + s);
        ctx.stroke();
      } else {
        // Circle for kills
        ctx.arc(evt.x, evt.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = getEventColor(evt.type);
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#fff';
        ctx.stroke();
      }
    }
  };

  const renderHeatmap = (ctx: CanvasRenderingContext2D, points: number[][], mapId: string, type: HeatmapType | null) => {
    if (!points || points.length === 0) return;
    
    // Simple canvas radial gradient heatmap
    // For large datasets, we can downsample or aggregate
    
    // Create an offscreen canvas to accumulate density
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 1024;
    offCanvas.height = 1024;
    const offCtx = offCanvas.getContext('2d')!;
    
    // Determine gradient based on type
    let colorStart, colorEnd;
    switch(type) {
      case 'Kill': colorStart = 'rgba(239, 68, 68, 0.8)'; colorEnd = 'rgba(239, 68, 68, 0)'; break;
      case 'Death': colorStart = 'rgba(185, 28, 28, 0.8)'; colorEnd = 'rgba(185, 28, 28, 0)'; break;
      case 'Loot': colorStart = 'rgba(245, 158, 11, 0.8)'; colorEnd = 'rgba(245, 158, 11, 0)'; break;
      case 'StormDeath': colorStart = 'rgba(168, 85, 247, 0.8)'; colorEnd = 'rgba(168, 85, 247, 0)'; break;
      case 'Traffic': 
      default:
        colorStart = 'rgba(59, 130, 246, 0.2)'; colorEnd = 'rgba(59, 130, 246, 0)'; break;
    }
    
    // Draw points
    const radius = type === 'Traffic' ? 40 : 25;
    const intensity = type === 'Traffic' ? 0.05 : 0.3;
    
    offCtx.globalAlpha = intensity;
    
    points.forEach(pt => {
      const { pixelX, pixelY } = worldToMinimap(pt[0], pt[1], mapId);
      
      const grad = offCtx.createRadialGradient(pixelX, pixelY, 0, pixelX, pixelY, radius);
      grad.addColorStop(0, colorStart);
      grad.addColorStop(1, colorEnd);
      
      offCtx.beginPath();
      offCtx.arc(pixelX, pixelY, radius, 0, Math.PI * 2);
      offCtx.fillStyle = grad;
      offCtx.fill();
    });
    
    // Transfer to main canvas
    ctx.globalAlpha = 1.0;
    ctx.drawImage(offCanvas, 0, 0);
  };

  const mapImagePath = `/minimaps/${mapId}_Minimap.${mapId === 'Lockdown' ? 'jpg' : 'png'}`;

  // Pan and Zoom logic
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      // Fit map into the container (leave a little margin)
      const scale = Math.min(width / 1024, height / 1024) * 0.95;
      setTransform({ scale, x: 0, y: 0 });
    }
  }, [mapId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const scaleChange = e.deltaY * -0.001;
      setTransform(t => ({ 
        ...t, 
        scale: Math.min(Math.max(0.1, t.scale + scaleChange), 10) 
      }));
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleNativeWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform(t => ({ ...t, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }));
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  return (
    <div 
      className="map-container" 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div 
        className="map-wrapper"
        style={{ 
          width: '1024px', 
          height: '1024px',
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        <img 
          src={mapImagePath} 
          alt={`${mapId} minimap`} 
          className="map-image" 
          draggable={false}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <canvas 
          ref={canvasRef} 
          width={1024} 
          height={1024} 
          className="map-canvas"
        />
      </div>
    </div>
  );
}

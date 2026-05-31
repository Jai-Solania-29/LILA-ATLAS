
import { ViewMode, HeatmapType, MatchMeta } from '../types';

interface SidebarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  mapId: string;
  setMapId: (id: string) => void;
  matchId: string;
  setMatchId: (id: string) => void;
  heatmapType: HeatmapType;
  setHeatmapType: (type: HeatmapType) => void;
  matches: MatchMeta[];
  showHumans: boolean;
  setShowHumans: (s: boolean) => void;
  showBots: boolean;
  setShowBots: (s: boolean) => void;
  showKills: boolean;
  setShowKills: (s: boolean) => void;
  showDeaths: boolean;
  setShowDeaths: (s: boolean) => void;
  showLoot: boolean;
  setShowLoot: (s: boolean) => void;
  showStorm: boolean;
  setShowStorm: (s: boolean) => void;
}

export default function Sidebar({
  viewMode, setViewMode, mapId, setMapId, matchId, setMatchId,
  heatmapType, setHeatmapType, matches,
  showHumans, setShowHumans, showBots, setShowBots,
  showKills, setShowKills, showDeaths, setShowDeaths,
  showLoot, setShowLoot, showStorm, setShowStorm
}: SidebarProps) {
  
  const maps = ['AmbroseValley', 'GrandRift', 'Lockdown'];
  
  // Filter matches for the selected map
  const filteredMatches = matches.filter(m => m.map === mapId).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>LILA&nbsp;ATLAS</h1>
        <p>Player Journey Visualizer</p>
      </div>
      
      <div className="sidebar-section">
        <h2>Mode</h2>
        <div className="segmented-control">
          <button 
            className={`segment-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
          >
            Timeline
          </button>
          <button 
            className={`segment-btn ${viewMode === 'heatmap' ? 'active' : ''}`}
            onClick={() => setViewMode('heatmap')}
          >
            Heatmaps
          </button>
        </div>
      </div>

      <div className="sidebar-section">
        <h2>Location</h2>
        <div className="control-group">
          <label className="control-label">Map</label>
          <select 
            className="select-input" 
            value={mapId} 
            onChange={(e) => {
              setMapId(e.target.value);
              // auto select first match
              const m = matches.find(m => m.map === e.target.value);
              if (m) setMatchId(m.id);
            }}
          >
            {maps.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        
        {viewMode === 'timeline' && (
          <div className="control-group">
            <label className="control-label">Match ID</label>
            <select 
              className="select-input" 
              value={matchId} 
              onChange={(e) => setMatchId(e.target.value)}
              title={matchId}
            >
              {filteredMatches.map(m => (
                <option key={m.id} value={m.id} title={m.id}>
                  {m.date} | H: {m.humans} B: {m.bots} | {m.id.substring(0, 8)}...
                </option>
              ))}
            </select>
          </div>
        )}

        {viewMode === 'heatmap' && (
          <div className="control-group">
            <label className="control-label">Heatmap Metric</label>
            <select 
              className="select-input" 
              value={heatmapType} 
              onChange={(e) => setHeatmapType(e.target.value as HeatmapType)}
            >
              <option value="Traffic">Player Traffic</option>
              <option value="Kill">Kill Zones</option>
              <option value="Death">Death Zones</option>
              <option value="Loot">Loot Density</option>
              <option value="StormDeath">Storm Deaths</option>
            </select>
          </div>
        )}
      </div>

      {viewMode === 'timeline' && (
        <div className="sidebar-section">
          <h2>Filters</h2>
          <div className="control-group">
            <label className="control-label">Entities</label>
            <div className="checkbox-list">
              <label className="toggle-label">
                <div className="toggle-label-inner">
                  <span className="legend-dot human"></span> Humans
                </div>
                <input type="checkbox" checked={showHumans} onChange={e => setShowHumans(e.target.checked)} />
                <div className="toggle-switch"></div>
              </label>
              <label className="toggle-label">
                <div className="toggle-label-inner">
                  <span className="legend-dot bot"></span> Bots
                </div>
                <input type="checkbox" checked={showBots} onChange={e => setShowBots(e.target.checked)} />
                <div className="toggle-switch"></div>
              </label>
            </div>
          </div>
          
          <div className="control-group">
            <label className="control-label">Events</label>
            <div className="checkbox-list">
              <label className="toggle-label">
                <div className="toggle-label-inner">
                  <span className="legend-dot kill"></span> Kills
                </div>
                <input type="checkbox" checked={showKills} onChange={e => setShowKills(e.target.checked)} />
                <div className="toggle-switch"></div>
              </label>
              <label className="toggle-label">
                <div className="toggle-label-inner">
                  <span className="legend-dot death"></span> Deaths
                </div>
                <input type="checkbox" checked={showDeaths} onChange={e => setShowDeaths(e.target.checked)} />
                <div className="toggle-switch"></div>
              </label>
              <label className="toggle-label">
                <div className="toggle-label-inner">
                  <span className="legend-dot loot"></span> Loot
                </div>
                <input type="checkbox" checked={showLoot} onChange={e => setShowLoot(e.target.checked)} />
                <div className="toggle-switch"></div>
              </label>
              <label className="toggle-label">
                <div className="toggle-label-inner">
                  <span className="legend-dot storm"></span> Storm Deaths
                </div>
                <input type="checkbox" checked={showStorm} onChange={e => setShowStorm(e.target.checked)} />
                <div className="toggle-switch"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'timeline' && (
        <div className="sidebar-section">
          <h2>Selected Match Stats</h2>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-label">Humans</div>
              <div className="stat-value">{matches.find(m => m.id === matchId)?.humans || 0}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Bots</div>
              <div className="stat-value">{matches.find(m => m.id === matchId)?.bots || 0}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Duration</div>
              <div className="stat-value">{Math.floor((matches.find(m => m.id === matchId)?.duration || 0) / 60000)}m</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Events</div>
              <div className="stat-value">{matches.find(m => m.id === matchId)?.events_count || 0}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

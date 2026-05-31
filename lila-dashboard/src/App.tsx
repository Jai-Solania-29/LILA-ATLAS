import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MapViewer from './components/MapViewer';
import Timeline from './components/Timeline';
import { ViewMode, HeatmapType, MatchMeta, MatchData } from './types';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- Application State Management ---
  
  // Data State: Holds the raw JSON data fetched from the server.
  // We keep a list of all matches (matchesMeta), and load the detailed events/heatmap only when needed.
  const [matchesMeta, setMatchesMeta] = useState<MatchMeta[]>([]);
  const [currentMatchData, setCurrentMatchData] = useState<MatchData | null>(null);
  const [currentHeatmapData, setCurrentHeatmapData] = useState<number[][] | null>(null);
  
  // View State
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [mapId, setMapId] = useState<string>('AmbroseValley');
  const [matchId, setMatchId] = useState<string>('');
  const [heatmapType, setHeatmapType] = useState<HeatmapType>('Traffic');
  
  // Playback State: Controls the timeline scrubber for "Timeline" mode.
  // The 'maxTime' is dynamically set based on the last event timestamp of the loaded match.
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [maxTime, setMaxTime] = useState<number>(100);
  
  // Filter State
  const [showHumans, setShowHumans] = useState(true);
  const [showBots, setShowBots] = useState(true);
  const [showKills, setShowKills] = useState(true);
  const [showDeaths, setShowDeaths] = useState(true);
  const [showLoot, setShowLoot] = useState(false);
  const [showStorm, setShowStorm] = useState(true);

  // --- Data Fetching Side Effects ---
  
  // 1. Initial Load: Fetch the metadata for all available matches on component mount.
  // We default to the 'AmbroseValley' map if it exists in the dataset.
  useEffect(() => {
    fetch('/data/matches_meta.json')
      .then(res => res.json())
      .then(data => {
        setMatchesMeta(data);
        if (data.length > 0) {
          // Find first AmbroseValley match as a sensible default
          const m = data.find((d: MatchMeta) => d.map === 'AmbroseValley');
          if (m) {
            setMatchId(m.id);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to load match metadata. Please ensure the data pipeline has been run.");
        setLoading(false);
      });
  }, []);

  // 2. Match Data Fetch: Whenever the user selects a different match (or we are in timeline mode),
  // fetch the large JSON file containing all the player movement and combat events for that specific match.
  useEffect(() => {
    if (!matchId || viewMode !== 'timeline') return;
    
    setLoading(true);
    fetch(`/data/matches/${matchId}.json`)
      .then(res => res.json())
      .then(data => {
        setCurrentMatchData(data);
        const maxTs = data.events.length > 0 ? data.events[data.events.length - 1][0] : 100;
        setMaxTime(maxTs);
        setCurrentTime(0);
        setIsPlaying(false);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(`Failed to load data for match ${matchId}`);
        setLoading(false);
      });
  }, [matchId, viewMode]);

  // 3. Heatmap Data Fetch: If the user switches to 'heatmap' mode, we need to load aggregated data
  // for the entire map rather than a single match. We fetch this based on the selected map and heatmap type.
  useEffect(() => {
    if (viewMode !== 'heatmap') return;
    
    setLoading(true);
    fetch(`/data/heatmaps/${mapId}.json`)
      .then(res => res.json())
      .then(data => {
        setCurrentHeatmapData(data[heatmapType] || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(`Failed to load heatmap data for ${mapId}`);
        setLoading(false);
      });
  }, [mapId, heatmapType, viewMode]);

  if (error) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem' }}>
        <h2>Error Loading Data</h2>
        <p style={{ color: 'var(--color-kill)' }}>{error}</p>
        <button onClick={() => window.location.reload()} className="select-input" style={{ width: 'auto' }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar 
        viewMode={viewMode}
        setViewMode={setViewMode}
        mapId={mapId}
        setMapId={setMapId}
        matchId={matchId}
        setMatchId={setMatchId}
        heatmapType={heatmapType}
        setHeatmapType={setHeatmapType}
        matches={matchesMeta}
        showHumans={showHumans}
        setShowHumans={setShowHumans}
        showBots={showBots}
        setShowBots={setShowBots}
        showKills={showKills}
        setShowKills={setShowKills}
        showDeaths={showDeaths}
        setShowDeaths={setShowDeaths}
        showLoot={showLoot}
        setShowLoot={setShowLoot}
        showStorm={showStorm}
        setShowStorm={setShowStorm}
      />
      
      <div style={{ flex: 1, position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="loader">
              <div className="spinner"></div>
              <p>Loading data...</p>
            </div>
          </div>
        )}
        
        <MapViewer 
          mapId={mapId}
          viewMode={viewMode}
          matchData={currentMatchData}
          heatmapData={currentHeatmapData}
          heatmapType={heatmapType}
          currentTime={currentTime}
          showHumans={showHumans}
          showBots={showBots}
          showKills={showKills}
          showDeaths={showDeaths}
          showLoot={showLoot}
          showStorm={showStorm}
        />
        
        {viewMode === 'timeline' && !loading && (
          <Timeline 
            currentTime={currentTime}
            maxTime={maxTime}
            onTimeChange={setCurrentTime}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
          />
        )}
      </div>
    </div>
  );
}

export default App;

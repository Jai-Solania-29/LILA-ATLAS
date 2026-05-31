import { useEffect, useState } from 'react';
import { formatTime } from '../lib/utils';

interface TimelineProps {
  currentTime: number;
  maxTime: number;
  onTimeChange: (time: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export default function Timeline({
  currentTime,
  maxTime,
  onTimeChange,
  isPlaying,
  setIsPlaying
}: TimelineProps) {
  const [speed, setSpeed] = useState<number>(1);
  
  // --- Animation Loop ---
  // We use requestAnimationFrame to smoothly update the playback timeline.
  // This is much more performant and fluid than using a standard setInterval.
  useEffect(() => {
    let animationFrame: number;
    let lastTimestamp: number;
    
    const step = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      
      // Calculate delta time (dt) to ensure smooth playback regardless of framerate
      const dt = timestamp - lastTimestamp;
      
      if (isPlaying) {
        // Data contains very short matches (usually under 1 second of actual data),
        // we slow it down significantly (0.2x base speed) so 1x speed is observable.
        const baseSpeed = 0.2;
        const newTime = currentTime + (dt * baseSpeed * speed);
        
        // Auto-pause when we reach the end of the match
        if (newTime >= maxTime) {
          onTimeChange(maxTime);
          setIsPlaying(false);
        } else {
          onTimeChange(newTime);
        }
      }
      
      lastTimestamp = timestamp;
      animationFrame = requestAnimationFrame(step);
    };
    
    if (isPlaying) {
      animationFrame = requestAnimationFrame(step);
    }
    
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isPlaying, currentTime, maxTime, onTimeChange, setIsPlaying, speed]);

  return (
    <div className="timeline-panel">
      <div className="timeline-controls">
        <button 
          className="btn-play"
          style={{ width: '36px', height: '36px' }}
          onClick={() => {
            if (currentTime >= maxTime && !isPlaying) {
              onTimeChange(0);
            }
            setIsPlaying(!isPlaying);
          }}
        >
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '2px' }}>
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
        </button>

        <button 
          className="btn-icon" 
          onClick={() => { onTimeChange(0); setIsPlaying(true); }}
          title="Restart"
          style={{ padding: '0.25rem' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="19 20 9 12 19 4 19 20"></polygon>
            <line x1="5" y1="19" x2="5" y2="5"></line>
          </svg>
        </button>
      </div>

      <div className="timeline-time">{formatTime(currentTime)} / {formatTime(maxTime)}</div>
      
      <div className="slider-container">
        <input 
          type="range" 
          min="0" 
          max={maxTime || 100} 
          value={currentTime} 
          onChange={(e) => {
            onTimeChange(Number(e.target.value));
          }}
          className="time-slider"
          style={{
            background: `linear-gradient(to right, var(--accent) ${(currentTime / (maxTime || 100)) * 100}%, rgba(255,255,255,0.1) ${(currentTime / (maxTime || 100)) * 100}%)`
          }}
        />
      </div>

      <div className="speed-controls">
        {[0.5, 1, 1.5, 2].map(s => (
          <button 
            key={s}
            className={`btn-speed ${speed === s ? 'active' : ''}`}
            onClick={() => setSpeed(s)}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}

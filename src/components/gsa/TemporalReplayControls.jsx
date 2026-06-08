import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Calendar, Clock, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TemporalReplayControls({
  events = [],
  onTimeChange,
  onPlayStateChange,
  enabled = false
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [timeRange, setTimeRange] = useState({ start: null, end: null });
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const intervalRef = useRef(null);

  // Calculate time range from events
  useEffect(() => {
    if (events.length === 0) return;
    
    const timestamps = events
      .map(e => new Date(e.timestamp || e.occurred_at || e.created_date).getTime())
      .filter(t => !isNaN(t));
    
    if (timestamps.length === 0) return;
    
    const start = Math.min(...timestamps);
    const end = Date.now();
    
    setTimeRange({ start, end });
    setCurrentTime(end);
  }, [events]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying || !timeRange.start) return;
    
    const step = (timeRange.end - timeRange.start) / 1000; // 1000 steps
    const interval = 50; // 50ms per step
    
    intervalRef.current = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + (step * playbackSpeed);
        if (next >= timeRange.end) {
          setIsPlaying(false);
          return timeRange.end;
        }
        return next;
      });
    }, interval);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, timeRange, playbackSpeed]);

  // Notify parent of time changes
  useEffect(() => {
    if (onTimeChange && timeRange.start) {
      onTimeChange(currentTime);
    }
  }, [currentTime, timeRange]);

  // Notify parent of play state
  useEffect(() => {
    if (onPlayStateChange) {
      onPlayStateChange(isPlaying);
    }
  }, [isPlaying]);

  const handleSliderChange = (e) => {
    const value = parseFloat(e.target.value);
    const time = timeRange.start + (timeRange.end - timeRange.start) * value;
    setCurrentTime(time);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(timeRange.end);
  };

  const togglePlay = () => {
    if (currentTime >= timeRange.end) {
      setCurrentTime(timeRange.start);
    }
    setIsPlaying(!isPlaying);
  };

  const getSliderPosition = () => {
    if (!timeRange.start) return 0;
    return (currentTime - timeRange.start) / (timeRange.end - timeRange.start);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (!enabled || !timeRange.start) return null;

  const daysSpan = Math.ceil((timeRange.end - timeRange.start) / (1000 * 60 * 60 * 24));

  return (
    <div className="shrink-0 border-t border-white/5 bg-[#020509]/95 backdrop-blur-xl px-4 py-3 z-30">
      <div className="max-w-6xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-[#00e5ff]" />
              <span className="text-[9px] font-black tracking-[0.2em] text-[#00e5ff] uppercase">
                Temporal Replay
              </span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <div className="text-[8px] text-gray-600 font-mono">
              {daysSpan} days of historical data
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Speed control */}
            <div className="flex items-center gap-1 bg-white/3 rounded-sm p-0.5">
              {[0.5, 1, 2, 4].map(speed => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2 py-0.5 rounded-sm text-[8px] font-mono transition-all ${
                    playbackSpeed === speed
                      ? "bg-[#00e5ff]/15 text-[#00e5ff]"
                      : "text-gray-600 hover:text-gray-400"
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Playback controls */}
            <Button
              onClick={handleReset}
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-gray-600 hover:text-[#00e5ff]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button
              onClick={togglePlay}
              size="sm"
              className="h-7 px-3 bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30 hover:bg-[#00e5ff]/25"
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5 ml-0.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Timeline slider */}
        <div className="space-y-2">
          <div className="relative">
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={getSliderPosition()}
              onChange={handleSliderChange}
              className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer 
                         [&::-webkit-slider-thumb]:appearance-none 
                         [&::-webkit-slider-thumb]:w-4 
                         [&::-webkit-slider-thumb]:h-4 
                         [&::-webkit-slider-thumb]:rounded-full 
                         [&::-webkit-slider-thumb]:bg-[#00e5ff]
                         [&::-webkit-slider-thumb]:border-2
                         [&::-webkit-slider-thumb]:border-[#020509]
                         [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,229,255,0.4)]
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-moz-range-thumb]:w-4 
                         [&::-moz-range-thumb]:h-4 
                         [&::-moz-range-thumb]:rounded-full 
                         [&::-moz-range-thumb]:bg-[#00e5ff]
                         [&::-moz-range-thumb]:border-2
                         [&::-moz-range-thumb]:border-[#020509]
                         [&::-moz-range-thumb]:shadow-[0_0_8px_rgba(0,229,255,0.4)]
                         [&::-moz-range-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, 
                  rgba(0,229,255,0.3) 0%, 
                  rgba(0,229,255,0.3) ${getSliderPosition() * 100}%, 
                  rgba(255,255,255,0.05) ${getSliderPosition() * 100}%, 
                  rgba(255,255,255,0.05) 100%)`
              }}
            />
            
            {/* Progress indicator */}
            <div 
              className="absolute top-0 h-2 pointer-events-none rounded-l-full"
              style={{
                left: 0,
                width: `${getSliderPosition() * 100}%`,
                background: 'linear-gradient(90deg, rgba(0,229,255,0.1), rgba(0,229,255,0.3))',
                boxShadow: '0 0 12px rgba(0,229,255,0.2)'
              }}
            />
          </div>

          {/* Time labels */}
          <div className="flex items-center justify-between text-[8px] font-mono">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(timeRange.start)}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-sm px-2 py-1">
              <Clock className="w-3 h-3 text-[#00e5ff]" />
              <span className="text-[#00e5ff] font-bold">
                {formatDate(currentTime)}
              </span>
              <span className="text-gray-600">·</span>
              <span className="text-gray-500">
                {formatTime(currentTime)}
              </span>
              {isPlaying && (
                <>
                  <FastForward className="w-3 h-3 text-[#00e5ff] animate-pulse ml-1" />
                  <span className="text-[#00e5ff]">{playbackSpeed}x</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 text-gray-600">
              <span>{formatDate(timeRange.end)}</span>
              <span className="text-gray-700">NOW</span>
            </div>
          </div>
        </div>

        {/* Event count at current time */}
        <div className="flex items-center justify-center gap-4 text-[8px] font-mono">
          {['critical', 'high', 'medium', 'low'].map(severity => {
            const count = events.filter(e => {
              const timestamp = new Date(e.timestamp || e.occurred_at || e.created_date).getTime();
              return timestamp <= currentTime && e.severity === severity;
            }).length;
            
            if (count === 0) return null;
            
            const colors = {
              critical: '#ff1744',
              high: '#ff6d00',
              medium: '#ffd600',
              low: '#00e676'
            };
            
            return (
              <div key={severity} className="flex items-center gap-1.5">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ background: colors[severity], boxShadow: `0 0 4px ${colors[severity]}` }}
                />
                <span className="text-gray-600">{severity.toUpperCase()}</span>
                <span style={{ color: colors[severity] }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
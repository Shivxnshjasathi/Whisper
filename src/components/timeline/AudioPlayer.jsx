import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

export default function AudioPlayer({ src }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback((e) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
    setCurrentTime(audio.currentTime);
  }, []);

  const formatTime = (secs) => {
    if (!isFinite(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-accent-400 to-pink-500 flex items-center justify-center shadow-lg shadow-accent-500/20 hover:shadow-accent-500/30 active:scale-95 transition-all"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 text-white" fill="white" />
        ) : (
          <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        {/* Waveform visualization (CSS-based) */}
        <div className="flex items-center gap-0.5 h-6 mb-1">
          {Array.from({ length: 30 }).map((_, i) => {
            const barProgress = (i / 30) * 100;
            const isActive = barProgress <= progress;
            const height = getBarHeight(i);
            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-colors duration-150 ${
                  isActive ? 'bg-accent-400' : 'bg-white/10'
                }`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>

        {/* Hidden range input for seeking */}
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="audio-progress w-full opacity-0 h-1 absolute"
          style={{ marginTop: '-28px' }}
        />

        {/* Time display */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/30 font-medium">
            {formatTime(currentTime)}
          </span>
          <div className="flex items-center gap-1">
            <Mic className="w-2.5 h-2.5 text-white/20" />
            <span className="text-[10px] text-white/30 font-medium">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Generate pseudo-random bar heights for the waveform visualization.
 * Uses a deterministic pattern so it looks consistent.
 */
function getBarHeight(index) {
  const pattern = [30, 50, 70, 45, 80, 35, 65, 90, 40, 55, 75, 60, 85, 45, 70, 50, 95, 35, 60, 80, 45, 70, 55, 85, 40, 65, 50, 75, 60, 90];
  return pattern[index % pattern.length];
}

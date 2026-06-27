import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { Mic, Square, X, Play, Pause, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function VoiceRecorder({ onRecorded, recordedBlob, onClear }) {
  const {
    isRecording,
    formattedDuration,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    clearRecording,
  } = useVoiceRecorder();

  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewAudioRef = useRef(null);

  // When recording completes, pass the blob up
  useEffect(() => {
    if (audioBlob && !isRecording) {
      onRecorded?.(audioBlob, audioUrl);
    }
  }, [audioBlob, isRecording]);

  const togglePreview = () => {
    const audio = previewAudioRef.current;
    if (!audio) return;

    if (isPreviewPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPreviewPlaying(!isPreviewPlaying);
  };

  const handleClear = () => {
    clearRecording();
    onClear?.();
  };

  // Show recorded preview
  const previewUrl = audioUrl || (recordedBlob ? URL.createObjectURL(recordedBlob) : null);

  if (previewUrl && !isRecording) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 animate-scale-in">
        <audio
          ref={previewAudioRef}
          src={previewUrl}
          onEnded={() => setIsPreviewPlaying(false)}
        />

        <button
          type="button"
          onClick={togglePreview}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/20 active:scale-95 transition-transform"
        >
          {isPreviewPlaying ? (
            <Pause className="w-3.5 h-3.5 text-white" fill="white" />
          ) : (
            <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" />
          )}
        </button>

        <div className="flex-1">
          <div className="text-xs text-white/60 font-medium">Voice note recorded</div>
          <div className="text-[10px] text-white/30">Tap to preview</div>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Recording state
  if (isRecording) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10 animate-scale-in">
        {/* Pulsing indicator */}
        <div className="relative">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse-soft" />
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500/50 animate-ping" />
        </div>

        <div className="flex-1">
          <div className="text-sm font-medium text-white">Recording...</div>
          <div className="text-xs text-red-400 font-mono">{formattedDuration}</div>
        </div>

        <button
          type="button"
          onClick={cancelRecording}
          className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={stopRecording}
          className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 active:scale-95 transition-transform"
          title="Stop recording"
        >
          <Square className="w-4 h-4 text-white" fill="white" />
        </button>
      </div>
    );
  }

  // Default: record button
  return (
    <div>
      {error && (
        <p className="text-xs text-red-400 mb-2">{error}</p>
      )}
      <button
        type="button"
        onClick={startRecording}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/40 hover:text-white/60 hover:bg-white/5 transition-all text-sm"
      >
        <Mic className="w-4 h-4" />
        Voice Note
      </button>
    </div>
  );
}

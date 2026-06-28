import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Send, ArrowLeft, Sparkles, X, ImagePlus, Mic, Check, Palette, MapPin } from 'lucide-react';
import { useCreateEntry, useUpdateEntry } from '../../hooks/useEntries';
import { supabase } from '../../lib/supabase';
import RichTextEditor from './RichTextEditor';
import PhotoPicker from './PhotoPicker';
import VoiceRecorder from './VoiceRecorder';
import DoodleCanvas from './DoodleCanvas';
import Button from '../ui/Button';

const MOODS = [
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'love', emoji: '❤️', label: 'Love' },
  { value: 'excited', emoji: '🎉', label: 'Excited' },
  { value: 'peaceful', emoji: '☮️', label: 'Peaceful' },
  { value: 'grateful', emoji: '🙏', label: 'Grateful' },
  { value: 'thoughtful', emoji: '🤔', label: 'Thinking' },
  { value: 'silly', emoji: '🤪', label: 'Silly' },
  { value: 'sad', emoji: '😢', label: 'Sad' },
  { value: 'tired', emoji: '😴', label: 'Tired' },
];

export default function EntryComposer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();

  const [contentHtml, setContentHtml] = useState('');
  const [photos, setPhotos] = useState([]);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [mood, setMood] = useState(null);

  const [locationLat, setLocationLat] = useState(null);
  const [locationLng, setLocationLng] = useState(null);
  const [locationName, setLocationName] = useState(null);
  const [weatherCondition, setWeatherCondition] = useState(null);
  const [weatherTemp, setWeatherTemp] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingEdit, setIsFetchingEdit] = useState(!!editId);
  const [showDoodle, setShowDoodle] = useState(false);

  useEffect(() => {
    if (editId) {
      supabase.from('entries').select('*').eq('id', editId).single().then(({ data }) => {
        if (data) {
          setContentHtml(data.content_html || '');
          setMood(data.mood || null);
        }
        setIsFetchingEdit(false);
      });
    }
  }, [editId]);

  const hasContent = contentHtml.replace(/<[^>]*>/g, '').trim().length > 0
    || photos.length > 0
    || voiceBlob;

  const handleAddPhotos = useCallback((files) => {
    setPhotos((prev) => [...prev, ...files]);
  }, []);

  const handleRemovePhoto = useCallback((index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleVoiceRecorded = useCallback((blob, url, transcript) => {
    setVoiceBlob(blob);
    if (transcript) setVoiceTranscript(transcript);
  }, []);

  const handleClearVoice = useCallback(() => {
    setVoiceBlob(null);
    setVoiceTranscript('');
  }, []);

  const handleLocate = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setLocationLat(lat);
      setLocationLng(lng);
      setLocationName(`${lat.toFixed(2)}, ${lng.toFixed(2)}`); // Simplified

      try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
        const weatherData = await weatherRes.json();
        if (weatherData && weatherData.current_weather) {
          setWeatherTemp(weatherData.current_weather.temperature);
          setWeatherCondition(weatherData.current_weather.weathercode.toString()); // Could map to string
        }
      } catch (err) {
        console.error("Failed to fetch weather", err);
      }

      setIsLocating(false);
    }, (error) => {
      console.error(error);
      alert('Unable to retrieve your location');
      setIsLocating(false);
    });
  };

  const handleSave = async () => {
    if (!hasContent || isSaving) return;
    setIsSaving(true);

    try {
      if (editId) {
        await updateEntry.mutateAsync({
          entryId: editId,
          contentHtml,
          mood,
        });
      } else {
        await createEntry.mutateAsync({
          contentHtml,
          mediaFiles: photos,
          voiceBlob,
          mood,
          locationLat,
          locationLng,
          locationName,
          weatherCondition,
          weatherTemp,
          voiceTranscript
        });
      }
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Failed to save entry:', err);
      if (!navigator.onLine) {
        navigate('/', { replace: true });
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetchingEdit) {
    return <div className="flex-1 flex items-center justify-center p-8"><div className="w-6 h-6 border-2 border-white/10 border-t-accent-400 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col h-full animate-fade-in w-full max-w-3xl mx-auto md:my-6 md:h-[calc(100vh-3rem)] md:bg-plum-950/40 md:backdrop-blur-xl md:border md:border-white/[0.04] md:rounded-3xl md:shadow-2xl overflow-hidden">

      {/* Mood picker */}
      <div className="px-4 py-3 border-b border-white/[0.03]">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          <span className="flex-shrink-0 text-[11px] text-white/15 font-medium uppercase tracking-wider mr-1">
            Mood
          </span>
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMood(mood === m.value ? null : m.value)}
              className={`
                flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] transition-all duration-200
                ${mood === m.value
                  ? 'bg-accent-500/15 border border-accent-500/20 text-accent-300 scale-105 shadow-lg shadow-accent-500/10'
                  : 'bg-white/[0.03] border border-white/[0.04] text-white/30 hover:bg-white/[0.06] active:scale-95'
                }
              `}
            >
              <span className="text-sm">{m.emoji}</span>
              <span className="font-medium">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 px-5 py-5 overflow-y-auto custom-scrollbar">
        <RichTextEditor
          value={contentHtml}
          onChange={setContentHtml}
          placeholder="What's on your mind? ✨"
        />
      </div>

      {/* Photo previews */}
      {photos.length > 0 && (
        <div className="px-4 pb-3">
          <PhotoPicker
            photos={photos}
            onAdd={handleAddPhotos}
            onRemove={handleRemovePhoto}
          />
        </div>
      )}

      {/* Voice note preview */}
      {voiceBlob && (
        <div className="px-4 pb-3">
          <VoiceRecorder
            onRecorded={handleVoiceRecorded}
            recordedBlob={voiceBlob}
            onClear={handleClearVoice}
          />
        </div>
      )}

      {/* Doodle Canvas Modal */}
      {showDoodle && (
        <DoodleCanvas
          onClose={() => setShowDoodle(false)}
          onSave={(file) => {
            handleAddPhotos([file]);
            setShowDoodle(false);
          }}
        />
      )}

      {/* Bottom toolbar */}
      <div className="border-t border-white/[0.04] bg-plum-950/40 md:bg-transparent px-4 pt-3 pb-[calc(12px+68px+env(safe-area-inset-bottom))] md:pb-3 md:safe-bottom shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Add photo (hidden in edit mode) */}
            {!editId && (
              <label className="w-10 h-10 rounded-xl flex items-center justify-center text-white/25 hover:text-accent-400/70 hover:bg-accent-400/5 transition-all cursor-pointer active:scale-90">
                <ImagePlus className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) handleAddPhotos(files);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>
            )}

            {/* Voice note (only show if no voice already recorded, hidden in edit mode) */}
            {!editId && !voiceBlob && (
              <VoiceRecorderButton
                onRecorded={handleVoiceRecorded}
              />
            )}

            {/* Doodle (hidden in edit mode) */}
            {!editId && (
              <button
                type="button"
                onClick={() => setShowDoodle(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white/50 bg-white/5 hover:text-accent-400/90 hover:bg-accent-400/10 transition-all cursor-pointer active:scale-90"
              >
                <Palette className="w-4 h-4" />
                <span className="text-xs font-medium">Doodle</span>
              </button>
            )}

            {/* Location (hidden in edit mode) */}
            {!editId && (
              <button
                type="button"
                onClick={handleLocate}
                disabled={isLocating}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-90 ${locationLat ? 'text-accent-400 bg-accent-400/10' : 'text-white/50 bg-white/5 hover:text-accent-400/90 hover:bg-accent-400/10'}`}
              >
                <MapPin className={`w-4 h-4 ${isLocating ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-medium">{locationName ? 'Located' : 'Location'}</span>
              </button>
            )}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {!navigator.onLine && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/8 border border-amber-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
                <span className="text-[10px] font-medium text-amber-400/60 uppercase tracking-wider">Offline</span>
              </div>
            )}

            <Button
              size="sm"
              disabled={!hasContent}
              loading={isSaving}
              onClick={handleSave}
              className="!rounded-xl shadow-lg shadow-accent-500/20 active:scale-95"
            >
              {editId ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {editId ? 'Save' : (!navigator.onLine ? 'Queue' : 'Share')}
            </Button>
          </div>
        </div>
      </div>


    </div>
  );
}

function VoiceRecorderButton({ onRecorded }) {
  const [showRecorder, setShowRecorder] = useState(false);

  if (showRecorder) {
    return (
      <div className="flex-1 ml-2 animate-scale-in">
        <VoiceRecorder
          onRecorded={(blob, url, transcript) => {
            onRecorded(blob, url, transcript);
            setShowRecorder(false);
          }}
          onClear={() => setShowRecorder(false)}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowRecorder(true)}
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white/25 hover:text-accent-400/70 hover:bg-accent-400/5 transition-all active:scale-90"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
}

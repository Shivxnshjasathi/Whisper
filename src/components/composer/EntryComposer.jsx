import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Send, ArrowLeft, Sparkles, X, ImagePlus, Mic, Check } from 'lucide-react';
import { useCreateEntry, useUpdateEntry } from '../../hooks/useEntries';
import { supabase } from '../../lib/supabase';
import RichTextEditor from './RichTextEditor';
import PhotoPicker from './PhotoPicker';
import VoiceRecorder from './VoiceRecorder';
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
  const [mood, setMood] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingEdit, setIsFetchingEdit] = useState(!!editId);

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

  const handleVoiceRecorded = useCallback((blob) => {
    setVoiceBlob(blob);
  }, []);

  const handleClearVoice = useCallback(() => {
    setVoiceBlob(null);
  }, []);

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
    return <div className="flex-1 flex items-center justify-center p-8"><div className="w-6 h-6 border-2 border-white/10 border-t-rose-400 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col min-h-[100dvh] md:min-h-0 animate-fade-in w-full max-w-3xl mx-auto md:my-6 md:bg-plum-950/40 md:backdrop-blur-xl md:border md:border-white/[0.04] md:rounded-3xl md:shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all active:scale-90"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span className="text-[13px] font-semibold text-white/40 tracking-wide uppercase">
          {editId ? 'Edit Whisper' : 'New Whisper'}
        </span>

        <Button
          size="sm"
          disabled={!hasContent}
          loading={isSaving}
          onClick={handleSave}
          className="!rounded-xl !px-5"
        >
          {editId ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
          {editId ? 'Save' : (!navigator.onLine ? 'Queue' : 'Share')}
        </Button>
      </div>

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
                  ? 'bg-rose-500/15 border border-rose-500/20 text-rose-300 scale-105 shadow-lg shadow-rose-500/10'
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
      <div className="flex-1 px-5 py-5">
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

      {/* Bottom toolbar */}
      <div className="border-t border-white/[0.04] px-4 pt-3 pb-[calc(12px+68px+env(safe-area-inset-bottom))] md:pb-3 md:safe-bottom">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Add photo (hidden in edit mode) */}
            {!editId && (
              <label className="w-10 h-10 rounded-xl flex items-center justify-center text-white/25 hover:text-rose-400/70 hover:bg-rose-400/5 transition-all cursor-pointer active:scale-90">
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
          </div>

          {/* Offline notice */}
          {!navigator.onLine && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/8 border border-amber-500/10">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
              <span className="text-[10px] font-medium text-amber-400/60 uppercase tracking-wider">Offline</span>
            </div>
          )}
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
          onRecorded={(blob) => {
            onRecorded(blob);
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
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white/25 hover:text-rose-400/70 hover:bg-rose-400/5 transition-all active:scale-90"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
}

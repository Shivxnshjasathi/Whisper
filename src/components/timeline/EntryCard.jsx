import Avatar from '../ui/Avatar';
import ImageGrid from './ImageGrid';
import AudioPlayer from './AudioPlayer';
import Reactions from './Reactions';
import { CloudOff, MoreHorizontal, Edit2, Trash2, MapPin, CloudSun, Quote, Volume2, VolumeX, MessageCircle } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDeleteEntry } from '../../hooks/useEntries';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

export default function EntryCard({ entry, isDetailView = false }) {
  const {
    id,
    content_html,
    media_urls = [],
    voice_note_url,
    mood,
    location_name,
    weather_temp,
    weather_condition,
    voice_transcript,
    created_at,
    isPending,
    author_id,
  } = entry;

  const { user } = useAuth();
  const navigate = useNavigate();
  const deleteMutation = useDeleteEntry();
  const [showMenu, setShowMenu] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const menuRef = useRef(null);
  
  const isAuthor = user?.id === author_id && !isPending;
  const authorName = entry.authorName || (user?.id === author_id ? 'You' : 'Partner');
  const timeString = formatTime(created_at);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEdit = () => {
    setShowMenu(false);
    navigate(`/compose?edit=${id}`);
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (window.confirm('Are you sure you want to delete this whisper?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleTTS = useCallback((e) => {
    e.stopPropagation();
    if (isPlayingTTS) {
      window.speechSynthesis.cancel();
      setIsPlayingTTS(false);
    } else {
      const plainText = (content_html || '').replace(/<[^>]*>?/gm, '');
      if (!plainText.trim()) return;
      
      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.onend = () => setIsPlayingTTS(false);
      utterance.onerror = () => setIsPlayingTTS(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingTTS(true);
    }
  }, [content_html, isPlayingTTS]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const getMoodStyles = (mood) => {
    switch (mood) {
      case 'happy': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100';
      case 'love': return 'bg-accent-500/10 border-accent-500/20 text-accent-100';
      case 'excited': return 'bg-amber-500/10 border-amber-500/20 text-amber-100';
      case 'peaceful': return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-100';
      case 'grateful': return 'bg-teal-500/10 border-teal-500/20 text-teal-100';
      case 'thoughtful': return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-100';
      case 'silly': return 'bg-purple-500/10 border-purple-500/20 text-purple-100';
      case 'sad': return 'bg-blue-500/10 border-blue-500/20 text-blue-100';
      case 'tired': return 'bg-slate-500/10 border-slate-500/20 text-slate-100';
      default: return 'glass-card text-white/90';
    }
  };

  const cardStyle = mood ? getMoodStyles(mood) : 'glass-card text-white/90';
  const cardClasses = mood 
    ? `${cardStyle} rounded-[24px] border transition-all duration-300 hover:brightness-110`
    : `glass-card rounded-[24px] transition-all duration-300 hover:bg-white/[0.05]`;

  return (
    <article className={cardClasses}>
      {/* Pending sync indicator bar */}
      {isPending && (
        <div className="h-0.5 bg-gradient-to-r from-amber-400/30 via-amber-400/50 to-amber-400/30 animate-shimmer rounded-t-[24px]" />
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {mood ? (
              <>
                <span className="text-sm" title={mood}>{getMoodEmoji(mood)}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {mood}
                </span>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <Avatar name={authorName} size="sm" className="!w-5 !h-5 !text-[9px]" />
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {authorName}
                </span>
              </div>
            )}
            
            <span className="text-[10px] opacity-40">•</span>
            <span className="text-[10px] font-medium opacity-50">{timeString}</span>

            {isPending && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/10 ml-1 border border-amber-500/20">
                <CloudOff className="w-2.5 h-2.5 text-amber-400/70" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* TTS Button */}
            {content_html && (
              <button 
                onClick={handleTTS}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/0 hover:bg-white/5 active:bg-white/10 transition-colors"
                title={isPlayingTTS ? "Stop reading" : "Read aloud"}
              >
                {isPlayingTTS ? (
                  <VolumeX className="w-4 h-4 text-accent-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white/40 hover:text-white/70" />
                )}
              </button>
            )}

            {/* Action Menu */}
            {isAuthor && (
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/0 hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <MoreHorizontal className="w-5 h-5 text-white/40" />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-40 bg-slate-900 p-1.5 z-20 shadow-xl border border-white/10 origin-top-right rounded-2xl"
                  >
                    <button 
                      onClick={handleEdit}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-white/70 hover:bg-white/10 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-emerald-400" />
                      Edit
                    </button>
                    <button 
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-white/70 hover:bg-accent-500/10 hover:text-accent-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-accent-400" />
                      Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          </div>
        </div>

        {/* Content */}
        {content_html && (
          <div
            onClick={() => {
              if (!isDetailView) navigate(`/entry/${id}`, { state: { entry } });
            }}
            className={`entry-content mb-4 transition-all duration-300 ${!isDetailView ? 'cursor-pointer line-clamp-4 hover:opacity-80' : ''}`}
            dangerouslySetInnerHTML={{ __html: content_html }}
          />
        )}

        {/* Images */}
        {media_urls.length > 0 && (
          <div className="mb-3 -mx-1">
            <ImageGrid urls={media_urls} />
          </div>
        )}

        {/* Voice Note */}
        {voice_note_url && (
          <div className="mt-3">
            <AudioPlayer src={voice_note_url} />
            {voice_transcript && (
              <div className="mt-2 p-3 bg-white/5 rounded-xl border border-white/5 flex items-start gap-2">
                <Quote className="w-3.5 h-3.5 text-white/30 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white/60 italic leading-relaxed">{voice_transcript}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer: Location, Weather, Reactions */}
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
          {/* Location & Weather */}
          <div className="flex flex-wrap items-center gap-3">
            {location_name && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] text-white/40">
                <MapPin className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-wider">{location_name.split(',')[0]}</span>
              </div>
            )}
            {weather_condition && weather_temp && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] text-white/40">
                <CloudSun className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-wider">{Math.round(weather_temp)}°</span>
              </div>
            )}
          </div>

          {/* Reactions & Comments */}
          {!isPending && (
            <div className="flex items-center justify-end flex-1 gap-1">
              <Reactions entryId={id} />
              
              {!isDetailView && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/entry/${id}`, { state: { entry } });
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors ml-1"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getMoodEmoji(mood) {
  const moods = {
    happy: '😊', love: '❤️', excited: '🎉', peaceful: '☮️',
    grateful: '🙏', thoughtful: '🤔', silly: '🤪', sad: '😢', tired: '😴',
  };
  return moods[mood] || '✨';
}

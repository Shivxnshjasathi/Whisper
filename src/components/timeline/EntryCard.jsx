import Avatar from '../ui/Avatar';
import ImageGrid from './ImageGrid';
import AudioPlayer from './AudioPlayer';
import { CloudOff, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDeleteEntry } from '../../hooks/useEntries';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

export default function EntryCard({ entry }) {
  const {
    id,
    content_html,
    media_urls = [],
    voice_note_url,
    mood,
    created_at,
    isPending,
    author_id,
  } = entry;

  const { user } = useAuth();
  const navigate = useNavigate();
  const deleteMutation = useDeleteEntry();
  const [showMenu, setShowMenu] = useState(false);
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

  return (
    <article className="glass-card overflow-hidden transition-all duration-300 hover:bg-white/[0.05]">
      {/* Pending sync indicator bar */}
      {isPending && (
        <div className="h-0.5 bg-gradient-to-r from-amber-400/30 via-amber-400/50 to-amber-400/30 animate-shimmer" />
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar name={authorName} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[14px] text-white">
                  {authorName}
                </span>
                {mood && (
                  <span className="text-sm" title={mood}>
                    {getMoodEmoji(mood)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-white/20 font-medium">{timeString}</span>
                {isPending && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/8 border border-amber-500/10">
                    <CloudOff className="w-2.5 h-2.5 text-amber-400/70" />
                    <span className="text-[9px] font-semibold text-amber-400/70 uppercase tracking-wider">Queued</span>
                  </span>
                )}
              </div>
            </div>
          </div>

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
                    className="absolute right-0 top-full mt-2 w-40 glass-card p-1.5 z-20 shadow-xl border border-white/10 origin-top-right"
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
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-white/70 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Content */}
        {content_html && (
          <div
            className="entry-content mb-4"
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
          </div>
        )}
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

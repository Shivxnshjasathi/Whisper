import { useReactions, useToggleReaction } from '../../hooks/useEntries';
import { useAuth } from '../../contexts/AuthContext';
import { Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJI_OPTIONS = ['❤️', '😂', '😮', '😢', '🔥', '✨'];

export default function Reactions({ entryId }) {
  const { data: reactions = [] } = useReactions(entryId);
  const toggleReaction = useToggleReaction();
  const { user } = useAuth();
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group reactions by emoji
  const grouped = reactions.reduce((acc, curr) => {
    acc[curr.emoji] = acc[curr.emoji] || [];
    acc[curr.emoji].push(curr);
    return acc;
  }, {});

  const handleToggle = (emoji) => {
    const hasReacted = grouped[emoji]?.some(r => r.user_id === user.id);
    toggleReaction.mutate({ entryId, emoji, hasReacted });
    setShowPicker(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 relative">
      {Object.entries(grouped).map(([emoji, reacts]) => {
        const hasReacted = reacts.some(r => r.user_id === user.id);
        return (
          <button
            key={emoji}
            onClick={() => handleToggle(emoji)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-all ${
              hasReacted ? 'bg-accent-500/20 text-accent-300 border border-accent-500/20' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <span>{emoji}</span>
            <span className="text-[10px] font-medium">{reacts.length}</span>
          </button>
        );
      })}

      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>

        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute left-0 bottom-full mb-2 bg-[#1a1225] border border-white/10 rounded-2xl p-2 shadow-xl flex gap-1 z-20"
            >
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleToggle(emoji)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors text-lg"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

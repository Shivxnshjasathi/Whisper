import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTimeline, usePendingEntries, useRealtimeEntries } from '../../hooks/useEntries';
import EntryCard from './EntryCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import { BookHeart, RefreshCw, PenLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Timeline() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const roomId = profile?.roomId;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useTimeline(roomId);

  const { data: pendingEntries = [] } = usePendingEntries();

  // Subscribe to real-time updates
  useRealtimeEntries(roomId);

  // Infinite scroll observer
  const loadMoreRef = useRef(null);

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const allEntries = data?.pages?.flat() || [];
  const groupedEntries = groupByDate([...pendingEntries, ...allEntries]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5 animate-fade-in">
        <div className="relative">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-rose-400/20 to-violet-500/20 flex items-center justify-center">
            <BookHeart className="w-7 h-7 text-rose-400/50 animate-pulse-soft" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-white/30 text-sm">Loading your whispers...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5 px-8 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center">
          <span className="text-2xl">😢</span>
        </div>
        <p className="text-white/40 text-sm text-center leading-relaxed">
          Something went wrong.
          <br />Pull down to try again.
        </p>
        <button
          onClick={handleRefresh}
          className="text-sm text-rose-400/70 hover:text-rose-400 transition-colors flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-400/5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  if (allEntries.length === 0 && pendingEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-8 animate-fade-in">
        {/* Decorative */}
        <div className="relative">
          <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-rose-400/10 to-violet-500/10 flex items-center justify-center border border-white/[0.04]">
            <BookHeart className="w-10 h-10 text-rose-400/40" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-500/20 flex items-center justify-center border border-white/[0.04] animate-float">
            <span className="text-sm">✨</span>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-xl font-display font-semibold text-white mb-2">
            Your story begins here
          </h3>
          <p className="text-white/30 text-sm max-w-[260px] leading-relaxed">
            Write your first whisper together. Every moment is worth saving.
          </p>
        </div>

        <button
          onClick={() => navigate('/compose')}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-semibold shadow-lg shadow-rose-500/25 active:scale-95 transition-transform"
        >
          <PenLine className="w-4 h-4" />
          Write First Entry
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:py-8 max-w-[1400px] mx-auto w-full">
      {/* Pull to refresh indicator */}
      <button
        onClick={handleRefresh}
        disabled={isRefetching}
        className="w-full flex items-center justify-center gap-2 py-3 mb-2 text-[11px] text-white/20 hover:text-white/35 transition-colors tracking-wide uppercase"
      >
        <RefreshCw className={`w-3 h-3 ${isRefetching ? 'animate-spin' : ''}`} />
        {isRefetching ? 'Refreshing...' : 'Refresh'}
      </button>

      {/* Grouped entries */}
      {Object.entries(groupedEntries).map(([dateLabel, entries]) => (
        <div key={dateLabel} className="mb-8">
          {/* Date separator */}
          <div className="flex items-center gap-4 mb-5 px-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <span className="text-[11px] font-semibold text-white/20 uppercase tracking-[0.15em]">
              {dateLabel}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          </div>

          {/* Entry cards - Masonry Grid */}
          <div className="columns-1 md:columns-2 xl:columns-3 gap-5">
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className="animate-slide-up break-inside-avoid mb-5"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
              >
                <EntryCard entry={entry} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Load more trigger */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="py-10 flex justify-center">
          {isFetchingNextPage && <LoadingSpinner size="md" />}
        </div>
      )}

      {/* End of timeline */}
      {!hasNextPage && allEntries.length > 5 && (
        <div className="py-8 text-center">
          <p className="text-[11px] text-white/10 tracking-wider uppercase">
            That's everything ✨
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Group entries by date label (Today, Yesterday, or date string).
 */
function groupByDate(entries) {
  const groups = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const entry of entries) {
    const entryDate = new Date(entry.created_at);
    const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());

    let label;
    if (entryDay.getTime() === today.getTime()) {
      label = 'Today';
    } else if (entryDay.getTime() === yesterday.getTime()) {
      label = 'Yesterday';
    } else {
      label = entryDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(entry);
  }

  return groups;
}

import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Activity, CalendarHeart } from 'lucide-react';
import EntryCard from '../components/timeline/EntryCard';
import { usePendingEntries } from '../hooks/useEntries';

function getMoodColor(mood) {
  switch (mood) {
    case 'happy': return 'bg-emerald-400 shadow-emerald-400/50';
    case 'love': return 'bg-accent-400 shadow-accent-400/50';
    case 'excited': return 'bg-amber-400 shadow-amber-400/50';
    case 'peaceful': return 'bg-cyan-400 shadow-cyan-400/50';
    case 'grateful': return 'bg-teal-400 shadow-teal-400/50';
    case 'thoughtful': return 'bg-indigo-400 shadow-indigo-400/50';
    case 'silly': return 'bg-purple-400 shadow-purple-400/50';
    case 'sad': return 'bg-blue-400 shadow-blue-400/50';
    case 'tired': return 'bg-slate-400 shadow-slate-400/50';
    default: return 'bg-accent-400 shadow-accent-400/50';
  }
}

export default function CalendarView() {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Generate days
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday

  const queryStart = new Date(startDate);
  queryStart.setHours(0, 0, 0, 0);
  const queryEnd = new Date(endDate);
  queryEnd.setHours(23, 59, 59, 999);

  // Fetch entries for the current calendar grid
  const { data: fetchedEntries = [] } = useQuery({
    queryKey: ['calendar', profile?.roomId, queryStart.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('room_id', profile?.roomId)
        .gte('created_at', queryStart.toISOString())
        .lte('created_at', queryEnd.toISOString());
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.roomId,
  });

  // Include offline pending entries
  const { data: pendingEntries = [] } = usePendingEntries();
  const entries = [...pendingEntries, ...fetchedEntries];

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const days = [];
  let d = new Date(startDate);
  while (d <= endDate) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Monthly stats
  const totalEntries = entries.length;
  const moodCounts = entries.reduce((acc, e) => {
    if (e.mood) acc[e.mood] = (acc[e.mood] || 0) + 1;
    return acc;
  }, {});
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Selected day entries
  const selectedEntries = selectedDate 
    ? entries.filter(e => {
        const eDate = new Date(e.created_at);
        return eDate.getDate() === selectedDate.getDate() && 
               eDate.getMonth() === selectedDate.getMonth() && 
               eDate.getFullYear() === selectedDate.getFullYear();
      })
    : [];

  return (
    <div className="px-4 py-6 md:py-8 max-w-2xl mx-auto w-full animate-fade-in">
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 text-white/50 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-display font-semibold text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={nextMonth} className="p-2 text-white/50 hover:text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-[10px] font-semibold text-white/30 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const dayEntries = entries.filter(e => {
              const eDate = new Date(e.created_at);
              return eDate.getDate() === day.getDate() && eDate.getMonth() === day.getMonth() && eDate.getFullYear() === day.getFullYear();
            });
            const hasEntry = dayEntries.length > 0;
            const mood = hasEntry ? dayEntries[0].mood : null; 
            
            const isToday = day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth() && day.getFullYear() === new Date().getFullYear();
            const isSelected = selectedDate && day.getDate() === selectedDate.getDate() && day.getMonth() === selectedDate.getMonth() && day.getFullYear() === selectedDate.getFullYear();

            return (
              <button 
                key={day.toISOString()} 
                onClick={() => setSelectedDate(new Date(day))}
                className={`
                  aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-200
                  ${!isCurrentMonth ? 'opacity-30' : 'hover:bg-white/10'}
                  ${isSelected ? 'bg-white/15 ring-2 ring-accent-400 ring-offset-2 ring-offset-plum-950 scale-105 z-10' : ''}
                  ${isToday && !isSelected ? 'bg-white/5 ring-1 ring-white/20' : ''}
                `}
              >
                <span className={`text-[13px] font-medium ${isToday || isSelected ? 'text-white' : 'text-white/70'}`}>
                  {day.getDate()}
                </span>
                
                {/* Dots for entries */}
                {hasEntry && (
                  <div className="absolute bottom-1.5 flex gap-0.5">
                    {dayEntries.slice(0, 3).map((e, i) => (
                      <div 
                        key={e.id || i} 
                        className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${getMoodColor(e.mood)}`} 
                      />
                    ))}
                    {dayEntries.length > 3 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Month Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center text-accent-400">
            <CalendarHeart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-white">{totalEntries}</p>
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Entries</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-display font-bold text-white capitalize">{topMood || 'None'}</p>
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Top Mood</p>
          </div>
        </div>
      </div>

      {/* Selected Day Entries */}
      {selectedDate && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-4 mb-6 px-1">
            <span className="text-sm font-bold text-white/80 uppercase tracking-wider">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          
          <div className="space-y-4">
            {selectedEntries.length > 0 ? (
              selectedEntries.map(entry => (
                <EntryCard key={entry.id} entry={entry} />
              ))
            ) : (
              <div className="text-center py-10 glass-card">
                <p className="text-white/40 text-sm">No entries on this day.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

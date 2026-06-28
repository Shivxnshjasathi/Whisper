import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../ui/Avatar';
import { WifiOff, Calendar, Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePendingEntries } from '../../hooks/useEntries';

export default function AppShell() {
  const { profile } = useAuth();
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const { data: pendingEntries = [] } = usePendingEntries();
  const pendingCount = pendingEntries.length;

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Hide mobile header on desktop, or inside compose view on mobile (if preferred, but keeping it for now)
  const isCompose = location.pathname.includes('compose');

  return (
    <div className="flex min-h-dvh app-bg w-full overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-dvh overflow-hidden relative">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="md:hidden sticky top-0 z-40 backdrop-blur-2xl bg-plum-950/60 border-b border-white/[0.04]">
          <div className="safe-top" />
          <div className="flex items-center justify-between px-5 h-[56px]">
            {!isSearchExpanded ? (
              <>
                <div className="flex items-center gap-3">
                  <h1 className="text-[22px] font-display font-semibold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    Whisper
                  </h1>

                  {/* Offline badge */}
                  {!isOnline && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/15 animate-scale-in">
                      <WifiOff className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Offline</span>
                    </div>
                  )}

                  {/* Pending sync badge */}
                  {pendingCount > 0 && isOnline && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/15 animate-scale-in">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse-soft" />
                      <span className="text-[10px] font-medium text-violet-400">Syncing {pendingCount}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsSearchExpanded(true)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                  
                  <Link 
                    to="/calendar"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
                  >
                    <Calendar className="w-5 h-5" />
                  </Link>
                  
                  {/* Online dot */}
                  {isOnline && (
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" />
                  )}
                  <Link to="/settings" className="rounded-full overflow-hidden transition-transform active:scale-95">
                    <Avatar name={profile?.displayName} size="sm" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 w-full animate-fade-in">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-white/30" />
                  </div>
                  <input
                    type="text"
                    autoFocus
                    className="block w-full pl-10 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-accent-400 focus:border-accent-400 text-sm transition-all"
                    placeholder="Search whispers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => {
                    setIsSearchExpanded(false);
                    setSearchTerm('');
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto w-full">
          <Outlet context={{ isSearchExpanded, setIsSearchExpanded, searchTerm, setSearchTerm }} />
        </main>

        {/* Mobile Bottom Navigation (Hidden on Desktop) */}
        <BottomNav />
      </div>
    </div>
  );
}

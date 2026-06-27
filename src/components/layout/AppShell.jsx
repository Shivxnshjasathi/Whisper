import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../ui/Avatar';
import { WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getPendingCount } from '../../lib/syncManager';

export default function AppShell() {
  const { profile } = useAuth();
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending count periodically
    const checkPending = async () => {
      const count = await getPendingCount();
      setPendingCount(count);
    };
    checkPending();
    const interval = setInterval(checkPending, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
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
              {/* Online dot */}
              {isOnline && (
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" />
              )}
              <Avatar name={profile?.displayName} size="sm" />
            </div>
          </div>
        </header>

        {/* Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto w-full">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation (Hidden on Desktop) */}
        <BottomNav />
      </div>
    </div>
  );
}

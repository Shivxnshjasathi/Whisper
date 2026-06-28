import { useAuth } from '../contexts/AuthContext';
import { useTheme, THEMES } from '../contexts/ThemeContext';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import { LogOut, Heart, Shield, Smartphone, Wifi, WifiOff, Bell, Download, Palette, FileJson } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getPendingCount, syncPendingEntries } from '../lib/syncManager';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [hasPasscode, setHasPasscode] = useState(!!localStorage.getItem('whisper_pin'));
  const [hasReminders, setHasReminders] = useState(!!localStorage.getItem('whisper_reminders'));
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const loadPending = async () => {
      const count = await getPendingCount();
      setPendingCount(count);
    };
    loadPending();
    const interval = setInterval(loadPending, 5000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    await syncPendingEntries();
    const count = await getPendingCount();
    setPendingCount(count);
    setSyncing(false);
  };

  const handleSignOut = async () => {
    if (pendingCount > 0) {
      const confirmed = window.confirm(
        `You have ${pendingCount} unsynced entries. They'll be lost if you sign out. Continue?`
      );
      if (!confirmed) return;
    }
    await signOut();
  };

  const handleTogglePasscode = () => {
    if (hasPasscode) {
      localStorage.removeItem('whisper_pin');
      setHasPasscode(false);
    } else {
      const pin = window.prompt("Enter a 4-digit PIN to lock your diary:");
      if (pin && pin.length === 4 && /^\d+$/.test(pin)) {
        localStorage.setItem('whisper_pin', pin);
        setHasPasscode(true);
      } else if (pin) {
        alert("Invalid PIN. Must be exactly 4 digits.");
      }
    }
  };

  const handleToggleReminders = async () => {
    if (hasReminders) {
      localStorage.removeItem('whisper_reminders');
      setHasReminders(false);
    } else {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          localStorage.setItem('whisper_reminders', 'true');
          setHasReminders(true);
          alert('Reminders enabled! You will be reminded daily.');
          // In a full implementation, you would register a Service Worker here to handle push events,
          // or set up a local recurring notification if the browser supports it.
        } else {
          alert('Notification permission denied.');
        }
      } else {
        alert('Your browser does not support notifications.');
      }
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const dataStr = JSON.stringify(data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'whisper_diary_export.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="px-5 py-6 animate-fade-in max-w-lg mx-auto">
      {/* Profile card */}
      <div className="glass-card p-8 mb-6 text-center relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-accent-500/5 to-transparent" />

        <div className="relative">
          <Avatar name={profile?.displayName} size="xl" className="mx-auto mb-5" />
          <h2 className="text-2xl font-display font-semibold text-white mb-1">
            {profile?.displayName}
          </h2>
          <p className="text-[13px] text-white/30 mb-4">{user?.email}</p>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <Heart className="w-3.5 h-3.5 text-accent-400" fill="currentColor" />
            <span className="text-[12px] text-white/30 font-medium">{profile?.roomName}</span>
          </div>
        </div>
      </div>

      {/* Diary Info / Invite Code */}
      <div className="mb-6">
        <h3 className="text-[11px] font-semibold text-white/15 uppercase tracking-[0.15em] px-1 mb-3">
          Your Diary
        </h3>
        <div 
          className="glass-card p-4 flex items-center justify-between group cursor-pointer hover:bg-white/[0.05] transition-colors"
          onClick={() => {
            navigator.clipboard.writeText(profile?.roomId);
            alert('Invite code copied!');
          }}
        >
          <div>
            <span className="text-[11px] font-semibold text-white/30 uppercase tracking-widest block mb-1">Invite Code</span>
            <span className="text-[14px] font-mono text-emerald-300 font-semibold">{profile?.roomId?.split('-')[0]}...</span>
          </div>
          <div className="text-[11px] text-white/20 group-hover:text-emerald-400 transition-colors">
            Tap to copy
          </div>
        </div>
      </div>

      {/* Status cards */}
      <div className="space-y-3 mb-6">
        <h3 className="text-[11px] font-semibold text-white/15 uppercase tracking-[0.15em] px-1 mb-3">
          Status
        </h3>

        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Wifi className="w-4 h-4 text-emerald-400" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <WifiOff className="w-4 h-4 text-amber-400" />
              </div>
            )}
            <span className="text-[14px] text-white/60">Connection</span>
          </div>
          <span className={`text-[12px] font-semibold ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${pendingCount > 0 ? 'bg-amber-500/10' : 'bg-white/[0.04]'}`}>
              <Smartphone className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <span className="text-[14px] text-white/60 block">Pending Entries</span>
              {pendingCount > 0 && (
                <span className="text-[11px] text-white/20">Will sync when online</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[14px] font-semibold ${pendingCount > 0 ? 'text-amber-400' : 'text-white/20'}`}>
              {pendingCount}
            </span>
            {pendingCount > 0 && isOnline && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="text-[11px] text-accent-400 px-2 py-1 rounded-lg bg-accent-400/5 hover:bg-accent-400/10 transition-colors"
              >
                {syncing ? 'Syncing...' : 'Sync'}
              </button>
            )}
          </div>
        </div>

        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-500/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-accent-400" />
            </div>
            <div>
              <span className="text-[14px] text-white/60 block">Passcode Lock</span>
              <span className="text-[11px] text-white/20">Require PIN to open app</span>
            </div>
          </div>
          <button
            onClick={handleTogglePasscode}
            className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${hasPasscode ? 'bg-emerald-500' : 'bg-white/10'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${hasPasscode ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Personalization */}
      <div className="space-y-3 mb-6">
        <h3 className="text-[11px] font-semibold text-white/15 uppercase tracking-[0.15em] px-1 mb-3">
          Personalization & Preferences
        </h3>

        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Palette className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <span className="text-[14px] text-white/60 block">Accent Color</span>
              <span className="text-[11px] text-white/20">Choose your theme</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {themes.map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${theme === t ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                style={{ backgroundColor: THEMES[t][500] }}
              />
            ))}
          </div>
        </div>

        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-[14px] text-white/60 block">Daily Reminders</span>
              <span className="text-[11px] text-white/20">Don't forget to write</span>
            </div>
          </div>
          <button
            onClick={handleToggleReminders}
            className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${hasReminders ? 'bg-emerald-500' : 'bg-white/10'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${hasReminders ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

      </div>

      {/* Install */}
      <div className="mb-6">
        <h3 className="text-[11px] font-semibold text-white/15 uppercase tracking-[0.15em] px-1 mb-3">
          App
        </h3>

        <div className="glass-card p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-400/10 to-violet-500/10 flex items-center justify-center flex-shrink-0">
              <Download className="w-4 h-4 text-accent-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-[14px] font-medium text-white/70 mb-1">Install Whisper</h4>
              <p className="text-[12px] text-white/25 leading-relaxed mb-3">
                <span className="text-white/35">iOS:</span> Share → Add to Home Screen
                <br />
                <span className="text-white/35">Android:</span> Menu → Install app
              </p>
              <button
                onClick={() => {
                  if (window.deferredPrompt) {
                    window.deferredPrompt.prompt();
                    window.deferredPrompt.userChoice.then(() => {
                      window.deferredPrompt = null;
                    });
                  } else {
                    alert("The automatic install prompt isn't ready. This usually happens if you're testing on a local network without HTTPS. Please use your browser's menu and select 'Install App' or 'Add to Home screen'.");
                  }
                }}
                className="w-full py-2 bg-accent-500/10 hover:bg-accent-500/20 text-accent-400 rounded-xl text-[13px] font-medium transition-colors"
              >
                Trigger Install Prompt
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <Button
        variant="danger"
        className="w-full !rounded-2xl !py-3.5"
        onClick={handleSignOut}
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </Button>

      {/* Footer */}
      <p className="text-center text-[10px] text-white/8 mt-10 tracking-widest uppercase">
        Whisper v1.0 • Made with ❤️
      </p>
    </div>
  );
}

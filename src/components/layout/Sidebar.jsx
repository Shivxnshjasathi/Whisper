import { NavLink } from 'react-router-dom';
import { Home, PenSquare, Settings, Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../ui/Avatar';

export default function Sidebar() {
  const { profile } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 h-dvh border-r border-white/[0.04] bg-plum-950/40 backdrop-blur-3xl sticky top-0">
      {/* Logo Area */}
      <div className="h-[72px] flex items-center px-6 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-400 to-violet-500 flex items-center justify-center shadow-lg shadow-accent-500/20 rotate-3">
            <Heart className="w-4 h-4 text-white -rotate-3" fill="white" />
          </div>
          <h1 className="text-xl font-display font-semibold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Whisper
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive 
                ? 'bg-white/10 text-white font-medium' 
                : 'text-white/40 hover:bg-white/[0.04] hover:text-white/80'
            }`
          }
        >
          <Home className="w-5 h-5" />
          Timeline
        </NavLink>

        <NavLink
          to="/compose"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive 
                ? 'bg-accent-500/20 text-accent-300 font-medium' 
                : 'text-white/40 hover:bg-accent-500/10 hover:text-accent-400/80'
            }`
          }
        >
          <PenSquare className="w-5 h-5" />
          New Whisper
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive 
                ? 'bg-white/10 text-white font-medium' 
                : 'text-white/40 hover:bg-white/[0.04] hover:text-white/80'
            }`
          }
        >
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>
      </nav>

      {/* Profile Area */}
      <div className="p-4 border-t border-white/[0.04]">
        <div className="glass-card p-3 flex items-center gap-3">
          <Avatar name={profile?.displayName} size="sm" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">
              {profile?.displayName}
            </p>
            <p className="text-[11px] text-white/40 truncate">
              {profile?.roomName || 'Your Diary'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

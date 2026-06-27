import { NavLink, useLocation } from 'react-router-dom';
import { BookOpen, PenLine, Settings } from 'lucide-react';

const navItems = [
  { to: '/', icon: BookOpen, label: 'Timeline' },
  { to: '/compose', icon: PenLine, label: 'Write' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();

  // Hide nav on the compose screen to give full screen to the editor

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-plum-950/80 backdrop-blur-xl border-t border-white/[0.04] safe-bottom">
      <div className="flex items-center justify-around h-[68px] max-w-lg mx-auto px-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `
                relative flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-2xl transition-all duration-300
                ${isActive ? 'text-rose-400' : 'text-white/25 active:text-white/40'}
              `}
            >
              {({ isActive }) => (
                <>
                  {/* Active glow backdrop */}
                  {isActive && (
                    <div className="absolute inset-0 bg-rose-400/[0.06] rounded-2xl" />
                  )}

                  <div className={`relative transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                    <Icon
                      className="w-[22px] h-[22px]"
                      strokeWidth={isActive ? 2.2 : 1.5}
                    />
                  </div>
                  <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-rose-400' : ''}`}>
                    {label}
                  </span>

                  {/* Active dot indicator */}
                  {isActive && (
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-400 shadow-lg shadow-rose-400/50" />
                  )}
                </>
              )}
            </NavLink>
          ))}
      </div>
    </nav>
  );
}

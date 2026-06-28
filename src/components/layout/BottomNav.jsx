import { NavLink, useLocation } from 'react-router-dom';
import { BookOpen, PenLine, Settings, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/', icon: BookOpen, label: 'Timeline' },
  { to: '/compose', icon: PenLine, label: 'Write' },
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
                ${isActive ? 'text-accent-400' : 'text-white/25 active:text-white/40'}
              `}
            >
              {({ isActive }) => (
                <>
                  {/* Active glow backdrop sliding animation */}
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-bg"
                      className="absolute inset-0 bg-accent-400/[0.08] rounded-2xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}

                  <motion.div 
                    animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -2 : 0 }}
                    transition={{ type: "spring", bounce: 0.5, duration: 0.5 }}
                    className="relative z-10"
                  >
                    <Icon
                      className="w-[22px] h-[22px]"
                      strokeWidth={isActive ? 2.5 : 1.5}
                    />
                  </motion.div>
                  <span className={`text-[10px] font-semibold tracking-wide z-10 transition-colors duration-300 ${isActive ? 'text-accent-400' : ''}`}>
                    {label}
                  </span>

                  {/* Active dot indicator */}
                  {isActive && (
                    <motion.div 
                      layoutId="bottom-nav-dot"
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent-400 shadow-[0_0_8px_rgba(var(--color-accent-400),0.8)] z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
      </div>
    </nav>
  );
}

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = {
  rose: {
    500: '#ec4899',
    400: '#f472b6',
    300: '#f9a8d4',
  },
  cyberpunk: {
    500: '#d946ef',
    400: '#e879f9',
    300: '#f0abfc',
  },
  matcha: {
    500: '#84cc16',
    400: '#a3e635',
    300: '#bef264',
  },
  midnight: {
    500: '#3b82f6',
    400: '#60a5fa',
    300: '#93c5fd',
  },
  sunset: {
    500: '#f97316',
    400: '#fb923c',
    300: '#fdba74',
  },
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('whisper_theme') || 'rose';
  });

  useEffect(() => {
    const colors = THEMES[theme] || THEMES.rose;
    const root = document.documentElement;
    root.style.setProperty('--accent-500', colors[500]);
    root.style.setProperty('--accent-400', colors[400]);
    root.style.setProperty('--accent-300', colors[300]);
    
    localStorage.setItem('whisper_theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: Object.keys(THEMES) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

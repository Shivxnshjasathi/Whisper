import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useEffect } from 'react';
import { initSyncManager } from './lib/syncManager';
import { AnimatePresence } from 'framer-motion';

import AppShell from './components/layout/AppShell';
import LoginScreen from './components/auth/LoginScreen';
import RoomSetup from './components/auth/RoomSetup';
import LockScreen from './components/auth/LockScreen';
import { FullPageLoader } from './components/ui/LoadingSpinner';
import PageTransition from './components/layout/PageTransition';
import { useState } from 'react';

import Home from './pages/Home';
import Compose from './pages/Compose';
import Settings from './pages/Settings';
import EntryDetail from './pages/EntryDetail';
import CalendarView from './pages/CalendarView';

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: true,
      staleTime: 2 * 60 * 1000,
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<AppShell />}>
          <Route index element={
            <PageTransition><Home /></PageTransition>
          } />
          <Route path="compose" element={
            <PageTransition><Compose /></PageTransition>
          } />
          <Route path="entry/:id" element={
            <PageTransition><EntryDetail /></PageTransition>
          } />
          <Route path="calendar" element={
            <PageTransition><CalendarView /></PageTransition>
          } />
          <Route path="settings" element={
            <PageTransition><Settings /></PageTransition>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function ProtectedRoutes() {
  const { isAuthenticated, hasRoom, loading } = useAuth();
  const [isLocked, setIsLocked] = useState(!!localStorage.getItem('whisper_pin'));

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (localStorage.getItem('whisper_pin')) {
          setIsLocked(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Initialize sync manager
  useEffect(() => {
    if (isAuthenticated && hasRoom) {
      const cleanup = initSyncManager();
      return cleanup;
    }
  }, [isAuthenticated, hasRoom]);

  if (loading) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (!hasRoom) {
    return <RoomSetup />;
  }

  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} />;
  }

  return <AnimatedRoutes />;
}

import { Toaster } from 'react-hot-toast';

export default function App() {
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: 'rgba(15, 23, 42, 0.9)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '99px',
              fontSize: '13px',
              backdropFilter: 'blur(8px)',
            },
          }}
        />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

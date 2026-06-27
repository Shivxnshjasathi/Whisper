import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useEffect } from 'react';
import { initSyncManager } from './lib/syncManager';
import { AnimatePresence } from 'framer-motion';

import AppShell from './components/layout/AppShell';
import LoginScreen from './components/auth/LoginScreen';
import RoomSetup from './components/auth/RoomSetup';
import { FullPageLoader } from './components/ui/LoadingSpinner';
import PageTransition from './components/layout/PageTransition';

import Home from './pages/Home';
import Compose from './pages/Compose';
import Settings from './pages/Settings';

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

  return <AnimatedRoutes />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

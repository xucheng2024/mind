import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ToastProvider from './components/ToastProvider';
import ErrorBoundary from './components/ErrorBoundary';
import PerformanceMonitor from './components/PerformanceMonitor';
import QueryProvider from './components/QueryProvider';
import VersionUpdate from './components/VersionUpdate';
import PWAUpdateNotification from './components/PWAUpdateNotification';
import { OfflineIndicator, BottomTabBar } from './components';

import { validateConfig } from './lib/config';
import HapticFeedback from './components/HapticFeedback';


// Lazy load all pages
const MindPage = lazy(() => import('./pages/MindPage'));
const BrainPage = lazy(() => import('./pages/BrainPage'));


// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

function App() {
  // Validate environment configuration
  React.useEffect(() => {
    if (!validateConfig()) {
      console.error('Environment configuration validation failed');
    }
    
    // Initialize haptic feedback user interaction tracking
    HapticFeedback.initUserInteraction();
  }, []);

  return (
    <>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/mind" element={<MindPage />} />
            <Route path="/brain" element={<BrainPage />} />
            <Route path="/" element={<MindPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <BottomTabBar />
      <PerformanceMonitor />
      <VersionUpdate />
      <PWAUpdateNotification />
      <OfflineIndicator />
    </>
  );
}

export default function RootApp() {
  return (
    <QueryProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </QueryProvider>
  );
}

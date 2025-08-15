import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import InstallPrompt from './components/InstallPrompt';
import ToastProvider from './components/ToastProvider';
import ErrorBoundary from './components/ErrorBoundary';
import PerformanceMonitor from './components/PerformanceMonitor';
import QueryProvider from './components/QueryProvider';
import PWAInstallButton from './components/PWAInstallButton';
import VersionUpdate from './components/VersionUpdate';
import PWAUpdateNotification from './components/PWAUpdateNotification';
import { OfflineIndicator, BottomTabBar } from './components';
import SafariInstallGuide from './components/SafariInstallGuide';

import { RegistrationProvider } from '../context/RegistrationContext';
import { validateConfig } from './lib/config';
import HapticFeedback from './components/HapticFeedback';


// Lazy load all pages
const RegistrationForm = lazy(() => import('./pages/RegistrationForm'));
const MedicalPage = lazy(() => import('./pages/MedicalPage'));
const AuthorizationPage = lazy(() => import('./pages/AuthorizationPage'));
const SelfiePage = lazy(() => import('./pages/SelfiePage'));
const SubmitPage = lazy(() => import('./pages/SubmitPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));

const HomePage = lazy(() => import('./pages/HomePage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const RecordPage = lazy(() => import('./pages/RecordPage'));
const MindPage = lazy(() => import('./pages/MindPage'));
const DietPage = lazy(() => import('./pages/DietPage'));


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

            <Route path="/booking" element={<BookingPage />} />
            <Route path="/booking/slots" element={<CalendarPage />} />
            <Route path="/register" element={<RegistrationForm />} />
            <Route path="/register/medical" element={<MedicalPage />} />
            <Route path="/register/authorize" element={<AuthorizationPage />} />
            <Route path="/register/selfie" element={<SelfiePage />} />
            <Route path="/register/submit" element={<SubmitPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/record" element={<RecordPage />} />
            <Route path="/mind" element={<MindPage />} />
            <Route path="/diet" element={<DietPage />} />
    
            <Route path="/" element={<HomePage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <BottomTabBar />
      <PerformanceMonitor />
      <PWAInstallButton />
      <SafariInstallGuide />
      <VersionUpdate />
      <PWAUpdateNotification />
      <OfflineIndicator />
    </>
  );
}

export default function RootApp() {
  return (
    <QueryProvider>
      <RegistrationProvider>
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
      </RegistrationProvider>
    </QueryProvider>
  );
}

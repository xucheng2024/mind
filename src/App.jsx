import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import InstallPrompt from './components/InstallPrompt';
import ManualInstallGuide from './components/ManualInstallGuide';
import ToastProvider from './components/ToastProvider';
import PWAStatus from './components/PWAStatus';
import ErrorBoundary from './components/ErrorBoundary';
import PerformanceMonitor from './components/PerformanceMonitor';
import QueryProvider from './components/QueryProvider';
import PWAInstallButton from './components/PWAInstallButton';
import VersionUpdate from './components/VersionUpdate';
import PWAUpdateNotification from './components/PWAUpdateNotification';

import { RegistrationProvider } from '../context/RegistrationContext';


// Lazy load all pages
const RegistrationForm = lazy(() => import('./pages/RegistrationForm'));
const MedicalPage = lazy(() => import('./pages/MedicalPage'));
const AuthorizationPage = lazy(() => import('./pages/AuthorizationPage'));
const SelfiePage = lazy(() => import('./pages/SelfiePage'));
const SubmitPage = lazy(() => import('./pages/SubmitPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const CheckInPage = lazy(() => import('./pages/CheckInPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

function App() {
  // Initialize debug system
  React.useEffect(() => {
    console.log('🚀 App initialized');
    console.log('🔧 Debug system ready');
    console.log('📱 Development mode:', process.env.NODE_ENV);
  }, []);

  return (
    <>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/check-in" element={<CheckInPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/booking/slots" element={<CalendarPage />} />
            <Route path="/register" element={<RegistrationForm />} />
            <Route path="/register/medical" element={<MedicalPage />} />
            <Route path="/register/authorize" element={<AuthorizationPage />} />
            <Route path="/register/selfie" element={<SelfiePage />} />
            <Route path="/register/submit" element={<SubmitPage />} />
            <Route path="/" element={<HomePage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <InstallPrompt />
      <ManualInstallGuide />
      <PWAStatus />
      <PerformanceMonitor />
      <PWAInstallButton />
      {/* Temporarily disabled to prevent constant popups */}
      {/* <VersionUpdate /> */}
      {/* <PWAUpdateNotification /> */}

    </>
  );
}

export default function RootApp() {
  return (
    <QueryProvider>
      <RegistrationProvider>
        <BrowserRouter>
          <ToastProvider>
            <App />
          </ToastProvider>
        </BrowserRouter>
      </RegistrationProvider>
    </QueryProvider>
  );
}

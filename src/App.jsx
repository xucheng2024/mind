import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegistrationForm from './pages/RegistrationForm';
import MedicalPage from './pages/MedicalPage';
import AuthorizationPage from './pages/AuthorizationPage';
import SelfiePage from './pages/SelfiePage';
import SubmitPage from './pages/SubmitPage';
import BookingPage from './pages/BookingPage';
import CheckInPage from './pages/CheckInPage';      // 预约页面重命名
import HomePage from './pages/HomePage';
import CalendarPage from './pages/CalendarPage';
import { RegistrationProvider } from '../context/RegistrationContext';

function App() {
  return (
    <Routes>
      <Route path="/check-in" element={<CheckInPage />} />     {/* Check-in 页面 */}
      <Route path="/booking" element={<BookingPage />} />      {/* 预约页面 */}
      <Route path="/booking/slots" element={<CalendarPage />} /> {/* 预约日历页面 */}
      <Route path="/register" element={<RegistrationForm />} />
      <Route path="/register/medical" element={<MedicalPage />} />
      <Route path="/register/authorize" element={<AuthorizationPage />} />
      <Route path="/register/selfie" element={<SelfiePage />} />
      <Route path="/register/submit" element={<SubmitPage />} />
      <Route path="/" element={<HomePage />} />
      {/* 其他路由 */}
    </Routes>
  );
}

export default function RootApp() {
  return (
    <RegistrationProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </RegistrationProvider>
  );
}

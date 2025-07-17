import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegistrationForm from './pages/RegistrationForm';
import MedicalPage from './pages/MedicalPage';
import AuthorizationPage from './pages/AuthorizationPage';
import SelfiePage from './pages/SelfiePage';
import SubmitPage from './pages/SubmitPage';
import { RegistrationProvider } from '../context/RegistrationContext';

function App() {
  return (
    <Routes>
      <Route path="/" element={<div className="text-2xl font-bold text-blue-600">Hello Clinic</div>} />
      <Route path="/register" element={<RegistrationForm />} />
      <Route path="/register/medical" element={<MedicalPage />} />
      <Route path="/register/authorize" element={<AuthorizationPage />} />
      <Route path="/register/selfie" element={<SelfiePage />} />
      <Route path="/register/submit" element={<SubmitPage />} />
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

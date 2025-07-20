import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegistrationForm from './pages/RegistrationForm';
import MedicalPage from './pages/MedicalPage';
import AuthorizationPage from './pages/AuthorizationPage';
import SelfiePage from './pages/SelfiePage';
import SubmitPage from './pages/SubmitPage';
import HomePage from './pages/HomePage';      // 新增
import LoginPage from './pages/LoginPage';    // 修正为邮箱登录页面
import BookPage from './pages/BookPage';      // 新增预约页面
import ProfilePage from './pages/ProfilePage';  // 新增
import { RegistrationProvider } from '../context/RegistrationContext';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />                {/* 首页选择注册/登录 */}
      <Route path="/login" element={<LoginPage />} />          {/* 邮箱登录页面 */}
      <Route path="/booking" element={<BookPage />} />         {/* 预约页面 */}
      <Route path="/register" element={<RegistrationForm />} />
      <Route path="/register/medical" element={<MedicalPage />} />
      <Route path="/register/authorize" element={<AuthorizationPage />} />
      <Route path="/register/selfie" element={<SelfiePage />} />
      <Route path="/register/submit" element={<SubmitPage />} />
      <Route path="/profile" element={<ProfilePage />} />        {/* 个人信息页面 */}
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

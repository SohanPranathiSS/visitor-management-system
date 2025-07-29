import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import VisitorCheckInPage from './pages/VisitorCheckInPage';
import HostDashboardPage from './pages/HostDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import ResourcePage from './pages/ResourcePage';
import AboutUsPage from './pages/AboutUsPage';
import BookDemoPage from './pages/BookDemoPage';
import ContactUsPage from './pages/ContactUsPage';
import RegistrationPage from './pages/RegistrationPage';
import MultiVisitorPage from './pages/MultiVisitorPage';
// import ScanCard from './pages/scanCard';
import ScanCard1 from './pages/ScanCard1';
import './App.css';

function App() {
  // Retrieve token and user from localStorage
  const token = localStorage.getItem('token');
  let user = null;
  let userRole = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
    userRole = user && user.role ? user.role : null;
  } catch (e) {
    console.error('Error parsing user from localStorage:', e);
  }

  // Debug logs
  console.log('App.js - Token:', token);
  console.log('App.js - User:', user);
  console.log('App.js - User Role:', userRole);

  if (!token || !user || !userRole) {
    console.log('No token or invalid user data, rendering public routes');
    localStorage.removeItem('token'); // Clear invalid token
    localStorage.removeItem('user'); // Clear invalid user data
    return (
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/products" element={<ProductPage />} />
        <Route path="/resources" element={<ResourcePage />} />
        <Route path="/aboutus" element={<AboutUsPage />} />
        <Route path="/bookademo" element={<BookDemoPage />} />
        <Route path="/contactus" element={<ContactUsPage />} />
        <Route path="/multiVisitor" element={<MultiVisitorPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  console.log('Token and userRole present, rendering protected routes');
  return (
    <Routes>
      <Route path="/checkin" element={<VisitorCheckInPage />} />
      <Route path="/host" element={<HostDashboardPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
     {/* <Route path="/scanCard" element={<ScanCard />} /> */}
      <Route path="/scanCard1" element={<ScanCard1 />} />
      
      {/* Public routes */}

      <Route path="/multiVisitor" element={<MultiVisitorPage />} />

      <Route path="*" element={<Navigate to={userRole === 'admin' ? '/admin' : '/host'} replace />} />
    </Routes>
  );
}

export default App;
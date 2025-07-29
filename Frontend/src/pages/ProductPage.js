
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/ProductPage.css';

const ProductPage = () => {
  return (
    
    <div className="product-container">
      <nav className="navbar">
        <div className="navbar-logo">Visitor Management</div>
        <ul className="navbar-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/products">Products</Link></li>
          <li><Link to="/resources">Resources</Link></li>
          <li><Link to="/aboutus">About Us</Link></li>
          <li><Link to="/bookademo">Book a Demo</Link></li>
          <li><Link to="/contactus">Contact Us</Link></li>
          <li><a href="/register" className="register-btn">Registeration</a></li>
          <li><Link to="/login" className="login-btn">Login</Link></li>
        </ul>
      </nav>

      {/* Hero Section */}
      <header className="product-hero">
        <div className="product-hero-content">
          <h1 className="product-hero-title">Our Products</h1>
          <p className="product-hero-desc">Discover the features and benefits of our Visitor Management System.</p>
        </div>
      </header>

      {/* Features Section */}
      <section className="product-features-section">
        <div className="product-features-grid">
          <div className="product-feature-card">
            <div className="product-feature-icon">
              <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#007bff" opacity="0.13"/><path d="M20 22c3.314 0 6-2.239 6-5s-2.686-5-6-5-6 2.239-6 5 2.686 5 6 5zm0 2c-4 0-12 2-12 6v2h24v-2c0-4-8-6-12-6z" fill="#007bff"/></svg>
            </div>
            <h2>Real-time Check-In/Out</h2>
            <p>Monitor and manage visitor flow with instant check-in and check-out tracking.</p>
          </div>
          <div className="product-feature-card">
            <div className="product-feature-icon">
              <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#28a745" opacity="0.13"/><path d="M20 22c3.314 0 6-2.239 6-5s-2.686-5-6-5-6 2.239-6 5 2.686 5 6 5zm0 2c-4 0-12 2-12 6v2h24v-2c0-4-8-6-12-6z" fill="#28a745"/></svg>
            </div>
            <h2>Photo Capture</h2>
            <p>Enhance security by capturing visitor photos during registration.</p>
          </div>
          <div className="product-feature-card">
            <div className="product-feature-icon">
              <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#ffc107" opacity="0.13"/><path d="M20 22c3.314 0 6-2.239 6-5s-2.686-5-6-5-6 2.239-6 5 2.686 5 6 5zm0 2c-4 0-12 2-12 6v2h24v-2c0-4-8-6-12-6z" fill="#ffc107"/></svg>
            </div>
            <h2>Role-based Access</h2>
            <p>Custom dashboards for Admins, Hosts, and Visitors for a tailored experience.</p>
          </div>
          <div className="product-feature-card">
            <div className="product-feature-icon">
              <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#17a2b8" opacity="0.13"/><path d="M20 22c3.314 0 6-2.239 6-5s-2.686-5-6-5-6 2.239-6 5 2.686 5 6 5zm0 2c-4 0-12 2-12 6v2h24v-2c0-4-8-6-12-6z" fill="#17a2b8"/></svg>
            </div>
            <h2>Email & SMS Notifications</h2>
            <p>Automatic notifications to hosts when their visitors arrive.</p>
          </div>
          <div className="product-feature-card">
            <div className="product-feature-icon">
              <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#6f42c1" opacity="0.13"/><path d="M20 22c3.314 0 6-2.239 6-5s-2.686-5-6-5-6 2.239-6 5 2.686 5 6 5zm0 2c-4 0-12 2-12 6v2h24v-2c0-4-8-6-12-6z" fill="#6f42c1"/></svg>
            </div>
            <h2>Data Storage</h2>
            <p>Securely store and manage visitor logs and data.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductPage;

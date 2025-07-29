import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/ContactUsPage.css';

const ContactUsPage = () => {
  return (
    <div className="contactus-container">
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
      <header className="contactus-hero">
        <div className="contactus-hero-content">
          <h1 className="contactus-hero-title">Contact Us</h1>
          <p className="contactus-hero-desc">We'd love to hear from you! Reach out with your questions, feedback, or support needs.</p>
        </div>
      </header>

      {/* Two-Column Section */}
      <section className="contactus-main-section">
        <div className="contactus-main-grid">
          <form className="contactus-form">
            <label>Name
              <input type="text" placeholder="Your Name" required />
            </label>
            <label>Email
              <input type="email" placeholder="Your Email" required />
            </label>
            <label>Message
              <textarea placeholder="How can we help you?" rows="4" required></textarea>
            </label>
            <button type="submit" className="contactus-btn">Send Message</button>
          </form>
          <div className="contactus-info-card">
            <div className="contactus-info-icon">
              <svg width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="24" fill="#007bff" opacity="0.13"/><path d="M24 26c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7 3.582 7 8 7zm0 3c-5.33 0-16 2.668-16 8v3h32v-3c0-5.332-10.67-8-16-8z" fill="#007bff"/></svg>
            </div>
            <h2>Contact Details</h2>
            <p>Email: <a href="mailto:support@visitormanagement.com">support@visitormanagement.com</a></p>
            <p>Phone: +1 (800) 123-4567</p>
            <p>Address: 123 Main St, Tech City, USA</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUsPage;

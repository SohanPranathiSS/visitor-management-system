import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/BookDemoPage.css';

const BookDemoPage = () => {
  return (
    <div className="bookdemo-container">
      <nav className="navbar">
        <div className="navbar-logo">Visitor Management</div>
        <ul className="navbar-links">
          <li><a href="/">Home</a></li>
          <li><Link to="/products">Products</Link></li>
          <li><Link to="/resources">Resources</Link></li>
          <li><Link to="/aboutus">About Us</Link></li>
          <li><Link to="/bookademo">Book a Demo</Link></li>
          <li><a href="/contactus">Contact Us</a></li>
          <li><a href="/register" className="register-btn">Registeration</a></li>
          <li><a href="/login" className="login-btn">Login</a></li>
        </ul>
      </nav>
      <header className="bookdemo-header">
        <h1>Book a Demo</h1>
        <p>Schedule a personalized demo to see how our Visitor Management System can benefit your organization.</p>
      </header>
      <section className="bookdemo-form-section">
        <form className="bookdemo-form">
          <label>Name
            <input type="text" placeholder="Your Name" required />
          </label>
          <label>Email
            <input type="email" placeholder="Your Email" required />
          </label>
          <label>Organization
            <input type="text" placeholder="Your Organization" />
          </label>
          <label>Preferred Date
            <input type="date" />
          </label>
          <label>Message
            <textarea placeholder="Tell us about your needs..." rows="4"></textarea>
          </label>
          <button type="submit" className="hero-cta">Book Demo</button>
        </form>
      </section>
    </div>
  );
};

export default BookDemoPage;

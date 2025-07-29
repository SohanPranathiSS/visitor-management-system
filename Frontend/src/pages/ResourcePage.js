import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ResourcePage.css';

const ResourcePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);

  const resources = [
    {
      title: 'User Guide',
      description: 'Step-by-step instructions for using the Visitor Management System efficiently.',
      extraInfo: 'This comprehensive guide covers everything from basic navigation to advanced features, including visitor check-in, badge printing, and report generation.'
    },
    {
      title: 'Admin Documentation',
      description: 'Comprehensive documentation for system administrators and IT staff.',
      extraInfo: 'Detailed technical documentation including system architecture, security protocols, and API integration instructions for administrators.'
    },
    {
      title: 'FAQs',
      description: 'Find answers to the most common questions about our platform.',
      extraInfo: 'Browse through our extensive collection of frequently asked questions covering setup, troubleshooting, and best practices.'
    },
    {
      title: 'Support',
      description: 'Need help? Contact our support team for assistance.',
      extraInfo: 'Our 24/7 support team is available via email, phone, and live chat to help resolve any issues you might encounter.'
    }
  ];

  const openModal = (resource) => {
    setSelectedResource(resource);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedResource(null);
  };

  return (
    <div className="resource-container">
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
      <header className="resource-hero">
        <div className="resource-hero-content">
          <h1 className="resource-hero-title">Resources</h1>
          <p className="resource-hero-desc">Explore guides, documentation, and helpful materials for the Visitor Management System.</p>
        </div>
      </header>

      {/* Resource Cards Section */}
      <section className="resource-cards-section">
        <div className="resource-cards-grid">
          {resources.map((resource, index) => (
            <div 
              key={index} 
              className="resource-card" 
              onClick={() => openModal(resource)}
            >
              <div className={`resource-card-icon icon-${index}`}>
                {/* SVG icons for each resource */}
                {index === 0 && (
                  <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#007bff" opacity="0.13"/><path d="M20 22c3.314 0 6-2.239 6-5s-2.686-5-6-5-6 2.239-6 5 2.686 5 6 5zm0 2c-4 0-12 2-12 6v2h24v-2c0-4-8-6-12-6z" fill="#007bff"/></svg>
                )}
                {index === 1 && (
                  <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#28a745" opacity="0.13"/><path d="M20 22c3.314 0 6-2.239 6-5s-2.686-5-6-5-6 2.239-6 5 2.686 5 6 5zm0 2c-4 0-12 2-12 6v2h24v-2c0-4-8-6-12-6z" fill="#28a745"/></svg>
                )}
                {index === 2 && (
                  <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#ffc107" opacity="0.13"/><path d="M20 22c3.314 0 6-2.239 6-5s-2.686-5-6-5-6 2.239-6 5 2.686 5 6 5zm0 2c-4 0-12 2-12 6v2h24v-2c0-4-8-6-12-6z" fill="#ffc107"/></svg>
                )}
                {index === 3 && (
                  <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#17a2b8" opacity="0.13"/><path d="M20 22c3.314 0 6-2.239 6-5s-2.686-5-6-5-6 2.239-6 5 2.686 5 6 5zm0 2c-4 0-12 2-12 6v2h24v-2c0-4-8-6-12-6z" fill="#17a2b8"/></svg>
                )}
              </div>
              <h2>{resource.title}</h2>
              <p>{resource.description}</p>
              <span className="resource-link">View Details</span>
            </div>
          ))}
        </div>
      </section>

      {isModalOpen && selectedResource && (
        <div className="resource-modal-overlay" onClick={closeModal}>
          <div className="resource-modal-content" onClick={e => e.stopPropagation()}>
            <button className="resource-modal-close" onClick={closeModal} aria-label="Close">×</button>
            <div className="resource-modal-icon">
              {/* Use the same icon as the card */}
              {resources.findIndex(r => r.title === selectedResource.title) === 0 && (
                <svg width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="24" fill="#007bff" opacity="0.13"/><path d="M24 26c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7 3.582 7 8 7zm0 3c-5.33 0-16 2.668-16 8v3h32v-3c0-5.332-10.67-8-16-8z" fill="#007bff"/></svg>
              )}
              {resources.findIndex(r => r.title === selectedResource.title) === 1 && (
                <svg width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="24" fill="#28a745" opacity="0.13"/><path d="M24 26c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7 3.582 7 8 7zm0 3c-5.33 0-16 2.668-16 8v3h32v-3c0-5.332-10.67-8-16-8z" fill="#28a745"/></svg>
              )}
              {resources.findIndex(r => r.title === selectedResource.title) === 2 && (
                <svg width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="24" fill="#ffc107" opacity="0.13"/><path d="M24 26c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7 3.582 7 8 7zm0 3c-5.33 0-16 2.668-16 8v3h32v-3c0-5.332-10.67-8-16-8z" fill="#ffc107"/></svg>
              )}
              {resources.findIndex(r => r.title === selectedResource.title) === 3 && (
                <svg width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="24" fill="#17a2b8" opacity="0.13"/><path d="M24 26c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7 3.582 7 8 7zm0 3c-5.33 0-16 2.668-16 8v3h32v-3c0-5.332-10.67-8-16-8z" fill="#17a2b8"/></svg>
              )}
            </div>
            <h2 className="resource-modal-title">{selectedResource.title}</h2>
            <p className="resource-modal-desc">{selectedResource.description}</p>
            <div className="resource-modal-extra">
              <h3>Additional Information</h3>
              <p>{selectedResource.extraInfo}</p>
            </div>
            <button className="resource-modal-button" onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcePage;
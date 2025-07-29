import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const handleBookDemo = () => {
    navigate('/bookademo');
  };
  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="navbar-logo">Visitor Management</div>
        <ul className="navbar-links">
          <li><a href="#home">Home</a></li>
          <li><Link to="/products">Products</Link></li>
          <li><Link to="/resources">Resources</Link></li>
          <li><Link to="/aboutus">About Us</Link></li>
          <li><a href="/bookademo">Book a Demo</a></li>
          <li><a href="/contactus">Contact Us</a></li>
          <li><a href="/register" className="register-btn">Registeration</a></li>
          <li><a href="/login" className="login-btn">Login</a></li>

        </ul>
      </nav>
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-left">
            <p className="hero-subtitle">THE WORKPLACE PLATFORM FOR TECHNOLOGY COMPANIES</p>
            <h1 className="hero-title">Connect the dots<br />between your workforce and workplace</h1>
            <p className="hero-desc">Discover opportunities to cut costs and boost employee productivity—without sacrificing your security.</p>
            <button className="hero-cta" onClick={handleBookDemo}>Book a demo</button>
            <div className="hero-contact">
              <span>Talk to our sales team. </span>
              <a href="/contactus" className="contact-link">Contact us</a>
            </div>
          </div>
          <div className="hero-right">
            {/* Illustration placeholder, replace src with your SVG or image */}
            <img src="https://cdn.prod.website-files.com/64820bb890b5d776bb0c9faf/6509af0d0d50db5e1c359ca0_connect-the-dots.png" alt="Workplace Illustration" className="hero-illustration" />
          </div>
        </div>
        <div className="hero-logos">
          <img src="https://cdn.prod.website-files.com/64820bb890b5d776bb0c9faf/65098265b58c77281271ac6a_hulu.svg" alt="hulu" />
          <img src="https://cdn.prod.website-files.com/64820bb890b5d776bb0c9faf/650982631882b4cb7fac91ff_American%20Eagle.svg" alt="American Eagle" />
          <img src="https://cdn.prod.website-files.com/64820bb890b5d776bb0c9faf/650982627288de27c17f3063_Stripe.svg" alt="stripe" />
          <img src="https://cdn.prod.website-files.com/64820bb890b5d776bb0c9faf/65098263ae29f27a60d68bd7_Pinterest.svg" alt="Pinterest" />
          <img src="https://cdn.prod.website-files.com/64820bb890b5d776bb0c9faf/65098263ffea4dbff81b0e9f_l%27Oreal.svg" alt="LOREAL" />
        </div>
      </section>
      <section className="overview-section">
        <h2>What is the Visitor Management System?</h2>
        <div className="overview-section-content">
          <div className="overview-icon">
            {/* Modern visitor icon SVG */}
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="24" fill="currentColor" opacity="0.13"/>
              <path d="M24 26c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7 3.582 7 8 7zm0 3c-5.33 0-16 2.668-16 8v3h32v-3c0-5.332-10.67-8-16-8z" fill="currentColor"/>
            </svg>
          </div>
          <div className="overview-text">
            <p>
              Our Visitor Management System is a <strong>secure, efficient, and user-friendly platform</strong> that streamlines the check-in/check-out process for visitors, employees, and contractors.<br /><br />
              Designed for organizations of all sizes, it improves workplace safety, automates guest interactions, and provides a seamless experience from registration to departure.
            </p>
          </div>
        </div>
      </section>

<section className="features-section">
  <h2>Key Features</h2>
  <div className="features-grid">
    <div className="feature-card">
      <h3>Real-time Check-In/Out</h3>
      <p>Track visitor activity with accurate check-in and check-out timestamps.</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
        <img 
          src="/assets/CheckInOut.png" 
          alt="Visitor Check-In" 
          style={{ width: '120px', height: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}
        />
      </div>
    </div>
    <div className="feature-card">
      <h3>Photo Capture</h3>
      <p>Capture visitor photos for verification and record-keeping.</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
        <img 
          src="/assets/PhotoCapture.png" 
          alt="Visitor Check-In" 
          style={{ width: '120px', height: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}
        />
      </div>
    </div>
    <div className="feature-card">
      <h3>Role-based Access</h3>
      <p>Admins, Hosts, and Visitors see only what they need based on roles.</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
        <img 
          src="/assets/RollBasedAccess.png" 
          alt="Visitor Check-In" 
          style={{ width: '120px', height: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}
        />
      </div>
    </div>
    <div className="feature-card">
      <h3>Email & SMS Notifications</h3>
      <p>Automatically notify hosts when their visitors arrive.</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
        <img 
          src="/assets/EmailNotification.png" 
          alt="Visitor Check-In" 
          style={{ width: '120px', height: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}
        />
      </div>
    </div>
    <div className="feature-card">
      <h3>Data Storage</h3>
      <p>Securely store visitor logs using localStorage or a backend database.</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
        <img 
          src="/assets/DataStorage.png" 
          alt="Visitor Check-In" 
          style={{ width: '120px', height: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}
        />
      </div>
    </div>
  </div>
</section>
<section className="usecases-section">
  <h2>Who Is It For?</h2>
  <div className="usecases-grid">
    <div className="usecase-card">
      <h3>Corporate Offices</h3>
      <p>Manage employee guests, delivery personnel, and scheduled visitors with ease.</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
        <img 
          src="/assets/Corporate.png" 
          alt="Visitor Check-In" 
          style={{ width: '120px', height: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}
        />
      </div>
    </div>
    <div className="usecase-card">
      <h3>Co-Working Spaces</h3>
      <p>Automate check-in for members and guests across multiple locations.</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
        <img 
          src="/assets/Working.png" 
          alt="Visitor Check-In" 
          style={{ width: '120px', height: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}
        />
      </div>
    </div>
    <div className="usecase-card">
      <h3>Educational Institutions</h3>
      <p>Enhance security by tracking student, parent, and staff visitors.</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
        <img 
          src="/assets/Campus.png" 
          alt="Visitor Check-In" 
          style={{ width: '120px', height: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}
        />
      </div>
    </div>
    <div className="usecase-card">
      <h3>Government Buildings</h3>
      <p>Ensure authorized access and maintain visit records for compliance.</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
        <img 
          src="/assets/Govt.png" 
          alt="Visitor Check-In" 
          style={{ width: '120px', height: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}
        />
      </div>
    </div>
  </div>
</section>


<section className="testimonials-section">
  <h2>What Our Users Say</h2>
  <div className="testimonials-grid">
    <div className="testimonial-card">
      <div className="overview-icon">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="24" fill="currentColor" opacity="0.13" />
          <path d="M24 26c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7 3.582 7 8 7zm0 3c-5.33 0-16 2.668-16 8v3h32v-3c0-5.332-10.67-8-16-8z" fill="currentColor" />
        </svg>
      </div>
      <p>"The Visitor Management System made our reception completely paperless. Super easy to use!"</p>
      <strong>- HR Manager, FinTech Co.</strong>
    </div>

    <div className="testimonial-card">
      <div className="overview-icon">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="24" fill="currentColor" opacity="0.13" />
          <path d="M24 26c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7 3.582 7 8 7zm0 3c-5.33 0-16 2.668-16 8v3h32v-3c0-5.332-10.67-8-16-8z" fill="currentColor" />
        </svg>
      </div>
      <p>"We improved our security and check-in speed by 3x. Highly recommend it for large campuses."</p>
      <strong>- Admin Head, University</strong>
    </div>

    <div className="testimonial-card">
      <div className="overview-icon">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="24" fill="currentColor" opacity="0.13" />
          <path d="M24 26c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7 3.582 7 8 7zm0 3c-5.33 0-16 2.668-16 8v3h32v-3c0-5.332-10.67-8-16-8z" fill="currentColor" />
        </svg>
      </div>
      <p>"Simple, elegant, and effective. Our guests love the smooth experience."</p>
      <strong>- Office Manager, Startup Hub</strong>
    </div>
  </div>
</section>

<section className="cta-section">
  <h2>Ready to Modernize Your Front Desk?</h2>
  <p>Start your free trial or schedule a demo today to experience the power of a smart visitor management system.</p>
  <div className="cta-buttons">
    <button className="hero-cta" >Start Your Free Trial</button>
    <button className="hero-cta secondary" onClick={handleBookDemo}>Book a Demo</button>
  </div>
</section>


<footer className="footer">
  <div className="footer-content">
    <div className="footer-column">
      <h4>Visitor Management</h4>
      <p>Secure. Smart. Seamless.</p>
    </div>
    <div className="footer-column">
      <h4>Product</h4>
      <ul>
        <li><a href="#features">Features</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="#faq">FAQs</a></li>
      </ul>
    </div>
    <div className="footer-column">
      <h4>Company</h4>
      <ul>
        <li><a href="/aboutus">About Us</a></li>
        <li><a href="#careers">Careers</a></li>
        <li><a href="/contactus">Contact</a></li>
      </ul>
    </div>
    <div className="footer-column">
      <h4>Legal</h4>
      <ul>
        <li><a href="#privacy">Privacy Policy</a></li>
        <li><a href="#terms">Terms of Service</a></li>
      </ul>
    </div>
  </div>
  <div className="footer-bottom">
    <p>© {new Date().getFullYear()} Visitor Management System. All rights reserved.</p>
  </div>
</footer>

    </div>
  );
};

export default HomePage;

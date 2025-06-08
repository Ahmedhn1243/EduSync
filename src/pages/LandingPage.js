import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Add Poppins and Inter fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Handle scroll
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    // Cleanup
    return () => {
      document.head.removeChild(link);
      window.removeEventListener('scroll', handleScroll);
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  return (
    <div className="landing-page">
      <nav className={`nav-bar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="logo">
            <span className="logo-text">EduSync</span>
          </div>
          <div className="nav-items">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <Link to="/login" className="nav-link nav-button sign-in">Sign In</Link>
            <Link to="/register" className="nav-link nav-button btn-register">Register</Link>
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-content">
          <h1>Welcome to EduSync</h1>
          <p className="subtitle">Smart Learning Management & Assessment Platform</p>
          <p className="description">A unified platform to manage educational content, monitor performance, and automate assessments in one digital learning era.</p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">Get Started</Link>
            <Link to="/login" className="btn btn-secondary">Sign In</Link>
          </div>
        </div>
      </header>

      <section id="features" className="features">
        <h2>Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon course-icon"></div>
            <h3>Course Management</h3>
            <p>Efficiently organize and manage courses with our intuitive course management system.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon assessment-icon"></div>
            <h3>Assessment System</h3>
            <p>Create and manage assessments with automated grading and instant feedback.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon analytics-icon"></div>
            <h3>Performance Analytics</h3>
            <p>Track and analyze student performance with detailed analytics and insights.</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Register for an Account</h3>
            <p>Create a secure credentials account to get started.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Enroll in Courses</h3>
            <p>Browse available courses and start learning.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Learn and Complete Assessments</h3>
            <p>Access course materials and prove your progress.</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Track Your Progress</h3>
            <p>Monitor your performance and learning success.</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">EduSync</div>
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
          <div className="footer-copyright">
            © {new Date().getFullYear()} EduSync. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 
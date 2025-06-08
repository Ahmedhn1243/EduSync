import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ProfileMenu.css';

const ProfileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');
  const userName = localStorage.getItem('userName') || 'User';
  const userEmail = localStorage.getItem('userEmail') || '';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="profile-menu" ref={menuRef}>
      <button 
        className="profile-trigger" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="profile-icon">
          {userName.charAt(0).toUpperCase()}
        </div>
      </button>

      {isOpen && (
        <div className="profile-dropdown">
          <div className="profile-header">
            <div className="profile-info">
              <span className="profile-name">{userName}</span>
              <span className="profile-email">{userEmail}</span>
              <span className="profile-role">{userRole}</span>
            </div>
          </div>
          
          <div className="profile-menu-items">
            {userRole === 'instructor' ? (
              <>
                <Link to="/instructor-profile" className="menu-item">
                  <i className="fas fa-user"></i>
                  Profile
                </Link>
                <Link to="/instructor-dashboard" className="menu-item">
                  <i className="fas fa-chalkboard-teacher"></i>
                  Dashboard
                </Link>
                <Link to="/course-upload" className="menu-item">
                  <i className="fas fa-upload"></i>
                  Upload Course
                </Link>
                <Link to="/assessment-upload" className="menu-item">
                  <i className="fas fa-tasks"></i>
                  Upload Assessment
                </Link>
              </>
            ) : (
              <>
                <Link to="/student-profile" className="menu-item">
                  <i className="fas fa-user"></i>
                  Profile
                </Link>
                <Link to="/student-dashboard" className="menu-item">
                  <i className="fas fa-graduation-cap"></i>
                  Dashboard
                </Link>
                <Link to="/enrolled-courses" className="menu-item">
                  <i className="fas fa-book"></i>
                  My Courses
                </Link>
                <Link to="/assessments" className="menu-item">
                  <i className="fas fa-tasks"></i>
                  Assessments
                </Link>
              </>
            )}
            
            <div className="menu-divider"></div>
            
            <button onClick={handleLogout} className="menu-item logout">
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu; 
import React from 'react';
import { Link } from 'react-router-dom';
import ProfileMenu from './ProfileMenu';
import './Navbar.css';

const Navbar = () => {
  const isAuthenticated = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  return (
    <nav className="navbar-container">
      <div className="navbar-brand">
        <Link to="/">EduSync</Link>
      </div>
      <div className="navbar-links">
        {isAuthenticated ? (
          <>
            <Link to="/courses">Courses</Link>
            {userRole === 'instructor' ? (
              <>
                <Link to="/instructor-dashboard">Dashboard</Link>
              </>
            ) : (
              <>
                <Link to="/student-dashboard">Dashboard</Link>
              </>
            )}
            <ProfileMenu />
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 
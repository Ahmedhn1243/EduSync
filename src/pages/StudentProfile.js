import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './StudentProfile.css';

const StudentProfile = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Student';
  const userEmail = localStorage.getItem('userEmail') || '';
  const joinDate = localStorage.getItem('joinDate') || new Date().toISOString();

  return (
    <>
      <Navbar />
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>
          <h1>{userName}</h1>
          <span className="role-badge">Student</span>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <h2>Personal Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Full Name</label>
                <p>{userName}</p>
              </div>
              <div className="info-item">
                <label>Email</label>
                <p>{userEmail}</p>
              </div>
              <div className="info-item">
                <label>Member Since</label>
                <p>{new Date(joinDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              <button 
                className="action-button"
                onClick={() => navigate('/enrolled-courses')}
              >
                <i className="fas fa-book"></i>
                My Courses
              </button>
              <button 
                className="action-button"
                onClick={() => navigate('/assessments')}
              >
                <i className="fas fa-tasks"></i>
                Assessments
              </button>
              <button 
                className="action-button"
                onClick={() => navigate('/student-dashboard')}
              >
                <i className="fas fa-tachometer-alt"></i>
                Dashboard
              </button>
            </div>
          </div>

          <div className="profile-section">
            <h2>Account Settings</h2>
            <div className="settings-grid">
              <button className="settings-button">
                <i className="fas fa-key"></i>
                Change Password
              </button>
              <button className="settings-button">
                <i className="fas fa-bell"></i>
                Notification Settings
              </button>
              <button className="settings-button danger">
                <i className="fas fa-trash"></i>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentProfile; 
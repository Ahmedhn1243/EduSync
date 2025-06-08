import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './InstructorProfile.css';

const InstructorProfile = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Instructor';
  const userEmail = localStorage.getItem('userEmail') || '';
  const joinDate = localStorage.getItem('joinDate') || new Date().toISOString();
  const coursesCount = localStorage.getItem('coursesCount') || '0';
  const studentsCount = localStorage.getItem('studentsCount') || '0';

  return (
    <>
      <Navbar />
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar instructor">
            {userName.charAt(0).toUpperCase()}
          </div>
          <h1>{userName}</h1>
          <span className="role-badge instructor">Instructor</span>
        </div>

        <div className="profile-content">
          <div className="stats-grid">
            <div className="stat-card">
              <i className="fas fa-book-open"></i>
              <div className="stat-info">
                <h3>Total Courses</h3>
                <p>{coursesCount}</p>
              </div>
            </div>
            <div className="stat-card">
              <i className="fas fa-users"></i>
              <div className="stat-info">
                <h3>Total Students</h3>
                <p>{studentsCount}</p>
              </div>
            </div>
          </div>

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
                onClick={() => navigate('/course-upload')}
              >
                <i className="fas fa-plus-circle"></i>
                Create Course
              </button>
              <button 
                className="action-button"
                onClick={() => navigate('/assessment-upload')}
              >
                <i className="fas fa-tasks"></i>
                Create Assessment
              </button>
              <button 
                className="action-button"
                onClick={() => navigate('/instructor-dashboard')}
              >
                <i className="fas fa-tachometer-alt"></i>
                Dashboard
              </button>
              <button 
                className="action-button"
                onClick={() => navigate('/my-courses')}
              >
                <i className="fas fa-book"></i>
                My Courses
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
                <i className="fas fa-user-edit"></i>
                Edit Profile
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

export default InstructorProfile; 
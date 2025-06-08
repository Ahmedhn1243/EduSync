import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Basic validation
      if (!formData.email || !formData.password) {
        throw new Error('Please enter both email and password');
      }

      const response = await login(formData);
      console.log('Login response:', response.data); // Debug log

      // Store auth data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userRole', response.data.role?.toLowerCase() || 'student');
      localStorage.setItem('userName', response.data.name || response.data.userName || formData.email.split('@')[0]);
      localStorage.setItem('userEmail', response.data.email || formData.email);
      localStorage.setItem('joinDate', new Date().toISOString());

      // Redirect based on role
      if (response.data.role?.toLowerCase() === 'instructor') {
        navigate('/instructor-dashboard');
      } else {
        navigate('/student-dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Failed to login. Please try again.';

      if (err.message.includes('Invalid email or password')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (err.message.includes('backend')) {
        errorMessage = 'Server connection error. Please ensure the backend server is running.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
        if (err.response.data.details) {
          errorMessage += `: ${err.response.data.details}`;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>
        {error && (
          <div className="alert-error">
            <p>{error}</p>
            {error.includes('backend') && (
              <div className="error-details">
                <p className="error-hint">
                  Make sure the backend server is running at http://localhost:4000
                </p>
                <p className="error-hint">
                  Try refreshing the page or check your network connection.
                </p>
              </div>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder=" "
            />
            <label htmlFor="email">Email</label>
          </div>
          <div className="form-group">
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder=" "
            />
            <label htmlFor="password">Password</label>
          </div>
          <button 
            type="submit" 
            className="btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'LOGIN'}
          </button>
        </form>
        <p className="form-footer">
          Don't have an account?{' '}
          <a href="/register" className="link">
            Register here
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login; 
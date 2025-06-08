import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCourse } from '../api';
import './CourseUpload.css';

const CourseUpload = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    duration: '',
    level: '',
    mediaUrl: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('slideOut');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Course title is required');
      return false;
    }

    if (formData.title.length > 100) {
      setError('Course title must be less than 100 characters');
      return false;
    }

    if (formData.description && formData.description.length > 100) {
      setError('Course description must be less than 100 characters');
      return false;
    }

    if (formData.mediaUrl && !isValidUrl(formData.mediaUrl)) {
      setError('Please enter a valid media URL');
      return false;
    }

    return true;
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      showToast(error, 'error');
      return;
    }

    setLoading(true);

    try {
      const courseData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        instructorId: localStorage.getItem('userId') || null,
        mediaUrl: formData.mediaUrl.trim() || null,
        content: formData.content.trim(),
        duration: parseInt(formData.duration) || 0,
        level: formData.level
      };

      await createCourse(courseData);
      showToast('✅ Course successfully created!');
      setTimeout(() => {
        navigate('/instructor-dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error creating course:', err);
      const errorMessage = err.response?.data?.message || 'Failed to create course';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="course-upload">
      <div className="form-container">
        <h2>Create New Course</h2>
        {error && <div className="alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-group">
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder=" "
              />
              <label htmlFor="title">Course Title</label>
            </div>

            <div className="form-group">
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                maxLength={100}
                placeholder=" "
              />
              <label htmlFor="description">Course Description</label>
            </div>

            <div className="form-group">
              <input
                type="url"
                id="mediaUrl"
                name="mediaUrl"
                value={formData.mediaUrl}
                onChange={handleChange}
                placeholder=" "
              />
              <label htmlFor="mediaUrl">Media URL (optional)</label>
            </div>
          </div>

          <div className="form-section">
            <div className="form-group">
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                placeholder=" "
              />
              <label htmlFor="content">Course Content</label>
            </div>
          </div>

          <div className="form-section">
            <div className="form-group">
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                min="1"
                placeholder=" "
              />
              <label htmlFor="duration">Duration (in hours)</label>
            </div>

            <div className="form-group">
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                required
              >
                <option value="" disabled>-- Select Course Level --</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <label htmlFor="level">Course Level</label>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/instructor-dashboard')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseUpload; 
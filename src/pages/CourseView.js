import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourse } from '../api';
import './CourseView.css';

const CourseView = ({ enrollmentsView = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        // Check for authentication
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login', { replace: true });
          return;
        }

        const response = await getCourse(id);
        if (!response?.data) {
          throw new Error('Course not found');
        }
        setCourse(response.data);
      } catch (err) {
        console.error('Error fetching course:', err);
        
        if (err.response?.status === 401) {
          setError('Please log in to view this course');
          navigate('/login', { replace: true });
        } else if (err.response?.status === 404) {
          setError('Course not found');
          setTimeout(() => {
            navigate('/student-dashboard', { replace: true });
          }, 2000);
        } else {
          setError('Failed to fetch course details. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (!id) {
      setError('Invalid course ID');
      setLoading(false);
      navigate('/student-dashboard', { replace: true });
      return;
    }

    fetchCourse();
  }, [id, navigate]);

  const handleBackClick = () => {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'instructor') {
      navigate('/instructor-dashboard');
    } else {
      navigate('/student-dashboard');
    }
  };

  const renderMediaUrl = (url) => {
    if (!url) return null;

    try {
      const mediaUrl = new URL(url);
      return (
        <div className="info-item">
          <span className="label">Course Materials</span>
          <div className="media-url-container">
            <a 
              href={mediaUrl.href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="media-url-link"
            >
              <i className="fas fa-external-link-alt"></i>
              Access Course Materials
            </a>
          </div>
        </div>
      );
    } catch (e) {
      console.error('Invalid media URL:', url);
      return null;
    }
  };

  if (loading) {
    return <div className="loading">Loading course details...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!course) {
    return <div className="error">Course not found</div>;
  }

  return (
    <div className="course-view">
      <div className="course-header">
        <h1>{enrollmentsView ? `${course.Title} - Enrollments` : course.Title || 'Untitled Course'}</h1>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={handleBackClick}
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {enrollmentsView ? (
        <div className="enrollments-view">
          <div className="stats-cards">
            <div className="stat-card">
              <h3>Total Enrollments</h3>
              <p>{course.EnrolledStudents?.length || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Active Students</h3>
              <p>{course.EnrolledStudents?.filter(e => e.Status === 'Active')?.length || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Average Progress</h3>
              <p>
                {course.EnrolledStudents?.length
                  ? Math.round(
                      course.EnrolledStudents.reduce(
                        (acc, curr) => acc + parseInt(curr.Progress || '0'),
                        0
                      ) / course.EnrolledStudents.length
                    ) + '%'
                  : '0%'}
              </p>
            </div>
          </div>

          <div className="enrollments-table-container">
            <table className="enrollments-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Enrollment Date</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {course.EnrolledStudents && course.EnrolledStudents.length > 0 ? (
                  course.EnrolledStudents.map((enrollment) => (
                    <tr key={enrollment.EnrollmentId}>
                      <td>{enrollment.Student?.Name || 'N/A'}</td>
                      <td>{enrollment.Student?.Email || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${enrollment.Status?.toLowerCase() || 'active'}`}>
                          {enrollment.Status || 'Active'}
                        </span>
                      </td>
                      <td>{enrollment.EnrollmentDate ? new Date(enrollment.EnrollmentDate).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: enrollment.Progress || '0%' }}
                          />
                          <span className="progress-text">{enrollment.Progress || '0%'}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-data-message">
                      No students enrolled in this course yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div className="detail-section">
            <h2>Course Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Description</span>
                <p className="value">{course.Description || 'No description available'}</p>
              </div>
              <div className="info-item">
                <span className="label">Created</span>
                <span className="value">
                  {course.CreatedAt ? new Date(course.CreatedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              {renderMediaUrl(course.MediaUrl)}
            </div>
          </div>

          <div className="detail-section">
            <h2>Course Content</h2>
            {course.Content ? (
              <div className="content-section">
                <p>{course.Content}</p>
              </div>
            ) : (
              <div className="no-data-message">
                No content available for this course.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CourseView; 
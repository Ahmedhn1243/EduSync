import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCourses, getAssessments, enrollInCourse } from '../api';
import Navbar from '../components/Navbar';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Check for authentication token
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const [coursesResponse, assessmentsResponse] = await Promise.all([
          getCourses(),
          getAssessments(),
        ]);
        
        console.log('Fetched courses:', coursesResponse?.data); // Debug log
        
        // Filter out invalid courses and assessments
        const validCourses = coursesResponse?.data || [];
        const validAssessments = assessmentsResponse?.data?.filter(assessment => assessment?.AssessmentId) || [];
        
        setCourses(validCourses);
        setAssessments(validAssessments);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
          navigate('/login');
        } else if (err.message?.includes('Network Error')) {
          setError('Unable to connect to the server. Please check your internet connection.');
        } else {
          setError('Failed to load dashboard data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleEnroll = async (courseId) => {
    if (!courseId || enrolling) {
        console.warn('Invalid course ID or already enrolling:', { courseId, enrolling });
        return;
    }

    console.log('Attempting to enroll in course:', courseId);

    setEnrolling(courseId);
    try {
        const response = await enrollInCourse(courseId);
        console.log('Enrollment successful:', response.data);
        
        // Show success message
        const toast = document.createElement('div');
        toast.className = 'toast toast-success';
        toast.textContent = response?.data?.message || 'Successfully enrolled in course!';
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);

        // Refresh courses data
        const coursesResponse = await getCourses();
        console.log('Updated courses data:', coursesResponse?.data);
        if (Array.isArray(coursesResponse?.data)) {
            setCourses(coursesResponse.data);
        }
    } catch (err) {
        console.error('Error enrolling in course:', {
            courseId,
            error: err,
            response: err.response?.data,
            status: err.response?.status
        });
        
        // Get appropriate error message
        let errorMessage = 'Failed to enroll in course';
        if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
        } else if (err.message?.includes('Network Error')) {
            errorMessage = 'Network error. Please check your connection.';
        } else if (err.response?.status === 401) {
            errorMessage = 'Please log in to enroll in courses.';
            navigate('/login');
        } else if (err.response?.status === 404) {
            errorMessage = 'Course not found. Please refresh the page and try again.';
        }
        
        // Show error message
        const toast = document.createElement('div');
        toast.className = 'toast toast-error';
        toast.textContent = errorMessage;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    } finally {
        setEnrolling(null);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <>
      <Navbar />
      <div className="student-dashboard">
        <h1>Student Dashboard</h1>
        
        <section className="dashboard-section">
          <h2>Available Courses</h2>
          <div className="grid">
            {courses && courses.map((course, index) => {
              // Ensure course object is valid
              if (!course || !course.CourseId) {
                console.warn('Invalid course object:', course);
                return null;
              }

              return (
                <div key={course.CourseId} className="card">
                  <h3 className="card-title">{course.Title || 'Untitled Course'}</h3>
                  <div className="card-meta">
                    <span>Created: {course.CreatedAt ? new Date(course.CreatedAt).toLocaleDateString() : 'N/A'}</span>
                    {course.EnrolledStudents && (
                      <span>Students: {course.EnrolledStudents.length}</span>
                    )}
                  </div>
                  <div className="card-footer">
                    <Link 
                      to={`/courses/${course.CourseId}`} 
                      className="btn btn-primary"
                    >
                      View Course
                    </Link>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleEnroll(course.CourseId)}
                      disabled={enrolling === course.CourseId}
                    >
                      {enrolling === course.CourseId ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                  </div>
                </div>
              );
            })}
            {(!courses || courses.length === 0) && (
              <div className="no-data-message">
                No courses available at this time.
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-section">
          <h2>Available Assessments</h2>
          <div className="grid">
            {assessments && assessments.map((assessment, index) => {
              let questionCount = 0;
              try {
                const questions = assessment.Questions ? JSON.parse(assessment.Questions) : [];
                questionCount = questions.length;
              } catch (err) {
                console.error('Error parsing questions:', err);
              }

              return (
                <div key={assessment?.AssessmentId || `assessment-${index}`} className="card">
                  <h3 className="card-title">{assessment?.Title || 'Untitled Assessment'}</h3>
                  <div className="card-meta">
                    <span>Duration: {assessment?.Duration || 'N/A'} minutes</span>
                    <span>Questions: {questionCount}</span>
                  </div>
                  <div className="card-footer">
                    {assessment?.AssessmentId ? (
                      <Link to={`/quiz/${assessment.AssessmentId}`} className="btn btn-primary">
                        Start Assessment
                      </Link>
                    ) : (
                      <button className="btn btn-primary" disabled>
                        Assessment Not Available
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {(!assessments || assessments.length === 0) && (
              <div className="no-data-message">
                No assessments available at this time.
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default StudentDashboard; 
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCourses, getAssessments, deleteAssessment, deleteCourse, getAssessmentResults } from '../api';
import Navbar from '../components/Navbar';
import './InstructorDashboard.css';

const InstructorDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [assessmentResults, setAssessmentResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingAssessments, setDeletingAssessments] = useState({});
  const [deleting, setDeleting] = useState({ type: null, id: null });
  const [deleteStatus, setDeleteStatus] = useState({ loading: false, error: null });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [coursesResponse, assessmentsResponse] = await Promise.all([
        getCourses(),
        getAssessments(),
      ]);

      if (Array.isArray(coursesResponse.data)) {
        const coursesWithValidIds = coursesResponse.data.filter(course => course?.CourseId);
        setCourses(coursesWithValidIds);
      }

      if (Array.isArray(assessmentsResponse.data)) {
        setAssessments(assessmentsResponse.data);
        
        // Fetch results for each assessment
        const resultsPromises = assessmentsResponse.data.map(async (assessment) => {
          try {
            const resultsResponse = await getAssessmentResults(assessment.AssessmentId);
            const formattedResults = resultsResponse.data.map(r => {
              // Extract and validate numeric values
              const correctAnswers = parseInt(r.correctAnswers ?? r.score) || 0;
              const totalQuestions = parseInt(r.totalQuestions) || 1;
              const questionsAttempted = parseInt(r.questionsAttempted) || totalQuestions;

              // Format attempt date
              let formattedDate = 'N/A';
              try {
                if (r.attemptDate) {
                  // Parse the date string directly without assuming UTC
                  const d = new Date(r.attemptDate);
                  if (!isNaN(d.getTime())) {
                    const pad = n => n.toString().padStart(2, '0');
                    let hours = d.getHours();
                    const minutes = pad(d.getMinutes());
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12;
                    hours = hours ? hours : 12;
                    formattedDate = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}, ${pad(hours)}:${minutes} ${ampm}`;
                  } else {
                    console.error('Invalid date value:', r.attemptDate);
                  }
                }
              } catch (error) {
                console.error('Error formatting date:', error, 'Raw date:', r.attemptDate);
              }

              // Use backend-provided values or calculate if not available
              const scorePercentage = r.details?.scorePercentage ?? 
                Math.round((correctAnswers / totalQuestions) * 100);
              const completionRate = r.details?.completionRate ?? 
                Math.round((questionsAttempted / totalQuestions) * 100);
              const accuracy = r.details?.accuracy ?? 
                (questionsAttempted > 0 ? Math.round((correctAnswers / questionsAttempted) * 100) : 0);

              return {
                ...r,
                score: scorePercentage,
                correctAnswers,
                totalQuestions,
                questionsAttempted,
                attemptDate: formattedDate,
                rawAttemptDate: r.attemptDate,
                details: {
                  completionRate,
                  accuracy,
                  scorePercentage
                }
              };
            });

            return { [assessment.AssessmentId]: formattedResults };
          } catch (err) {
            console.error(`Error fetching results for assessment ${assessment.AssessmentId}:`, err);
            return { [assessment.AssessmentId]: [] };
          }
        });

        const results = await Promise.all(resultsPromises);
        const resultsMap = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        setAssessmentResults(resultsMap);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [location.key]);

  const handleDeleteCourse = async (courseId) => {
    if (!courseId || deleting.id) return;
    
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    setDeleting({ type: 'course', id: courseId });
    setError('');
    
    try {
      await deleteCourse(courseId);
      // Remove the course from the local state
      setCourses(prevCourses => prevCourses.filter(course => course.CourseId !== courseId));
      setError('');
    } catch (err) {
      console.error('Error deleting course:', err);
      setError(err.response?.data?.message || 'Failed to delete course. Please try again.');
    } finally {
      setDeleting({ type: null, id: null });
    }
  };

  const handleDelete = async (id) => {
    if (!id || deletingAssessments[id]) return;

    if (!window.confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      return;
    }

    setDeletingAssessments(prev => ({ ...prev, [id]: true }));
    try {
      await deleteAssessment(id);
      setAssessments(prevAssessments => 
        prevAssessments.filter(assessment => assessment.AssessmentId !== id)
      );
    } catch (err) {
      console.error('Error deleting assessment:', err);
      setError(err.message || 'Failed to delete assessment');
      showToast(err.message || 'Failed to delete assessment', 'error');
    } finally {
      setDeletingAssessments(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  const showToast = (message, type = 'error', retryCallback = null) => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'toast-message';
    messageDiv.textContent = message;
    toast.appendChild(messageDiv);

    if (retryCallback) {
      const retryButton = document.createElement('button');
      retryButton.className = 'toast-retry-btn';
      retryButton.textContent = 'Retry';
      retryButton.onclick = retryCallback;
      toast.appendChild(retryButton);
    }

    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('toast-fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <>
      <Navbar />
      <div className="instructor-dashboard">
        <h1>Instructor Dashboard</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <section className="dashboard-section">
          <h2>Your Courses</h2>
          <div className="grid">
            {courses && courses.map((course, index) => (
              <div key={course?.CourseId || `course-${index}`} className="card">
                <h3 className="card-title">{course?.Title || 'Untitled Course'}</h3>
                <div className="card-meta">
                  <span>Students: {course?.EnrolledStudents?.length || 0}</span>
                  <span>Created: {course?.CreatedAt ? new Date(course.CreatedAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="card-footer">
                  <Link 
                    to={`/courses/${course?.CourseId}`} 
                    className="btn btn-primary"
                  >
                    View Course
                  </Link>
                  <Link 
                    to={`/courses/${course?.CourseId}/enrollments`} 
                    className="btn btn-secondary"
                  >
                    View Enrollments
                  </Link>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleDeleteCourse(course?.CourseId)}
                    disabled={deleting.type === 'course' && deleting.id === course?.CourseId}
                  >
                    {deleting.type === 'course' && deleting.id === course?.CourseId ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-section">
          <h2>Your Assessments</h2>
          <div className="grid">
            {assessments && assessments.map((assessment) => {
              const id = assessment?.AssessmentId;
              if (!id) return null;

              const results = assessmentResults[id] || [];
              const totalAttempts = results.length;

              return (
                <div key={id} className="card">
                  <h3 className="card-title">{assessment.Title || 'Untitled Assessment'}</h3>
                  <div className="card-meta">
                    <span>Questions: {assessment.Questions ? JSON.parse(assessment.Questions).length : 0}</span>
                    <span>Duration: {assessment.Duration || 'N/A'} minutes</span>
                    <span>Total Attempts: {totalAttempts}</span>
                  </div>
                  <div className="card-footer">
                    <Link 
                      to={`/assessments/${id}`} 
                      className="btn btn-primary"
                    >
                      View Assessment
                    </Link>
                    <Link 
                      to={`/assessments/${id}/results`} 
                      state={{ assessment: assessment }}
                      className="btn view-results"
                    >
                      View Results ({totalAttempts})
                    </Link>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleDelete(id)}
                      disabled={deletingAssessments[id]}
                    >
                      {deletingAssessments[id] ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
};

export default InstructorDashboard;
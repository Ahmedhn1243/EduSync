import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssessment, deleteAssessment } from '../api';
import './AssessmentView.css';

const AssessmentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchAssessment = async () => {
      // Validate the ID format (should be a UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!id || !uuidRegex.test(id)) {
        console.error('Invalid assessment ID format:', id);
        setError('Invalid assessment ID');
        setLoading(false);
        navigate('/instructor-dashboard', { replace: true });
        return;
      }

      try {
        const response = await getAssessment(id);
        const assessmentData = response?.data;
        
        if (!assessmentData) {
          throw new Error('Assessment not found');
        }

        console.log('Fetched assessment data:', assessmentData);

        let parsedQuestions = [];
        try {
          parsedQuestions = assessmentData.Questions ? JSON.parse(assessmentData.Questions) : [];
        } catch (parseError) {
          console.error('Error parsing questions:', parseError);
          parsedQuestions = [];
        }
        
        setAssessment(assessmentData);
        setQuestions(parsedQuestions);
      } catch (err) {
        console.error('Error fetching assessment:', err);
        const errorMessage = err.response?.status === 404 
          ? 'Assessment not found' 
          : err.message || 'Failed to fetch assessment';
        setError(errorMessage);
        
        if (err.response?.status === 404) {
          setTimeout(() => {
            navigate('/instructor-dashboard', { replace: true });
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!assessment?.AssessmentId || deleting) return;
    
    if (!window.confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteAssessment(assessment.AssessmentId);
      navigate('/instructor-dashboard', { replace: true });
    } catch (err) {
      console.error('Error deleting assessment:', {
        id: assessment.AssessmentId,
        error: err,
        message: err.message,
        status: err.status,
        data: err.data,
        timestamp: new Date().toISOString()
      });

      // Handle specific error cases
      const status = err.status || err.response?.status || 500;
      let errorMessage = err.message || 'Failed to delete assessment';

      switch (status) {
        case 401:
          errorMessage = 'Your session has expired. Please log in again.';
          localStorage.clear();
          setTimeout(() => navigate('/login', { replace: true }), 1500);
          break;
        case 403:
          errorMessage = 'You do not have permission to delete this assessment. Please make sure you are logged in as an instructor.';
          break;
        case 404:
          errorMessage = 'Assessment not found or already deleted.';
          setTimeout(() => navigate('/instructor-dashboard', { replace: true }), 1500);
          break;
        case 500:
          errorMessage = `Server error: ${err.data?.message || 'Please try again later.'}`;
          break;
      }

      setError(errorMessage);
      setDeleting(false);

      // Show error message in a toast
      const toast = document.createElement('div');
      toast.className = 'toast toast-error';
      toast.textContent = errorMessage;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 5000);
    }
  };

  if (loading) {
    return <div className="loading">Loading assessment...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!assessment) {
    return <div className="error">Assessment not found</div>;
  }

  return (
    <div className="assessment-view">
      <div className="assessment-header">
        <h1>{assessment.Title || 'Untitled Assessment'}</h1>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/instructor-dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="assessment-details">
        <div className="detail-item">
          <span className="label">Max Score:</span>
          <span className="value">{assessment.MaxScore || 'N/A'} points</span>
        </div>
        <div className="detail-item">
          <span className="label">Total Questions:</span>
          <span className="value">{questions.length}</span>
        </div>
      </div>

      <div className="questions-section">
        <h2>Questions</h2>
        {questions.map((question, index) => (
          <div key={`question-${index}`} className="question-card">
            <h3>Question {index + 1}</h3>
            <p className="question-text">{question.question}</p>
            <div className="options-list">
              {question.options.map((option, optionIndex) => (
                <div
                  key={`option-${index}-${optionIndex}`}
                  className={`option ${
                    question.correctAnswer === optionIndex ? 'correct' : ''
                  }`}
                >
                  {option}
                  {question.correctAnswer === optionIndex && (
                    <span className="correct-badge">✓ Correct Answer</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {questions.length === 0 && (
          <div className="no-data-message">
            No questions available for this assessment.
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentView; 
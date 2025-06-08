import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssessment, submitAssessment } from '../api';
import './QuizPage.css';

const QuizPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (submitting) return;
    setSubmitting(true);
    setError(''); // Clear any previous errors

    try {
      // Validate that we have an assessment and questions
      if (!assessment?.AssessmentId) {
        throw new Error('Invalid assessment data');
      }

      // Get student ID from localStorage or token
      const studentId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!studentId || !token) {
        setError('Your session has expired. Please log in again.');
        setSubmitting(false);
        navigate('/login');
        return;
      }

      // Validate userId format (should be a GUID)
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentId)) {
        setError('Invalid user ID. Please log in again.');
        setSubmitting(false);
        navigate('/login');
        return;
      }

      // Format answers and validate
      const formattedAnswers = questions.map((_, index) => ({
        questionIndex: index,
        selectedAnswer: answers[index] !== undefined ? parseInt(answers[index]) : null
      }));

      // Calculate attempted questions
      const attemptedAnswers = formattedAnswers.filter(answer => answer.selectedAnswer !== null);

      if (attemptedAnswers.length === 0) {
        setError('Please answer at least one question before submitting.');
        setSubmitting(false);
        return;
      }

      // Calculate time taken in minutes
      const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 60000));

      // Log submission attempt
      console.log('Preparing assessment submission:', {
        assessmentId: assessment.AssessmentId,
        answersCount: attemptedAnswers.length,
        totalQuestions: questions.length,
        timeTaken: timeTaken
      });

      const submissionData = {
        userId: studentId,
        answers: formattedAnswers,
        timeTaken: timeTaken,
        isAutoSubmit: isAutoSubmit
      };

      setError('Submitting your assessment...');

      // Step 1: Submit the assessment
      const response = await submitAssessment(assessment.AssessmentId, submissionData);
      
      if (!response?.data) {
        throw new Error('No response data received from submission');
      }

      // Log successful submission
      console.log('Assessment submitted successfully:', {
        resultId: response.data.resultId,
        score: response.data.score,
        questionsAttempted: response.data.questionsAttempted,
        totalQuestions: response.data.totalQuestions
      });

      // Step 2: Show success message
      setError('Assessment submitted successfully! Loading your results...');

      // Step 3: Wait for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 4: Navigate to results
      const resultsUrl = `/results/${assessment.AssessmentId}`;
      window.location.href = resultsUrl;

    } catch (err) {
      console.error('Error submitting assessment:', {
        error: err.message,
        details: err.response?.data,
        status: err.response?.status,
        assessmentId: assessment?.AssessmentId
      });
      
      if (err.response?.status === 401) {
        setError('Authentication error. Please log in again.');
        setTimeout(() => navigate('/login'), 1500);
      } else if (err.response?.status === 404) {
        setError('Assessment not found. Please try again.');
      } else if (err.response?.status === 400) {
        setError(err.response.data.message || 'Invalid submission. Please check your answers.');
      } else if (err.message === 'Invalid user ID') {
        setError('Session error. Please log in again.');
        setTimeout(() => navigate('/login'), 1500);
      } else if (err.response?.status === 500) {
        setError('Server error. Please try submitting again. If the problem persists, please contact support.');
        console.error('Server error details:', err.response?.data);
      } else {
        setError('Failed to submit assessment. Please try again.');
      }
      setSubmitting(false);
    }
  }, [assessment, questions, answers, startTime, submitting, navigate]);

  useEffect(() => {
    const fetchAssessment = async () => {
      if (!id || id === 'undefined') {
        setError('Invalid assessment ID');
        setLoading(false);
        navigate('/student-dashboard', { replace: true });
        return;
      }

      // Check for authentication
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to take this assessment');
        setLoading(false);
        navigate('/login', { replace: true });
        return;
      }

      try {
        const response = await getAssessment(id);
        if (!response?.data) {
          throw new Error('Assessment not found');
        }

        const assessmentData = response.data;
        
        // Parse questions JSON string
        let parsedQuestions = [];
        try {
          parsedQuestions = assessmentData.Questions ? JSON.parse(assessmentData.Questions) : [];
        } catch (err) {
          console.error('Error parsing questions:', err);
          throw new Error('Invalid assessment format');
        }
        
        if (!parsedQuestions.length) {
          throw new Error('This assessment has no questions');
        }

        setAssessment(assessmentData);
        setQuestions(parsedQuestions);
        
        // Set duration in seconds and start time
        const durationInSeconds = (assessmentData.Duration || 30) * 60;
        setTimeLeft(durationInSeconds);
        setStartTime(Date.now());
        
        // Initialize answers object
        const initialAnswers = parsedQuestions.reduce((acc, q, index) => {
          acc[index] = null;
          return acc;
        }, {});
        setAnswers(initialAnswers);
      } catch (err) {
        console.error('Error fetching assessment:', err);
        
        if (err.response?.status === 401) {
          setError('Please log in to take this assessment');
          navigate('/login', { replace: true });
        } else if (err.response?.status === 404 || err.message === 'Assessment not found') {
          setError('Assessment not found');
          setTimeout(() => {
            navigate('/student-dashboard', { replace: true });
          }, 2000);
        } else if (err.message === 'Invalid assessment format' || err.message === 'This assessment has no questions') {
          setError(err.message);
          setTimeout(() => {
            navigate('/student-dashboard', { replace: true });
          }, 2000);
        } else {
          setError('Failed to load assessment. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [id, navigate]);

  useEffect(() => {
    if (!timeLeft) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true); // Pass true to indicate auto-submission
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit]);

  const handleAnswerChange = (questionIndex, answerIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
    }));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading assessment...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        {error.includes('submitted successfully') ? (
          <div className="loading">Redirecting to results...</div>
        ) : (
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/student-dashboard')}
          >
            Back to Dashboard
          </button>
        )}
      </div>
    );
  }

  if (!assessment || !questions.length) {
    return <div className="error">Assessment not found or has no questions</div>;
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="quiz-page">
      <div className="quiz-header">
        <h1>{assessment.Title || 'Untitled Assessment'}</h1>
        <div className={`timer ${timeLeft <= 60 ? 'timer-warning' : ''}`}>
          Time Remaining: {formatTime(timeLeft)}
        </div>
      </div>

      <div className="quiz-content">
        {questions.map((question, index) => (
          <div key={`question-${index}`} className="question-card">
            <h3>
              Question {index + 1} of {questions.length}
            </h3>
            <p className="question-text">{question.question}</p>
            <div className="options-list">
              {question.options.map((option, optionIndex) => (
                <label key={`option-${index}-${optionIndex}`} className="option-label">
                  <input
                    type="radio"
                    name={`question-${index}`}
                    checked={answers[index] === optionIndex}
                    onChange={() => handleAnswerChange(index, optionIndex)}
                  />
                  <span className="option-text">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="quiz-footer">
        <button
          className="btn btn-primary"
          onClick={() => handleSubmit(false)}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Assessment'}
        </button>
      </div>
    </div>
  );
};

export default QuizPage; 
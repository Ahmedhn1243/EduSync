import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssessment, submitAssessment } from '../api';
import './Quiz.css';

const Quiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const response = await getAssessment(id);
        const assessmentData = response.data;
        console.log('Assessment data:', assessmentData);

        // Parse questions once and store them
        const parsedQuestions = JSON.parse(assessmentData.Questions || '[]');
        console.log('Parsed questions:', parsedQuestions);

        setAssessment(assessmentData);
        setQuestions(parsedQuestions);
      } catch (err) {
        console.error('Error fetching assessment:', err);
        setError(err.response?.data?.message || 'Failed to load assessment');
      }
    };

    if (id) {
      fetchAssessment();
    }
  }, [id]);

  const handleAnswerSelect = (questionIndex, selectedOption) => {
    console.log(`Selected answer for question ${questionIndex}: ${selectedOption}`);
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedOption
    }));
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    try {
      setSubmitting(true);
      setError('');

      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Format answers for submission - only include questions that were actually answered
      const formattedAnswers = [];
      let attemptedCount = 0;

      for (let i = 0; i < questions.length; i++) {
        const answer = selectedAnswers[i];
        if (answer !== undefined && answer !== null) {
          attemptedCount++;
          formattedAnswers.push({
            questionIndex: i,
            selectedAnswer: parseInt(answer)
          });
        }
      }

      // Validate minimum answers
      if (formattedAnswers.length === 0) {
        setError('Please answer at least one question before submitting.');
        setSubmitting(false);
        return;
      }

      // Log submission details for debugging
      console.log('Submitting assessment:', {
        assessmentId: assessment.AssessmentId,
        totalQuestions: questions.length,
        questionsAttempted: attemptedCount,
        answers: formattedAnswers,
        userId: userId,
        isAutoSubmit: isAutoSubmit,
        timeTaken: Math.round((Date.now() - startTime) / 1000)
      });

      const response = await submitAssessment(assessment.AssessmentId, {
        answers: formattedAnswers,
        userId: userId,
        isAutoSubmit: isAutoSubmit,
        timeTaken: Math.round((Date.now() - startTime) / 1000)
      });

      console.log('Submission response:', response.data);

      if (!response?.data) {
        throw new Error('No response data received');
      }

      // Validate response data
      const { score, maxScore, correctAnswers, questionsAttempted, totalQuestions, details } = response.data;
      
      if (score === undefined || maxScore === undefined || correctAnswers === undefined) {
        console.error('Invalid response data:', response.data);
        throw new Error('Invalid response data received');
      }

      // Store the complete response data
      setResult(response.data);
      setShowResult(true);

      // Log the results for debugging
      console.log('Assessment results:', {
        score,
        maxScore,
        correctAnswers,
        questionsAttempted,
        totalQuestions,
        details
      });

    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError(err.response?.data?.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question, index) => {
    const isAnswered = selectedAnswers[index] !== undefined;
    const isCorrect = showResult && isAnswered && selectedAnswers[index] === question.correctAnswer;
    const isIncorrect = showResult && isAnswered && selectedAnswers[index] !== question.correctAnswer;

    return (
      <div key={index} className={`question-container ${isCorrect ? 'correct' : ''} ${isIncorrect ? 'incorrect' : ''}`}>
        <h3>Question {index + 1}</h3>
        <p className="question-text">{question.question}</p>
        <div className="options-container">
          {question.options.map((option, optionIndex) => (
            <div 
              key={optionIndex} 
              className={`option ${
                showResult ? (
                  optionIndex === question.correctAnswer ? 'correct' :
                  selectedAnswers[index] === optionIndex ? 'incorrect' : ''
                ) : ''
              }`}
            >
              <input
                type="radio"
                id={`q${index}-${optionIndex}`}
                name={`question-${index}`}
                value={optionIndex}
                checked={selectedAnswers[index] === optionIndex}
                onChange={() => handleAnswerSelect(index, optionIndex)}
                disabled={showResult}
              />
              <label htmlFor={`q${index}-${optionIndex}`}>
                {option}
                {showResult && optionIndex === question.correctAnswer && (
                  <span className="correct-answer"> ✓ Correct Answer</span>
                )}
              </label>
            </div>
          ))}
        </div>
        {showResult && (
          <div className="answer-feedback">
            {isAnswered ? (
              isCorrect ? (
                <span className="correct">✓ Correct</span>
              ) : (
                <span className="incorrect">✗ Incorrect</span>
              )
            ) : (
              <span className="unanswered">Not attempted</span>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!assessment || questions.length === 0) {
    return <div className="loading">Loading assessment...</div>;
  }

  return (
    <div className="quiz-container">
      <h2>{assessment.Title}</h2>
      <div className="questions-list">
        {questions.map((question, index) => renderQuestion(question, index))}
      </div>
      {!showResult && (
        <button 
          className="submit-btn" 
          onClick={() => handleSubmit(false)}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Assessment'}
        </button>
      )}
      {error && <div className="error-message">{error}</div>}
      {showResult && result && (
        <div className="result-container">
          <h3>Assessment Result</h3>
          <div className="score-details">
            <div className="score-row">
              <span className="label">Score:</span>
              <span className="value">{result.score}/{result.maxScore}</span>
              <span className="percentage">({result.details?.scorePercentage.toFixed(1)}%)</span>
            </div>
            <div className="score-row">
              <span className="label">Questions Attempted:</span>
              <span className="value">{result.questionsAttempted}/{result.totalQuestions}</span>
              <span className="percentage">({result.details?.completionRate.toFixed(1)}% completion)</span>
            </div>
            <div className="score-row">
              <span className="label">Correct Answers:</span>
              <span className="value">{result.correctAnswers}/{result.questionsAttempted}</span>
              <span className="percentage">({result.details?.accuracy.toFixed(1)}% accuracy)</span>
            </div>
            <div className="score-row">
              <span className="label">Time Taken:</span>
              <span className="value">{result.timeTaken} minutes</span>
            </div>
          </div>
          <button 
            className="btn-secondary" 
            onClick={() => navigate('/student-dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default Quiz; 
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssessmentResults } from '../api';
import './ResultsPage.css';

const ResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError('');

        console.log('Fetching results for assessment:', id);
        const response = await getAssessmentResults(id);
        
        console.log('API Response:', response);
        
        if (!response?.data) {
          throw new Error('No results data received');
        }

        // Log the raw response data for debugging
        console.log('Raw response data:', response.data);

        // Extract the result data, handling both direct and nested response formats
        const resultData = response.data.result || response.data;

        // Log the extracted data
        console.log('Extracted result data:', resultData);

        // Validate and extract required fields with defaults
        const processedResults = {
          assessment: {
            title: resultData.assessment?.title || resultData.title || 'Assessment',
            duration: resultData.assessment?.duration || resultData.duration || 0,
            maxScore: resultData.totalQuestions || 0
          },
          score: resultData.correctAnswers || 0,
          questionsAttempted: resultData.questionsAttempted || 0,
          totalQuestions: resultData.totalQuestions || 0,
          correctAnswers: resultData.correctAnswers || 0,
          attemptDate: resultData.attemptDate
            ? (() => {
                try {
                  console.log('Raw attempt date from API:', resultData.attemptDate);
                  
                  // First, normalize the date string by replacing dots with colons in the time part
                  const normalizedDate = resultData.attemptDate.replace(/(\d{2})\.(\d{2})\.(\d{2})/, '$1:$2:$3');
                  console.log('Normalized date string:', normalizedDate);
                  
                  // Try parsing with normalized ISO format
                  let d = new Date(normalizedDate);
                  
                  // If invalid, try adding 'Z' to treat as UTC
                  if (isNaN(d.getTime())) {
                    console.log('First parse attempt failed, trying with UTC...');
                    d = new Date(normalizedDate + 'Z');
                  }

                  // If still invalid, try parsing with explicit format
                  if (isNaN(d.getTime())) {
                    console.log('Second parse attempt failed, trying explicit format...');
                    const [datePart, timePart] = normalizedDate.split('T');
                    const [year, month, day] = datePart.split('-');
                    const [hour, minute, second] = timePart.split(':');
                    d = new Date(year, month - 1, day, hour, minute, second);
                  }

                  if (isNaN(d.getTime())) {
                    console.error('All date parsing attempts failed:', resultData.attemptDate);
                    return 'N/A';
                  }

                  // Format date in local timezone
                  const pad = n => n.toString().padStart(2, '0');
                  const day = pad(d.getDate());
                  const month = pad(d.getMonth() + 1);
                  const year = d.getFullYear();
                  let hours = d.getHours();
                  const minutes = pad(d.getMinutes());
                  const ampm = hours >= 12 ? 'PM' : 'AM';
                  hours = hours % 12;
                  hours = hours ? hours : 12;
                  hours = pad(hours);

                  const formatted = `${day}-${month}-${year}, ${hours}:${minutes} ${ampm}`;

                  // Log successful date processing
                  console.log('Date processing successful:', {
                    input: resultData.attemptDate,
                    normalized: normalizedDate,
                    parsed: d.toISOString(),
                    localTime: d.toString(),
                    formatted: formatted
                  });

                  return formatted;
                } catch (error) {
                  console.error('Error formatting date:', error, 'Raw date:', resultData.attemptDate);
                  return 'N/A';
                }
              })()
            : 'N/A',
          timeTaken: resultData.timeTaken || 0,
          details: {
            completionRate: resultData.details?.completionRate || 
              (resultData.totalQuestions > 0 ? (resultData.questionsAttempted / resultData.totalQuestions * 100) : 0),
            accuracy: resultData.details?.accuracy || 
              (resultData.questionsAttempted > 0 ? (resultData.correctAnswers / resultData.questionsAttempted * 100) : 0),
            scorePercentage: resultData.details?.scorePercentage || 
              (resultData.totalQuestions > 0 ? (resultData.correctAnswers / resultData.totalQuestions * 100) : 0)
          }
        };

        // Ensure all percentage values are valid numbers between 0 and 100
        processedResults.details.completionRate = Math.min(100, Math.max(0, processedResults.details.completionRate || 0));
        processedResults.details.accuracy = Math.min(100, Math.max(0, processedResults.details.accuracy || 0));
        processedResults.details.scorePercentage = Math.min(100, Math.max(0, processedResults.details.scorePercentage || 0));

        // Round percentage values to 1 decimal place
        processedResults.details.completionRate = Number(processedResults.details.completionRate.toFixed(1));
        processedResults.details.accuracy = Number(processedResults.details.accuracy.toFixed(1));
        processedResults.details.scorePercentage = Number(processedResults.details.scorePercentage.toFixed(1));

        console.log('Processed results:', processedResults);
        setResults(processedResults);
      } catch (error) {
        console.error('Error fetching results:', error);
        if (error.response?.status === 401) {
          setError('Please log in to view results');
          navigate('/login');
        } else {
          setError(error.response?.data?.message || 'Failed to fetch results');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchResults();
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="results-container loading">
        <div className="loading-spinner">Loading results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-container error">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/student-dashboard')} className="btn btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="results-container error">
        <div className="error-message">No results data available</div>
        <button onClick={() => navigate('/student-dashboard')} className="btn btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const {
    assessment: { title, duration, maxScore },
    score,
    questionsAttempted,
    totalQuestions,
    correctAnswers,
    attemptDate,
    timeTaken,
    details: { completionRate, accuracy, scorePercentage }
  } = results;

  return (
    <div className="results-container">
      <div className="results-card">
        <h1>Assessment Results</h1>
        
        <div className="assessment-details">
          <h2>{title}</h2>
          <p>Duration: {duration} minutes</p>
          <p>Attempt Date: {attemptDate}</p>
        </div>

        <div className="score-section">
          <div className="score-display">
            <div className="score-circle">
              <span className="score-number">{correctAnswers * 10}</span>
              <span className="score-max">/{totalQuestions * 10}</span>
            </div>
            <div className="score-percentage">
              {scorePercentage ? scorePercentage.toFixed(1) : '0.0'}%
            </div>
          </div>
          <div className="score-details">
            <div className="detail-row">
              <span className="label">Questions Attempted:</span>
              <span className="value">{questionsAttempted} / {totalQuestions}</span>
              <span className="percentage">({completionRate ? completionRate.toFixed(1) : '0.0'}%)</span>
            </div>
            <div className="detail-row">
              <span className="label">Correct Answers:</span>
              <span className="value">{correctAnswers} / {questionsAttempted}</span>
              <span className="percentage">({accuracy ? accuracy.toFixed(1) : '0.0'}% accuracy)</span>
            </div>
            <div className="detail-row">
              <span className="label">Time Taken:</span>
              <span className="value">
                {timeTaken === 0 ? 'Less than a minute' :
                 timeTaken === 1 ? '1 minute' :
                 `${timeTaken} minutes`}
              </span>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={() => navigate('/student-dashboard')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage; 
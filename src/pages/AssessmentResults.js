import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getAssessment, getAssessmentResults } from '../api';
import './AssessmentResults.css';

const AssessmentResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [assessment, setAssessment] = useState(location.state?.assessment || null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'attemptDate', direction: 'desc' });
  const [isInstructorView] = useState(location.pathname.includes('/assessments/') && location.pathname.includes('/results'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Only fetch assessment if not passed through state
        if (!assessment) {
          const assessmentResponse = await getAssessment(id);
          if (!assessmentResponse?.data) {
            throw new Error('Assessment not found');
          }
          setAssessment(assessmentResponse.data);
        }

        // Fetch results
        const resultsResponse = await getAssessmentResults(id);
        
        if (!resultsResponse?.data) {
          setResults([]);
          return;
        }

        // Add detailed logging for debugging
        console.log('Raw API Response:', resultsResponse);
        console.log('Response Data:', resultsResponse.data);
        if (Array.isArray(resultsResponse.data) && resultsResponse.data.length > 0) {
          console.log('Sample attempt date:', resultsResponse.data[0].attemptDate);
          console.log('Sample result full data:', resultsResponse.data[0]);
        }

        // Ensure we have an array of results
        const resultsData = Array.isArray(resultsResponse.data) ? resultsResponse.data : [resultsResponse.data];
        
        // Format and validate the results data
        const formattedResults = resultsData.map(result => {
          // Debug logging for date
          console.log('Raw result data:', result);
          console.log('Attempt date before processing:', result.attemptDate);

          // Parse numeric values safely with fallbacks
          const correctAnswers = parseInt(result.correctAnswers ?? result.score) || 0;
          const totalQuestions = parseInt(result.totalQuestions) || 1;
          const questionsAttempted = parseInt(result.questionsAttempted) || totalQuestions;

          // Calculate score percentage
          const scorePercentage = result.details?.scorePercentage ?? 
            Math.round((correctAnswers / totalQuestions) * 100);

          // New date handling logic
          let formattedDate = 'N/A';
          let timestamp = 0;

          if (result.attemptDate) {
            try {
              console.log('Raw attempt date from API:', result.attemptDate);
              
              // First, normalize the date string by replacing dots with colons in the time part
              const normalizedDate = result.attemptDate.replace(/(\d{2})\.(\d{2})\.(\d{2})/, '$1:$2:$3');
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

              if (!isNaN(d.getTime())) {
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

                formattedDate = `${day}-${month}-${year}, ${hours}:${minutes} ${ampm}`;
                timestamp = d.getTime();

                // Log successful date processing
                console.log('Date processing successful:', {
                  input: result.attemptDate,
                  normalized: normalizedDate,
                  parsed: d.toISOString(),
                  localTime: d.toString(),
                  formatted: formattedDate,
                  timestamp
                });
              } else {
                console.error('All date parsing attempts failed:', result.attemptDate);
              }
            } catch (error) {
              console.error('Error formatting date:', error, 'Raw date:', result.attemptDate);
            }
          } else {
            console.warn('No attempt date provided for result:', result.resultId);
          }

          // Add debug logging
          console.log('Date processing:', {
            rawDate: result.attemptDate,
            formattedDate,
            timestamp,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          });

          // Use backend-provided values or calculate if not available
          const completionRate = result.details?.completionRate ?? 
            Math.round((questionsAttempted / totalQuestions) * 100);
          const accuracy = result.details?.accuracy ?? 
            (questionsAttempted > 0 ? Math.round((correctAnswers / questionsAttempted) * 100) : 0);

          return {
            resultId: result.resultId,
            user: {
              id: result.user?.id || 'unknown',
              name: result.user?.name || 'Unknown Student',
              email: result.user?.email || 'N/A'
            },
            score: scorePercentage,
            questionsAttempted,
            totalQuestions,
            correctAnswers,
            attemptDate: formattedDate,
            rawAttemptDate: result.attemptDate,
            timestamp,
            details: {
              completionRate,
              accuracy,
              scorePercentage
            }
          };
        });

        // Sort results by date descending by default
        formattedResults.sort((a, b) => b.timestamp - a.timestamp);

        console.log('Raw results data:', resultsData);
        console.log('Formatted results:', formattedResults);
        setResults(formattedResults);

      } catch (err) {
        console.error('Error fetching assessment results:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch assessment results';
        setError(errorMessage);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, assessment]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedResults = () => {
    if (!Array.isArray(results) || results.length === 0) {
      return [];
    }

    const sortedResults = [...results];
    sortedResults.sort((a, b) => {
      const multiplier = sortConfig.direction === 'asc' ? 1 : -1;

      switch (sortConfig.key) {
        case 'score':
          return multiplier * (a.score - b.score);
        case 'name':
          const nameA = (a.user?.name || 'Unknown Student').toLowerCase();
          const nameB = (b.user?.name || 'Unknown Student').toLowerCase();
          return multiplier * nameA.localeCompare(nameB);
        default:
          return 0;
      }
    });
    return sortedResults;
  };

  const calculateStatistics = () => {
    if (!Array.isArray(results) || results.length === 0) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        totalAttempts: 0
      };
    }

    // Calculate scores directly from correctAnswers and totalQuestions with consistent formatting
    const scores = results.map(r => {
      const correctAnswers = r.correctAnswers || 0;
      const totalQuestions = r.totalQuestions || 1;
      return Number(((correctAnswers / totalQuestions) * 100).toFixed(2));
    });

    const validScores = scores.filter(score => !isNaN(score) && score >= 0);

    if (validScores.length === 0) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        totalAttempts: results.length
      };
    }

    const sum = validScores.reduce((acc, score) => acc + score, 0);
    const average = Number((sum / validScores.length).toFixed(2));
    const highest = Number(Math.max(...validScores).toFixed(2));
    const lowest = Number(Math.min(...validScores).toFixed(2));

    return {
      average,
      highest,
      lowest,
      totalAttempts: results.length
    };
  };

  if (loading) {
    return <div className="loading">Loading results...</div>;
  }

  const sortedResults = getSortedResults();
  const stats = calculateStatistics();

  return (
    <div className="assessment-results">
      <h1>Assessment Results</h1>
      <div className="assessment-info">
        <h2>{assessment?.Title || 'Untitled Assessment'}</h2>
        
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Attempts</h3>
            <p>{stats.totalAttempts}</p>
          </div>
          <div className="stat-card">
            <h3>Average Score</h3>
            <p>{stats.average}%</p>
          </div>
          <div className="stat-card">
            <h3>Highest Score</h3>
            <p>{stats.highest}%</p>
          </div>
          <div className="stat-card">
            <h3>Lowest Score</h3>
            <p>{stats.lowest}%</p>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error === 'No results found for this assessment' 
              ? 'No students have attempted this assessment yet.'
              : error}
          </div>
        )}

        <div className="results-table-container">
          <table className="results-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} className="sortable">
                  Student Name
                  {sortConfig.key === 'name' && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th>Email</th>
                <th onClick={() => handleSort('score')} className="sortable">
                  Score
                  {sortConfig.key === 'score' && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('attemptDate')} className="sortable">
                  Attempt Date
                  {sortConfig.key === 'attemptDate' && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th>Questions</th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.length > 0 ? (
                sortedResults.map((result, index) => (
                  <tr key={result.resultId || index}>
                    <td>{result.user?.name}</td>
                    <td>{result.user?.email}</td>
                    <td className={
                      result.score >= 90 ? 'score-excellent' :
                      result.score >= 80 ? 'score-good' :
                      result.score >= 70 ? 'score-fair' :
                      'score-poor'
                    }>
                      {result.score.toFixed(2)}%
                    </td>
                    <td>{result.attemptDate}</td>
                    <td>{result.questionsAttempted} / {result.totalQuestions}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-results">
                    No students have attempted this assessment yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bottom-navigation">
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/instructor-dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentResults; 
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAssessments } from '../api';
import './AssessmentList.css';

const AssessmentList = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const response = await getAssessments();
        if (!response?.data) {
          throw new Error('No data received from server');
        }
        setAssessments(response.data);
      } catch (err) {
        console.error('Error fetching assessments:', err);
        setError('Failed to fetch assessments');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  if (loading) {
    return <div className="loading">Loading assessments...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="assessment-list">
      <div className="page-header">
        <h1>Available Assessments</h1>
      </div>

      <div className="assessment-grid">
        {assessments && assessments.map((assessment, index) => {
          let questionCount = 0;
          try {
            const questions = assessment.Questions ? JSON.parse(assessment.Questions) : [];
            questionCount = questions.length;
          } catch (err) {
            console.error('Error parsing questions:', err);
          }

          return (
            <div key={assessment?.AssessmentId || `assessment-${index}`} className="assessment-card">
              <h3 className="assessment-title">{assessment?.Title || 'Untitled Assessment'}</h3>
              <div className="assessment-meta">
                <span>Duration: {assessment?.Duration || 'N/A'} minutes</span>
                <span>Questions: {questionCount}</span>
              </div>
              <div className="assessment-actions">
                <Link
                  to={`/quiz/${assessment?.AssessmentId}`}
                  className="btn btn-primary"
                >
                  Start Assessment
                </Link>
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
    </div>
  );
};

export default AssessmentList; 
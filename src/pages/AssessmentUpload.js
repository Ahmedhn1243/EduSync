import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAssessment } from '../api';
import './AssessmentUpload.css';

const AssessmentUpload = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    duration: 30,
    questions: [
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
      },
    ],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    setFormData((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = {
        ...newQuestions[index],
        [field]: value,
      };
      return {
        ...prev,
        questions: newQuestions,
      };
    });
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    setFormData((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[questionIndex].options[optionIndex] = value;
      return {
        ...prev,
        questions: newQuestions,
      };
    });
  };

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
        },
      ],
    }));
  };

  const removeQuestion = (index) => {
    if (formData.questions.length <= 1) {
      setError('Assessment must have at least one question');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Assessment title is required');
      return false;
    }

    for (let i = 0; i < formData.questions.length; i++) {
      const question = formData.questions[i];
      if (!question.question.trim()) {
        setError(`Question ${i + 1} text is required`);
        return false;
      }

      for (let j = 0; j < question.options.length; j++) {
        if (!question.options[j].trim()) {
          setError(`All options for Question ${i + 1} must be filled`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Format the data according to backend expectations
      const formattedData = {
        title: formData.title.trim(),
        duration: parseInt(formData.duration, 10),
        questions: JSON.stringify(formData.questions), // Convert questions array to JSON string
        maxScore: formData.questions.length * 10 // 10 points per question
      };

      console.log('Submitting assessment:', formattedData);
      const response = await createAssessment(formattedData);
      console.log('Assessment created:', response.data);
      
      // Navigate to the assessment view page instead of dashboard
      navigate(`/assessments/${response.data.AssessmentId}`);
    } catch (err) {
      console.error('Error creating assessment:', err);
      setError(err.response?.data?.message || 'Failed to create assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assessment-upload">
      <div className="form-container">
        <h2>Create New Assessment</h2>
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <label htmlFor="title">Assessment Title</label>
          </div>

          <div className="form-group">
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              min="1"
              max="180"
              required
              placeholder=" "
            />
            <label htmlFor="duration">Duration (minutes)</label>
          </div>

          <div className="questions-section">
            <h3>Questions</h3>
            {formData.questions.map((question, questionIndex) => (
              <div key={questionIndex} className="question-card">
                <div className="question-header">
                  <h4>Question {questionIndex + 1}</h4>
                </div>

                <div className="form-group">
                  <textarea
                    value={question.question}
                    onChange={(e) =>
                      handleQuestionChange(questionIndex, 'question', e.target.value)
                    }
                    required
                    rows="3"
                    placeholder=" "
                  />
                  <label>Question Text</label>
                </div>

                <div className="options-group">
                  <label>Options</label>
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="option-input">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) =>
                          handleOptionChange(questionIndex, optionIndex, e.target.value)
                        }
                        placeholder={`Option ${optionIndex + 1}`}
                        required
                      />
                    </div>
                  ))}
                  
                  <div className="correct-answer">
                    <label>Select Correct Answer:</label>
                    <div className="correct-options">
                      {question.options.map((option, optionIndex) => (
                        <label 
                          key={optionIndex} 
                          className={`correct-option ${question.correctAnswer === optionIndex ? 'selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name={`correct-${questionIndex}`}
                            checked={question.correctAnswer === optionIndex}
                            onChange={() =>
                              handleQuestionChange(questionIndex, 'correctAnswer', optionIndex)
                            }
                          />
                          <span className="option-number">Option {optionIndex + 1}:</span>
                          <span className="option-text">{option || '(Empty)'}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="question-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addQuestion}
              >
                Add Question
              </button>
              {formData.questions.length > 1 && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => removeQuestion(formData.questions.length - 1)}
                >
                  Remove Question
                </button>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Assessment'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/instructor-dashboard')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssessmentUpload; 
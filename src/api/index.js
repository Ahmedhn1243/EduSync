export const getAssessmentResults = async (id) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('Fetching results for assessment:', id);

    // First try to get from localStorage if it's a recent submission
    const submissionData = localStorage.getItem('submissionData');
    const lastSubmittedAssessment = localStorage.getItem('lastSubmittedAssessment');
    const lastSubmissionTime = localStorage.getItem('lastSubmissionTime');
    
    if (lastSubmittedAssessment === id && submissionData && lastSubmissionTime) {
      const timeSinceSubmission = Date.now() - new Date(lastSubmissionTime).getTime();
      // Use cached data if submission was within last 5 seconds
      if (timeSinceSubmission < 5000) {
        console.log('Using cached submission data');
        const data = JSON.parse(submissionData);
        // Ensure consistent data structure
        return {
          data: Array.isArray(data) ? data : [data]
        };
      }
    }

    // Otherwise fetch from server
    const response = await api.get(`/assessments/${id}/results`);

    // Ensure consistent data structure
    const responseData = response.data;
    if (!responseData) {
      return { data: [] };
    }

    // Always return an array
    const formattedData = Array.isArray(responseData) ? responseData : [responseData];

    // Process and validate each result
    const processedData = formattedData.map(result => {
      // Extract and validate numeric values
      const correctAnswers = parseInt(result.correctAnswers ?? result.score) || 0;
      const totalQuestions = parseInt(result.totalQuestions) || 1;
      const questionsAttempted = parseInt(result.questionsAttempted) || totalQuestions;

      // Calculate scores
      const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
      const completionRate = Math.round((questionsAttempted / totalQuestions) * 100);
      const accuracy = questionsAttempted > 0 
        ? Math.round((correctAnswers / questionsAttempted) * 100)
        : 0;

      return {
        resultId: result.resultId,
        user: result.user || { id: 'unknown', name: 'Unknown Student', email: 'N/A' },
        correctAnswers,
        totalQuestions,
        questionsAttempted,
        attemptDate: result.attemptDate,
        score: scorePercentage,
        details: {
          completionRate,
          accuracy,
          scorePercentage
        }
      };
    });

    console.log('API Response:', responseData);
    console.log('Processed Data:', processedData);

    return { data: processedData };
  } catch (error) {
    console.error('Error fetching assessment results:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    throw error;
  }
}; 
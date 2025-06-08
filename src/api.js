import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

// Create axios instance with basic configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000 // 10 second timeout
});

// Add a request interceptor to handle authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Ensure token is properly formatted
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = formattedToken;
      
      // Log request details in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Request config:', {
          url: config.url,
          method: config.method,
          headers: {
            ...config.headers,
            Authorization: formattedToken.substring(0, 20) + '...' // Only log part of the token
          }
        });
      }
    } else {
      // Only redirect to login if not already on login/register page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', {
      message: error.message,
      config: error.config,
      timestamp: new Date().toISOString()
    });
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
        timestamp: new Date().toISOString()
      });
    }
    return response;
  },
  async (error) => {
    // Enhanced error logging
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
      headers: error.config?.headers,
      timestamp: new Date().toISOString()
    };

    console.error('API Error:', errorDetails);

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Clear auth data on unauthorized
      localStorage.clear();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      // Handle forbidden access
      console.error('Access forbidden:', errorDetails);
    } else if (error.response?.status === 404) {
      // Handle not found
      console.error('Resource not found:', errorDetails);
    } else if (error.response?.status >= 500) {
      // Handle server errors
      console.error('Server error:', errorDetails);
    } else if (error.code === 'ECONNABORTED') {
      // Handle timeout
      console.error('Request timeout:', errorDetails);
    } else if (!error.response) {
      // Handle network errors
      console.error('Network error:', errorDetails);
    }

    // Enhance error object with more details
    const enhancedError = {
      ...error,
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
      details: error.response?.data,
      timestamp: errorDetails.timestamp
    };

    return Promise.reject(enhancedError);
  }
);

// Add a helper function to format error messages
const formatErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';

  if (error.response?.data?.message) {
    let message = error.response.data.message;
    if (error.response.data.details) {
      message += `: ${error.response.data.details}`;
    }
    return message;
  }

  if (error.message?.includes('Network Error')) {
    return 'Unable to connect to the server. Please check if the backend is running.';
  }

  return error.message || 'An unexpected error occurred';
};

// Auth endpoints
export const login = async (credentials) => {
  try {
    // Validate credentials
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }

    // Normalize email
    credentials.email = credentials.email.trim().toLowerCase();

    // Log the attempt (without sensitive data)
    console.log('Attempting login for email:', credentials.email);

    // Attempt login
    const response = await api.post('/auth/login', credentials);
    
    // Validate response
    if (!response?.data) {
      throw new Error('Invalid response from server');
    }

    if (!response.data.token) {
      throw new Error('Invalid response: Missing authentication token');
    }

    // Store auth data
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('userId', response.data.userId);
    localStorage.setItem('userRole', response.data.role || 'student');

    console.log('Login successful for role:', response.data.role);
    return response;
  } catch (error) {
    console.error('Login error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    throw new Error(formatErrorMessage(error));
  }
};

export const register = async (userData) => {
  try {
    // Validate user data
    if (!userData.email || !userData.password || !userData.name) {
      throw new Error('Name, email, and password are required');
    }

    // Normalize email and trim fields
    userData.email = userData.email.trim().toLowerCase();
    userData.name = userData.name.trim();

    console.log('Attempting registration for email:', userData.email);

    const response = await api.post('/auth/register', userData);
    
    // Validate response
    if (!response?.data?.token) {
      throw new Error('Invalid response: Missing authentication token');
    }

    // Store auth data
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('userId', response.data.userId);
    localStorage.setItem('userRole', response.data.role || 'student');

    console.log('Registration successful for role:', response.data.role);
    return response;
  } catch (error) {
    console.error('Registration error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    throw new Error(formatErrorMessage(error));
  }
};

// Course endpoints
export const getCourses = () => {
  return api.get('/Courses');
};

export const getCourse = (id) => {
  return api.get(`/Courses/${id}`);
};

export const createCourse = (data) => {
  return api.post('/Courses', data);
};

export const enrollInCourse = async (courseId) => {
  try {
    console.log('Enrolling in course with ID:', courseId);
    
    // Validate courseId
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    // Ensure courseId is a valid GUID
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guidRegex.test(courseId)) {
      throw new Error('Invalid course ID format');
    }

    // Log request details
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    console.log('Request details:', {
      courseId,
      userId,
      hasToken: !!token,
      url: `/Enrollments/enroll`
    });

    const response = await api.post(`/Enrollments/enroll`, { courseId });
    console.log('Enrollment response:', response.data);
    return response;
  } catch (error) {
    console.error('Enrollment error:', {
      courseId,
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      details: error.response?.data?.message
    });
    throw error;
  }
};

export const deleteCourse = async (id) => {
  try {
    if (!id) {
      throw new Error('Course ID is required');
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    // Log the request details for debugging
    console.log('Deleting course:', {
      id,
      timestamp: new Date().toISOString()
    });

    const response = await api.delete(`/Courses/${id}`);
    
    // Log successful deletion
    console.log('Course deleted successfully:', {
      id,
      response: response.data,
      timestamp: new Date().toISOString()
    });
    
    return response;
  } catch (error) {
    // Log the complete error for debugging
    console.error('API Error:', {
      id,
      error: error,
      response: error.response,
      timestamp: new Date().toISOString()
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      localStorage.clear();
      throw new Error('Session expired. Please log in again.');
    } else if (error.response?.status === 403) {
      throw new Error('You do not have permission to delete this course.');
    } else if (error.response?.status === 404) {
      throw new Error('Course not found.');
    }

    // For server errors (500), include more details
    if (error.response?.status === 500) {
      console.error('Server error:', error.response?.data);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.details || 
        'A server error occurred while deleting the course. Please try again later.'
      );
    }

    // Create a standardized error object for other cases
    const enhancedError = new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to delete course'
    );
    
    enhancedError.status = error.response?.status || 500;
    enhancedError.data = error.response?.data;
    
    throw enhancedError;
  }
};

// Assessment endpoints
export const getAssessments = () => {
  return api.get('/assessments');
};

export const getAssessment = (id) => {
  return api.get(`/assessments/${id}`);
};

export const createAssessment = (assessmentData) => {
  return api.post('/assessments', assessmentData);
};

// Add a helper function to extract error details
const extractErrorDetails = (error) => {
  if (!error) return null;
  
  return {
    message: error.message || 'Unknown error',
    status: error.status || error.response?.status || 500,
    data: error.response?.data || error.data,
    details: error.details || {},
    stack: error.stack,
    timestamp: new Date().toISOString()
  };
};

// Add a helper function to format error for logging
const formatErrorForLogging = (prefix, error) => {
  const details = extractErrorDetails(error);
  console.error(`${prefix}:`, {
    ...details,
    originalError: error
  });
  return details;
};

// Add debug logging helper
const debugLog = (label, data) => {
  console.log(`[DEBUG] ${label}:`, JSON.stringify(data, null, 2));
};

export const deleteAssessment = async (id) => {
  try {
    if (!id) {
      throw new Error('Assessment ID is required');
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    // Log the request details for debugging
    console.log('Deleting assessment:', {
      id,
      config,
      timestamp: new Date().toISOString()
    });

    const response = await api.delete(`/assessments/${id}`, config);
    
    // Log successful deletion
    console.log('Assessment deleted successfully:', {
      id,
      response: response.data,
      timestamp: new Date().toISOString()
    });
    
    return response;
  } catch (error) {
    // Log the complete error for debugging
    console.error('API Error:', {
      id,
      error: error,
      response: error.response,
      timestamp: new Date().toISOString()
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      localStorage.clear();
      throw new Error('Session expired. Please log in again.');
    } else if (error.response?.status === 403) {
      throw new Error('You do not have permission to delete this assessment.');
    } else if (error.response?.status === 404) {
      throw new Error('Assessment not found.');
    }

    // For server errors (500), include more details
    if (error.response?.status === 500) {
      console.error('Server error:', error.response?.data);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.details || 
        'A server error occurred while deleting the assessment. Please try again later.'
      );
    }

    // Create a standardized error object for other cases
    const enhancedError = new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to delete assessment'
    );
    
    enhancedError.status = error.response?.status || 500;
    enhancedError.data = error.response?.data;
    
    throw enhancedError;
  }
};

export const submitAssessment = async (id, data) => {
  try {
    // Validate input parameters
    if (!id) {
      throw new Error('Assessment ID is required');
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    // Ensure userId is a valid GUID
    const userId = localStorage.getItem('userId');
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      throw new Error('Invalid user ID');
    }

    // Validate answers data
    if (!data.answers || !Array.isArray(data.answers) || data.answers.length === 0) {
      throw new Error('Invalid answers data');
    }

    // Format the submission data to match AssessmentSubmissionDTO
    const formattedData = {
      userId: userId,
      answers: data.answers.map(answer => ({
        questionIndex: parseInt(answer.questionIndex),
        selectedAnswer: parseInt(answer.selectedAnswer)
      })).filter(answer => !isNaN(answer.questionIndex) && !isNaN(answer.selectedAnswer)),
      timeTaken: Math.max(1, Math.round(data.timeTaken || 0)),
      isAutoSubmit: Boolean(data.isAutoSubmit)
    };

    // Log the request data for debugging
    console.log('Submitting assessment data:', {
      assessmentId: id,
      formattedData: {
        ...formattedData,
        userId: formattedData.userId.substring(0, 8) + '...'
      }
    });

    const response = await api.post(`/assessments/${id}/submit`, formattedData);
    
    // Cache the submission data temporarily
    if (response.data) {
      localStorage.setItem('submissionData', JSON.stringify(response.data));
      localStorage.setItem('lastSubmittedAssessment', id);
      localStorage.setItem('lastSubmissionTime', new Date().toISOString());
    }

    // Validate response data
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Invalid response format from server');
    }

    // Log successful submission
    console.log('Assessment submission successful:', {
      status: response.status,
      resultId: response.data.resultId,
      score: response.data.score,
      questionsAttempted: response.data.questionsAttempted,
      totalQuestions: response.data.totalQuestions
    });

    return response;
  } catch (error) {
    // Enhanced error logging
    const errorDetails = {
      error: {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config ? {
          url: error.config.url,
          method: error.config.method,
          data: JSON.parse(error.config.data || '{}')
        } : undefined
      }
    };

    console.error('Assessment submission error:', errorDetails);

    // Handle specific error cases
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Authentication failed. Please log in again.');
    } else if (error.response?.status === 400) {
      const errorMessage = error.response.data.message || 'Invalid submission data';
      console.error('Validation error:', errorMessage);
      throw new Error(errorMessage);
    } else if (error.response?.status === 404) {
      throw new Error('Assessment not found');
    } else if (error.response?.status === 500) {
      console.error('Server error details:', error.response.data);
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    } else if (!error.response) {
      throw new Error('Network error. Please check your connection.');
    }
    
    throw error;
  }
};

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
        return { data: JSON.parse(submissionData) };
      }
    }

    // Otherwise fetch from server
    const response = await api.get(`/assessments/${id}/results`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Assessment results response:', response.data);
    return response;
  } catch (error) {
    console.error('Error fetching assessment results:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    throw error;
  }
};

export const getResults = () => {
  return api.get('/Results');
};

export default api; 
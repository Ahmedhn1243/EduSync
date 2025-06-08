import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import CourseUpload from './pages/CourseUpload';
import AssessmentUpload from './pages/AssessmentUpload';
import CourseList from './pages/CourseList';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';
import AssessmentView from './pages/AssessmentView';
import AssessmentList from './pages/AssessmentList';
import CourseView from './pages/CourseView';
import AssessmentResults from './pages/AssessmentResults';
import LandingPage from './pages/LandingPage';
import StudentProfile from './pages/StudentProfile';
import InstructorProfile from './pages/InstructorProfile';
import './App.css';

const PrivateRoute = ({ children, roles }) => {
  const isAuthenticated = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(userRole)) {
    return <Navigate to="/" />;
  }

  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/student-dashboard" element={
          <PrivateRoute roles={['student']}>
            <StudentDashboard />
          </PrivateRoute>
        } />
        
        <Route path="/instructor-dashboard" element={
          <PrivateRoute roles={['instructor']}>
            <InstructorDashboard />
          </PrivateRoute>
        } />
        
        <Route path="/student-profile" element={
          <PrivateRoute roles={['student']}>
            <StudentProfile />
          </PrivateRoute>
        } />
        
        <Route path="/instructor-profile" element={
          <PrivateRoute roles={['instructor']}>
            <InstructorProfile />
          </PrivateRoute>
        } />
        
        <Route path="/course-upload" element={
          <PrivateRoute roles={['instructor']}>
            <CourseUpload />
          </PrivateRoute>
        } />
        
        <Route path="/assessment-upload" element={
          <PrivateRoute roles={['instructor']}>
            <AssessmentUpload />
          </PrivateRoute>
        } />
        
        <Route path="/courses" element={
          <PrivateRoute roles={['student', 'instructor']}>
            <CourseList />
          </PrivateRoute>
        } />
        
        <Route path="/courses/:id" element={
          <PrivateRoute roles={['student', 'instructor']}>
            <CourseView />
          </PrivateRoute>
        } />
        
        <Route path="/courses/:id/enrollments" element={
          <PrivateRoute roles={['instructor']}>
            <CourseView enrollmentsView={true} />
          </PrivateRoute>
        } />
        
        <Route path="/assessments" element={
          <PrivateRoute roles={['student']}>
            <AssessmentList />
          </PrivateRoute>
        } />
        
        <Route path="/assessments/:id" element={
          <PrivateRoute roles={['instructor']}>
            <AssessmentView />
          </PrivateRoute>
        } />
        
        <Route path="/assessments/:id/results" element={
          <PrivateRoute roles={['instructor']}>
            <AssessmentResults />
          </PrivateRoute>
        } />
        
        <Route path="/quiz/:id" element={
          <PrivateRoute roles={['student']}>
            <QuizPage />
          </PrivateRoute>
        } />
        
        <Route path="/results/:id" element={
          <PrivateRoute roles={['student']}>
            <ResultsPage />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
};

export default App;

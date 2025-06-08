import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCourses } from '../api';
import './CourseList.css';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await getCourses();
        setCourses(response.data);
      } catch (err) {
        setError('Failed to fetch courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = (course.Title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (course.Description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || course.Level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  if (loading) {
    return <div className="loading">Loading courses...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="course-list">
      <div className="course-list-header">
        <h1>Available Courses</h1>
        <div className="filters">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="level-filter"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="no-courses">
          No courses found matching your criteria.
        </div>
      ) : (
        <div className="grid">
          {filteredCourses.map((course) => (
            <div key={course.CourseId} className="card">
              <div className="card-header">
                <h3 className="card-title">{course.Title}</h3>
                <span className={`level-badge ${course.Level}`}>
                  {course.Level}
                </span>
              </div>
              <p className="card-description">{course.Description}</p>
              <div className="card-meta">
                <span>Duration: {course.Duration} hours</span>
                <span>Students: {course.EnrolledStudents?.length || 0}</span>
              </div>
              <div className="card-footer">
                <Link to={`/courses/${course.CourseId}`} className="btn btn-primary">
                  View Course
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseList; 
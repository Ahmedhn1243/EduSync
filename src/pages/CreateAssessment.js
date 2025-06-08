const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);
  setError('');

  try {
    // Validate questions
    const validQuestions = questions.filter(q => 
      q.question.trim() !== '' && 
      q.options.every(opt => opt.trim() !== '') &&
      q.correctAnswer !== null
    );

    if (validQuestions.length === 0) {
      throw new Error('Please add at least one valid question with all options and correct answer');
    }

    // Format questions for submission
    const formattedQuestions = validQuestions.map(q => ({
      question: q.question.trim(),
      options: q.options.map(opt => opt.trim()),
      correctAnswer: parseInt(q.correctAnswer)
    }));

    console.log('Creating assessment with questions:', formattedQuestions);

    const response = await createAssessment({
      title: title.trim(),
      courseId: selectedCourse,
      questions: JSON.stringify(formattedQuestions),
      maxScore: 100,
      duration: parseInt(duration) || 30
    });

    console.log('Assessment created:', response.data);
    navigate('/instructor-dashboard');
  } catch (err) {
    console.error('Error creating assessment:', err);
    setError(err.response?.data?.message || err.message || 'Failed to create assessment');
  } finally {
    setSubmitting(false);
  }
};

const handleQuestionChange = (index, field, value) => {
  setQuestions(prev => {
    const updated = [...prev];
    if (field === 'options') {
      updated[index] = {
        ...updated[index],
        options: value
      };
    } else if (field === 'correctAnswer') {
      updated[index] = {
        ...updated[index],
        correctAnswer: parseInt(value)
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value
      };
    }
    return updated;
  });
}; 
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import './QuizEditorPage.css'

function QuizEditorPage() {
  const navigate = useNavigate()
  const { quizId } = useParams()

  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    checkUserAndLoadQuiz()
  }, [quizId])

  const checkUserAndLoadQuiz = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/login')
      return
    }
    setUser(session.user)
    await loadQuiz(session.user.id)
  }

  const loadQuiz = async (userId) => {
    setLoading(true)
    try {
      // Load quiz
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .eq('user_id', userId)
        .single()

      if (quizError) throw quizError
      if (!quizData) {
        alert('Quiz not found')
        navigate('/quiz-builder')
        return
      }

      setQuiz(quizData)

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true })

      if (questionsError) throw questionsError
      setQuestions(questionsData || [])
    } catch (error) {
      console.error('Error loading quiz:', error)
      alert('Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  const updateQuizName = async (newName) => {
    if (!newName.trim()) return

    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ name: newName.trim() })
        .eq('id', quizId)

      if (error) throw error
      setQuiz({ ...quiz, name: newName.trim() })
    } catch (error) {
      console.error('Error updating quiz name:', error)
      alert('Failed to update quiz name')
    }
  }

  const addQuestion = async () => {
    try {
      // Get the highest order_index for this quiz to avoid duplicates
      const maxOrderIndex = questions.length > 0
        ? Math.max(...questions.map(q => q.order_index))
        : -1;

      const newQuestion = {
        quiz_id: quizId,
        question_type: 'true_false',
        text: 'New question',
        time_limit: 20,
        correct_answer: ['0'],  // Array with index 0 (True) as default
        options: ['True', 'False'],  // Array of options as per schema
        randomize_options: true,  // Randomize by default
        order_index: maxOrderIndex + 1
      }

      const { data, error } = await supabase
        .from('questions')
        .insert(newQuestion)
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      setQuestions([...questions, data])
      setSelectedQuestionIndex(questions.length)
    } catch (error) {
      console.error('Error adding question:', error)
      alert(`Failed to add question: ${error.message}`)
    }
  }

  const updateQuestion = async (index, updates) => {
    try {
      const question = questions[index]
      const { error } = await supabase
        .from('questions')
        .update(updates)
        .eq('id', question.id)

      if (error) throw error

      const newQuestions = [...questions]
      newQuestions[index] = { ...question, ...updates }
      setQuestions(newQuestions)
    } catch (error) {
      console.error('Error updating question:', error)
      alert('Failed to update question')
    }
  }

  const deleteQuestion = async (index) => {
    if (!confirm('Delete this question?')) return

    try {
      const question = questions[index]
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', question.id)

      if (error) throw error

      const newQuestions = questions.filter((_, i) => i !== index)
      setQuestions(newQuestions)

      if (selectedQuestionIndex >= newQuestions.length) {
        setSelectedQuestionIndex(Math.max(0, newQuestions.length - 1))
      }
    } catch (error) {
      console.error('Error deleting question:', error)
      alert('Failed to delete question')
    }
  }

  const handleStartQuiz = async () => {
    if (questions.length === 0) {
      alert('Add at least one question before starting the quiz')
      return
    }

    try {
      const { data: joinCodeData } = await supabase.rpc('generate_join_code')

      const { data: session, error: sessionError } = await supabase
        .from('quiz_sessions')
        .insert({
          quiz_id: quizId,
          host_user_id: user.id,
          join_code: joinCodeData,
          status: 'lobby'
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      navigate(`/quiz-lobby/${session.id}`)
    } catch (error) {
      console.error('Error starting quiz:', error)
      alert('Failed to start quiz session')
    }
  }

  if (loading) {
    return (
      <div className="quiz-editor-container">
        <div className="loading-state">Loading quiz...</div>
      </div>
    )
  }

  const selectedQuestion = questions[selectedQuestionIndex]

  return (
    <div className="quiz-editor-container">
      <div className="quiz-editor-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/quiz-builder')}>
            ← Back
          </button>
          <input
            type="text"
            className="quiz-title-input"
            value={quiz?.name || ''}
            onChange={(e) => setQuiz({ ...quiz, name: e.target.value })}
            onBlur={(e) => updateQuizName(e.target.value)}
            placeholder="Quiz Title"
          />
          <span className="question-count-badge">
            {questions.length} question{questions.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          className="btn-play-header"
          onClick={handleStartQuiz}
          disabled={questions.length === 0}
        >
          ▶️ Play
        </button>
      </div>

      <div className="quiz-editor-content">
        <div className="questions-sidebar">
          <div className="sidebar-header">
            <h3>Questions</h3>
            <button className="btn-add-question-compact" onClick={addQuestion} title="Add question">
              +
            </button>
          </div>
          <div className="questions-list">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className={`question-card ${index === selectedQuestionIndex ? 'selected' : ''}`}
                onClick={() => setSelectedQuestionIndex(index)}
              >
                <div className="question-card-header">
                  <span className="question-number">{index + 1}</span>
                  <span className="question-type-icon">
                    {q.question_type === 'true_false' ? '✓/✗' : '☰'}
                  </span>
                </div>
                <div className="question-preview">
                  {q.text || 'Empty question'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="question-editor">
          {questions.length === 0 ? (
            <div className="empty-editor">
              <div className="empty-icon">❓</div>
              <h3>No questions yet</h3>
              <p>Create your first question to get started</p>
              <button className="btn-add-question-large" onClick={addQuestion}>
                + Add Question
              </button>
            </div>
          ) : selectedQuestion ? (
            <QuestionEditor
              question={selectedQuestion}
              questionNumber={selectedQuestionIndex + 1}
              onUpdate={(updates) => updateQuestion(selectedQuestionIndex, updates)}
              onDelete={() => deleteQuestion(selectedQuestionIndex)}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function QuestionEditor({ question, questionNumber, onUpdate, onDelete }) {
  const [localQuestion, setLocalQuestion] = useState(question)

  useEffect(() => {
    setLocalQuestion(question)
  }, [question])

  const handleBlur = (field, value) => {
    if (value !== question[field]) {
      onUpdate({ [field]: value })
    }
  }

  const handleTypeChange = (newType) => {
    const updates = { question_type: newType }
    if (newType === 'true_false') {
      updates.options = ['True', 'False']
      updates.correct_answer = ['0']  // Index 0 = True
    } else {
      updates.options = ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4']
      updates.correct_answer = ['0']  // Array with first choice selected
    }
    onUpdate(updates)
  }

  const updateChoice = (index, value) => {
    const newOptions = [...(localQuestion.options || [])]
    newOptions[index] = value
    setLocalQuestion({
      ...localQuestion,
      options: newOptions
    })
  }

  const saveChoices = () => {
    onUpdate({ options: localQuestion.options })
  }

  const toggleCorrectAnswer = (answer) => {
    const answerStr = String(answer)
    const currentAnswers = Array.isArray(localQuestion.correct_answer)
      ? localQuestion.correct_answer
      : [localQuestion.correct_answer]

    let newAnswers
    if (currentAnswers.includes(answerStr)) {
      // Remove if already selected (but keep at least one)
      newAnswers = currentAnswers.filter(a => a !== answerStr)
      if (newAnswers.length === 0) {
        newAnswers = [answerStr] // Keep at least one selected
      }
    } else {
      // Add to selection
      newAnswers = [...currentAnswers, answerStr]
    }

    // Optimistic update for immediate UI feedback
    setLocalQuestion({
      ...localQuestion,
      correct_answer: newAnswers
    })
    onUpdate({ correct_answer: newAnswers })
  }

  const addChoice = () => {
    const newOptions = [...(localQuestion.options || [])]
    if (newOptions.length < 6) {
      newOptions.push(`Choice ${newOptions.length + 1}`)
      onUpdate({ options: newOptions })
    }
  }

  const removeChoice = (index) => {
    const newOptions = [...(localQuestion.options || [])]
    if (newOptions.length > 2) {
      newOptions.splice(index, 1)

      // Adjust correct_answer array if needed
      const currentAnswers = Array.isArray(localQuestion.correct_answer)
        ? localQuestion.correct_answer
        : [localQuestion.correct_answer]

      let newCorrectAnswers = currentAnswers
        .filter(a => parseInt(a) !== index) // Remove deleted index
        .map(a => {
          const idx = parseInt(a)
          return idx > index ? String(idx - 1) : a // Shift down indices after deleted
        })

      // Ensure at least one correct answer remains
      if (newCorrectAnswers.length === 0) {
        newCorrectAnswers = ['0']
      }

      onUpdate({ options: newOptions, correct_answer: newCorrectAnswers })
    }
  }

  return (
    <div className="question-editor-form">
      <div className="editor-header">
        <h2>Question {questionNumber}</h2>
        <button type="button" className="btn-delete-question" onClick={onDelete}>
          🗑️ Delete
        </button>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Question Type</label>
          <select
            value={localQuestion.question_type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="select-input"
          >
            <option value="true_false">True / False</option>
            <option value="multiple_choice">Multiple Choice</option>
          </select>
        </div>

        <div className="form-group">
          <label>Time Limit (seconds)</label>
          <input
            type="number"
            min="10"
            max="60"
            value={localQuestion.time_limit}
            onChange={(e) => setLocalQuestion({ ...localQuestion, time_limit: parseInt(e.target.value) })}
            onBlur={(e) => handleBlur('time_limit', parseInt(e.target.value))}
            className="number-input"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Question</label>
        <textarea
          value={localQuestion.text}
          onChange={(e) => setLocalQuestion({ ...localQuestion, text: e.target.value })}
          onBlur={(e) => handleBlur('text', e.target.value)}
          placeholder="Enter your question here"
          className="textarea-input"
          rows="3"
        />
      </div>

      {localQuestion.question_type === 'true_false' ? (
        <div className="form-group">
          <label>Correct Answer</label>
          <div className="true-false-options">
            <button
              type="button"
              className={`tf-option ${(Array.isArray(localQuestion.correct_answer) ? localQuestion.correct_answer : [localQuestion.correct_answer]).includes('0') ? 'selected' : ''}`}
              onClick={() => toggleCorrectAnswer('0')}
            >
              ✓ True
            </button>
            <button
              type="button"
              className={`tf-option ${(Array.isArray(localQuestion.correct_answer) ? localQuestion.correct_answer : [localQuestion.correct_answer]).includes('1') ? 'selected' : ''}`}
              onClick={() => toggleCorrectAnswer('1')}
            >
              ✗ False
            </button>
          </div>
        </div>
      ) : (
        <div className="form-group">
          <label>Answer Choices</label>
          <div className="choices-list">
            {(localQuestion.options || []).map((_, index) => {
              const correctAnswers = Array.isArray(localQuestion.correct_answer)
                ? localQuestion.correct_answer
                : [localQuestion.correct_answer]
              const isCorrect = correctAnswers.includes(String(index))
              return (
                <div key={index} className="choice-item">
                  <button
                    type="button"
                    className={`choice-toggle ${isCorrect ? 'correct' : 'incorrect'}`}
                    onClick={() => toggleCorrectAnswer(index)}
                    title={isCorrect ? 'Correct answer' : 'Incorrect answer'}
                  >
                    {isCorrect ? '✓' : '✕'}
                  </button>
                  <input
                    type="text"
                    value={localQuestion.options?.[index] || ''}
                    onChange={(e) => updateChoice(index, e.target.value)}
                    onBlur={saveChoices}
                    placeholder={`Choice ${index + 1}`}
                    className="choice-input"
                  />
                  {(localQuestion.options || []).length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeChoice(index)}
                      className="btn-remove-choice"
                      title="Remove this choice"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          {(localQuestion.options || []).length < 6 && (
            <button
              type="button"
              onClick={addChoice}
              className="btn-add-choice"
            >
              + Add Choice
            </button>
          )}
          <div className="randomize-toggle-container">
            <div className="randomize-label">Randomize answer order in-game</div>
            <div className="randomize-toggle-buttons">
              <button
                type="button"
                className={`randomize-toggle-btn ${localQuestion.randomize_options === false ? 'selected' : ''}`}
                onClick={() => {
                  setLocalQuestion({ ...localQuestion, randomize_options: false })
                  onUpdate({ randomize_options: false })
                }}
              >
                ✕
              </button>
              <button
                type="button"
                className={`randomize-toggle-btn ${localQuestion.randomize_options !== false ? 'selected' : ''}`}
                onClick={() => {
                  setLocalQuestion({ ...localQuestion, randomize_options: true })
                  onUpdate({ randomize_options: true })
                }}
              >
                ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuizEditorPage

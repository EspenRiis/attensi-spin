import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import './QuizListPage.css'

function QuizListPage() {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newQuizName, setNewQuizName] = useState('')
  const [newQuizDescription, setNewQuizDescription] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/login')
      return
    }
    setUser(session.user)
    loadQuizzes(session.user.id)
  }

  const loadQuizzes = async (userId) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          questions(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setQuizzes(data || [])
    } catch (error) {
      console.error('Error loading quizzes:', error)
      alert('Failed to load quizzes')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQuiz = async (e) => {
    e.preventDefault()
    if (!newQuizName.trim() || !user) return

    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          user_id: user.id,
          name: newQuizName.trim(),
          description: newQuizDescription.trim() || null
        })
        .select()
        .single()

      if (error) throw error

      // Navigate to editor
      navigate(`/quiz-builder/${data.id}`)
    } catch (error) {
      console.error('Error creating quiz:', error)
      alert('Failed to create quiz')
      setCreating(false)
    }
  }

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm('Are you sure you want to delete this quiz? This cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)

      if (error) throw error

      setQuizzes(quizzes.filter(q => q.id !== quizId))
    } catch (error) {
      console.error('Error deleting quiz:', error)
      alert('Failed to delete quiz')
    }
  }

  const handleStartSession = async (quizId) => {
    // Navigate directly to lobby - session will be created there
    navigate(`/quiz-race/${quizId}/lobby`)
  }

  if (loading) {
    return (
      <div className="quiz-list-container">
        <div className="loading-state">Loading your quizzes...</div>
      </div>
    )
  }

  return (
    <div className="quiz-list-container">
      <div className="quiz-list-header">
        <h1>My Quizzes</h1>
        <div className="btn-create-quiz-wrapper">
          <button
            className="btn-create-quiz"
            onClick={() => setShowCreateModal(true)}
          >
            + Create New Quiz
          </button>
        </div>
      </div>

      {quizzes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h2>No quizzes yet</h2>
          <p>Create your first quiz to get started!</p>
          <button
            className="btn-create-quiz"
            onClick={() => setShowCreateModal(true)}
          >
            Create Your First Quiz
          </button>
        </div>
      ) : (
        <div className="quiz-grid">
          {quizzes.map(quiz => {
            const questionCount = quiz.questions?.[0]?.count || 0
            const hasQuestions = questionCount > 0

            return (
              <div key={quiz.id} className="quiz-card">
                <div className="quiz-card-header">
                  <div className="quiz-thumbnail">
                    <span className="quiz-icon">🎯</span>
                  </div>
                  <div className="quiz-info">
                    <h3>{quiz.name}</h3>
                    {quiz.description && (
                      <p className="quiz-description">{quiz.description}</p>
                    )}
                  </div>
                  <div className="quiz-actions-top">
                    <button
                      className="btn-icon btn-edit-icon"
                      onClick={() => navigate(`/quiz-builder/${quiz.id}`)}
                      title="Edit quiz"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon btn-delete-icon"
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      title="Delete quiz"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="quiz-card-meta">
                  <span className="meta-item">
                    <span className="meta-icon">📝</span>
                    {questionCount} question{questionCount !== 1 ? 's' : ''}
                  </span>
                  <span className="meta-item">
                    <span className="meta-icon">📅</span>
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="quiz-card-actions">
                  <button
                    className="btn-edit-secondary"
                    onClick={() => navigate(`/quiz-builder/${quiz.id}`)}
                  >
                    <span className="action-icon">✏️</span>
                    Edit
                  </button>
                  <button
                    className="btn-play-primary"
                    onClick={() => handleStartSession(quiz.id)}
                    disabled={!hasQuestions}
                    title={!hasQuestions ? 'Add questions to start quiz' : 'Start a new quiz session'}
                  >
                    <span className="play-icon">▶️</span>
                    Play
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => !creating && setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Quiz</h2>
            <form onSubmit={handleCreateQuiz}>
              <div className="form-group">
                <label htmlFor="quiz-name">Quiz Name *</label>
                <input
                  id="quiz-name"
                  type="text"
                  value={newQuizName}
                  onChange={(e) => setNewQuizName(e.target.value)}
                  placeholder="e.g., Company Trivia 2025"
                  maxLength={200}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="quiz-description">Description (optional)</label>
                <textarea
                  id="quiz-description"
                  value={newQuizDescription}
                  onChange={(e) => setNewQuizDescription(e.target.value)}
                  placeholder="What's this quiz about?"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={!newQuizName.trim() || creating}
                >
                  {creating ? 'Creating...' : 'Create Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuizListPage

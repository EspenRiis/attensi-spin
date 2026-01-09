import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './styles/PollEditorPage.css';

function PollEditorPage() {
  const navigate = useNavigate();
  const { pollId } = useParams();

  const [poll, setPoll] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUserAndLoadPoll();
  }, [pollId]);

  const checkUserAndLoadPoll = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }
    setUser(session.user);
    await loadPoll(session.user.id);
  };

  const loadPoll = async (userId) => {
    setLoading(true);
    try {
      // Load poll
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .eq('user_id', userId)
        .single();

      if (pollError) throw pollError;
      if (!pollData) {
        alert('Poll not found');
        navigate('/polling');
        return;
      }

      setPoll(pollData);

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('poll_questions')
        .select('*')
        .eq('poll_id', pollId)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
    } catch (error) {
      console.error('Error loading poll:', error);
      alert('Failed to load poll');
    } finally {
      setLoading(false);
    }
  };

  const updatePollName = async (newName) => {
    if (!newName.trim()) return;

    try {
      const { error } = await supabase
        .from('polls')
        .update({ name: newName.trim() })
        .eq('id', pollId);

      if (error) throw error;
      setPoll({ ...poll, name: newName.trim() });
    } catch (error) {
      console.error('Error updating poll name:', error);
      alert('Failed to update poll name');
    }
  };

  const addQuestion = async () => {
    try {
      const maxOrderIndex = questions.length > 0
        ? Math.max(...questions.map(q => q.order_index))
        : -1;

      const newQuestion = {
        poll_id: pollId,
        text: 'New question',
        min_value: 0,
        max_value: 100,
        min_label: 'Strongly Disagree',
        max_label: 'Strongly Agree',
        order_index: maxOrderIndex + 1
      };

      const { data, error } = await supabase
        .from('poll_questions')
        .insert(newQuestion)
        .select()
        .single();

      if (error) throw error;

      setQuestions([...questions, data]);
      setSelectedQuestionIndex(questions.length);
    } catch (error) {
      console.error('Error adding question:', error);
      alert(`Failed to add question: ${error.message}`);
    }
  };

  const updateQuestion = async (index, updates) => {
    try {
      const question = questions[index];
      const { error } = await supabase
        .from('poll_questions')
        .update(updates)
        .eq('id', question.id);

      if (error) throw error;

      const newQuestions = [...questions];
      newQuestions[index] = { ...question, ...updates };
      setQuestions(newQuestions);
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Failed to update question');
    }
  };

  const deleteQuestion = async (index) => {
    if (!confirm('Delete this question?')) return;

    try {
      const question = questions[index];
      const { error } = await supabase
        .from('poll_questions')
        .delete()
        .eq('id', question.id);

      if (error) throw error;

      const newQuestions = questions.filter((_, i) => i !== index);
      setQuestions(newQuestions);

      if (selectedQuestionIndex >= newQuestions.length) {
        setSelectedQuestionIndex(Math.max(0, newQuestions.length - 1));
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question');
    }
  };

  const moveQuestion = async (fromIndex, direction) => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= questions.length) return;

    try {
      const newQuestions = [...questions];
      [newQuestions[fromIndex], newQuestions[toIndex]] =
        [newQuestions[toIndex], newQuestions[fromIndex]];

      // Update order_index for both questions
      await supabase
        .from('poll_questions')
        .update({ order_index: toIndex })
        .eq('id', questions[fromIndex].id);

      await supabase
        .from('poll_questions')
        .update({ order_index: fromIndex })
        .eq('id', questions[toIndex].id);

      newQuestions[fromIndex].order_index = fromIndex;
      newQuestions[toIndex].order_index = toIndex;

      setQuestions(newQuestions);
      setSelectedQuestionIndex(toIndex);
    } catch (error) {
      console.error('Error reordering questions:', error);
      alert('Failed to reorder questions');
    }
  };

  const handleStartPoll = async () => {
    if (questions.length === 0) {
      alert('Add at least one question before starting the poll');
      return;
    }

    try {
      // Generate join code
      const { data: joinCodeData, error: joinCodeError } = await supabase
        .rpc('generate_join_code');

      if (joinCodeError) throw joinCodeError;

      // Create poll session with first question active
      const { data: sessionData, error: sessionError } = await supabase
        .from('poll_sessions')
        .insert({
          poll_id: pollId,
          host_user_id: user.id,
          join_code: joinCodeData,
          status: 'active',
          current_question_id: questions[0].id,
          current_question_index: 0,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Navigate directly to host view (no lobby)
      navigate(`/polling/${sessionData.id}/host`);
    } catch (error) {
      console.error('Error starting poll:', error);
      alert('Failed to start poll session');
    }
  };

  if (loading) {
    return (
      <div className="poll-editor-container">
        <div className="loading-state">Loading poll...</div>
      </div>
    );
  }

  const selectedQuestion = questions[selectedQuestionIndex];

  return (
    <div className="poll-editor-container">
      {/* Header */}
      <div className="editor-header">
        <button
          className="btn-back"
          onClick={() => navigate('/polling')}
        >
          ← Back to Polls
        </button>
        <input
          type="text"
          className="poll-name-input"
          value={poll?.name || ''}
          onChange={(e) => setPoll({ ...poll, name: e.target.value })}
          onBlur={(e) => updatePollName(e.target.value)}
          placeholder="Poll name"
        />
        <button
          className="btn-start-poll"
          onClick={handleStartPoll}
          disabled={questions.length === 0}
        >
          Start Poll
        </button>
      </div>

      <div className="editor-content">
        {/* Questions Sidebar */}
        <div className="questions-sidebar">
          <div className="sidebar-header">
            <h3>Questions ({questions.length})</h3>
            <button className="btn-add-question" onClick={addQuestion}>
              + Add
            </button>
          </div>

          <div className="questions-list">
            {questions.length === 0 ? (
              <div className="empty-questions">
                <p>No questions yet</p>
                <button onClick={addQuestion}>Add First Question</button>
              </div>
            ) : (
              questions.map((q, index) => (
                <div
                  key={q.id}
                  className={`question-item ${index === selectedQuestionIndex ? 'selected' : ''}`}
                  onClick={() => setSelectedQuestionIndex(index)}
                >
                  <div className="question-number">Q{index + 1}</div>
                  <div className="question-preview">{q.text}</div>
                  <div className="question-actions">
                    <button
                      className="btn-move-up"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveQuestion(index, 'up');
                      }}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      className="btn-move-down"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveQuestion(index, 'down');
                      }}
                      disabled={index === questions.length - 1}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Question Editor */}
        {selectedQuestion && (
          <div className="question-editor">
            <div className="editor-header-actions">
              <h2>Question {selectedQuestionIndex + 1}</h2>
              <button
                className="btn-delete-question"
                onClick={() => deleteQuestion(selectedQuestionIndex)}
              >
                🗑️ Delete
              </button>
            </div>

            <div className="editor-form">
              <div className="form-group">
                <label>Question Text</label>
                <textarea
                  value={selectedQuestion.text}
                  onChange={(e) => updateQuestion(selectedQuestionIndex, { text: e.target.value })}
                  placeholder="Enter your question..."
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Min Label (0)</label>
                  <input
                    type="text"
                    value={selectedQuestion.min_label || ''}
                    onChange={(e) => updateQuestion(selectedQuestionIndex, { min_label: e.target.value })}
                    placeholder="e.g., Strongly Disagree"
                    maxLength={50}
                  />
                </div>

                <div className="form-group">
                  <label>Max Label (100)</label>
                  <input
                    type="text"
                    value={selectedQuestion.max_label || ''}
                    onChange={(e) => updateQuestion(selectedQuestionIndex, { max_label: e.target.value })}
                    placeholder="e.g., Strongly Agree"
                    maxLength={50}
                  />
                </div>
              </div>

              {/* Slider Preview */}
              <div className="slider-preview">
                <h4>Slider Preview</h4>
                <div className="preview-labels">
                  <span>{selectedQuestion.min_label || '0'}</span>
                  <span>{selectedQuestion.max_label || '100'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="50"
                  className="preview-slider"
                  disabled
                />
                <div className="preview-value">50</div>
              </div>
            </div>
          </div>
        )}

        {!selectedQuestion && questions.length === 0 && (
          <div className="no-question-selected">
            <div className="empty-state-large">
              <span className="empty-icon">📊</span>
              <h2>No questions yet</h2>
              <p>Add your first question to get started</p>
              <button className="btn-add-large" onClick={addQuestion}>
                + Add First Question
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PollEditorPage;

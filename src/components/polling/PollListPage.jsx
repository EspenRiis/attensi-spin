import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './styles/PollListPage.css';

function PollListPage() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPollName, setNewPollName] = useState('');
  const [newPollDescription, setNewPollDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }
    setUser(session.user);
    loadPolls(session.user.id);
  };

  const loadPolls = async (userId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          poll_questions(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPolls(data || []);
    } catch (error) {
      console.error('Error loading polls:', error);
      alert('Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    if (!newPollName.trim() || !user) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('polls')
        .insert({
          user_id: user.id,
          name: newPollName.trim(),
          description: newPollDescription.trim() || null
        })
        .select()
        .single();

      if (error) throw error;

      // Navigate to editor
      navigate(`/polling/builder/${data.id}`);
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Failed to create poll');
      setCreating(false);
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (!confirm('Are you sure you want to delete this poll? This cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', pollId);

      if (error) throw error;

      setPolls(polls.filter(p => p.id !== pollId));
    } catch (error) {
      console.error('Error deleting poll:', error);
      alert('Failed to delete poll');
    }
  };

  const handleStartSession = async (pollId) => {
    // Navigate directly to lobby - session will be created there
    navigate(`/polling/${pollId}/lobby`);
  };

  if (loading) {
    return (
      <div className="poll-list-container">
        <div className="loading-state">Loading your polls...</div>
      </div>
    );
  }

  return (
    <div className="poll-list-container">
      <div className="poll-list-header">
        <h1>My Polls</h1>
        <div className="btn-create-poll-wrapper">
          <button
            className="btn-create-poll"
            onClick={() => setShowCreateModal(true)}
          >
            + Create New Poll
          </button>
        </div>
      </div>

      {polls.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h2>No polls yet</h2>
          <p>Create your first poll to get started!</p>
          <button
            className="btn-create-poll"
            onClick={() => setShowCreateModal(true)}
          >
            Create Your First Poll
          </button>
        </div>
      ) : (
        <div className="poll-grid">
          {polls.map(poll => {
            const questionCount = poll.poll_questions?.[0]?.count || 0;
            const hasQuestions = questionCount > 0;

            return (
              <div key={poll.id} className="poll-card">
                <div className="poll-card-header">
                  <div className="poll-thumbnail">
                    <span className="poll-icon">📊</span>
                  </div>
                  <div className="poll-info">
                    <h3>{poll.name}</h3>
                    {poll.description && (
                      <p className="poll-description">{poll.description}</p>
                    )}
                  </div>
                  <div className="poll-actions-top">
                    <button
                      className="btn-icon btn-edit-icon"
                      onClick={() => navigate(`/polling/builder/${poll.id}`)}
                      title="Edit poll"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon btn-delete-icon"
                      onClick={() => handleDeletePoll(poll.id)}
                      title="Delete poll"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="poll-card-meta">
                  <span className="meta-item">
                    <span className="meta-icon">❓</span>
                    {questionCount} question{questionCount !== 1 ? 's' : ''}
                  </span>
                  <span className="meta-item">
                    <span className="meta-icon">📅</span>
                    {new Date(poll.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="poll-card-actions">
                  <button
                    className="btn-edit-secondary"
                    onClick={() => navigate(`/polling/builder/${poll.id}`)}
                  >
                    <span className="action-icon">✏️</span>
                    Edit
                  </button>
                  <button
                    className="btn-start-primary"
                    onClick={() => handleStartSession(poll.id)}
                    disabled={!hasQuestions}
                    title={!hasQuestions ? 'Add questions to start poll' : 'Start a new polling session'}
                  >
                    <span className="start-icon">▶️</span>
                    Start
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => !creating && setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Poll</h2>
            <form onSubmit={handleCreatePoll}>
              <div className="form-group">
                <label htmlFor="poll-name">Poll Name *</label>
                <input
                  id="poll-name"
                  type="text"
                  value={newPollName}
                  onChange={(e) => setNewPollName(e.target.value)}
                  placeholder="e.g., Team Satisfaction Survey"
                  maxLength={200}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="poll-description">Description (optional)</label>
                <textarea
                  id="poll-description"
                  value={newPollDescription}
                  onChange={(e) => setNewPollDescription(e.target.value)}
                  placeholder="What's this poll about?"
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
                  disabled={!newPollName.trim() || creating}
                >
                  {creating ? 'Creating...' : 'Create Poll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PollListPage;

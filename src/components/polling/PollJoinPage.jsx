import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import './styles/PollJoinPage.css';

const PollJoinPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [poll, setPoll] = useState(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  // Load session and poll information
  useEffect(() => {
    const loadSession = async () => {
      try {
        // Load session
        const { data: sessionData, error: sessionError } = await supabase
          .from('poll_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (sessionError) throw sessionError;

        // Check if session is ended
        if (sessionData.status === 'ended') {
          setError('This poll has ended and is no longer accepting responses.');
          setLoading(false);
          return;
        }

        setSession(sessionData);

        // Load poll
        const { data: pollData, error: pollError } = await supabase
          .from('polls')
          .select('*')
          .eq('id', sessionData.poll_id)
          .single();

        if (pollError) throw pollError;
        setPoll(pollData);

        setLoading(false);
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Failed to load poll session. Please check the link and try again.');
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  // Check if already joined
  useEffect(() => {
    const checkExistingParticipant = async () => {
      const deviceToken = localStorage.getItem(`poll_device_${sessionId}`);
      const participantId = localStorage.getItem(`poll_participant_id_${sessionId}`);

      if (deviceToken && participantId) {
        // Already joined, go directly to respond view
        navigate(`/polling/${sessionId}/respond`);
      }
    };

    checkExistingParticipant();
  }, [sessionId, navigate]);

  const handleJoin = async (e) => {
    e.preventDefault();

    if (joining) return;

    setJoining(true);
    setError(null);

    try {
      // Create participant
      const { data: participantData, error: participantError } = await supabase
        .from('poll_participants')
        .insert({
          poll_session_id: sessionId,
          username: username.trim() || null,
        })
        .select()
        .single();

      if (participantError) throw participantError;

      // Store device token and participant ID
      localStorage.setItem(`poll_device_${sessionId}`, participantData.device_token);
      localStorage.setItem(`poll_participant_id_${sessionId}`, participantData.id);

      // Navigate to respond view
      navigate(`/polling/${sessionId}/respond`);
    } catch (err) {
      console.error('Error joining poll:', err);
      setError('Failed to join poll. Please try again.');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="poll-join-page loading">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          📊
        </motion.div>
        <p>Loading poll...</p>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="poll-join-page error">
        <div className="error-icon">⚠️</div>
        <h2>Oops!</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="poll-join-page">
      <motion.div
        className="join-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="join-header">
          <h1>Join Live Poll</h1>
          <h2>{poll?.name}</h2>
          {session?.status === 'paused' && (
            <span className="status-badge paused">⏸️ Currently Paused</span>
          )}
        </div>

        {/* Join Form */}
        <form onSubmit={handleJoin} className="join-form">
          <div className="form-group">
            <label htmlFor="username">Your Name (Optional)</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name..."
              maxLength={50}
              disabled={joining}
              autoComplete="off"
            />
            <span className="form-hint">
              Your name helps the host identify participants
            </span>
          </div>

          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            className="btn-join"
            disabled={joining}
          >
            {joining ? 'Joining...' : 'Join Poll'}
          </button>
        </form>

        {/* Info Box */}
        <div className="info-box">
          <div className="info-item">
            <span className="info-icon">📱</span>
            <span className="info-text">Respond using the slider</span>
          </div>
          <div className="info-item">
            <span className="info-icon">📊</span>
            <span className="info-text">See results in real-time</span>
          </div>
          <div className="info-item">
            <span className="info-icon">🔒</span>
            <span className="info-text">Anonymous participation</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PollJoinPage;

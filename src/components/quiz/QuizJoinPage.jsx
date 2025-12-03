import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import './QuizJoinPage.css';

const AVATAR_EMOJIS = ['🦊', '🐱', '🐶', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸'];

const QuizJoinPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [session, setSession] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  // Load session details
  useEffect(() => {
    const loadSession = async () => {
      try {
        // Get session details
        const { data: sessionData, error: sessionError } = await supabase
          .from('quiz_sessions')
          .select(`
            id,
            quiz_id,
            status,
            join_code,
            quizzes (
              name,
              description
            )
          `)
          .eq('id', sessionId)
          .single();

        if (sessionError) throw sessionError;

        if (sessionData.status === 'ended') {
          setError('This quiz session has ended');
          setLoading(false);
          return;
        }

        if (sessionData.status === 'active') {
          setError('This quiz has already started');
          setLoading(false);
          return;
        }

        setSession(sessionData);
        setQuiz(sessionData.quizzes);
        setLoading(false);
      } catch (error) {
        console.error('Error loading session:', error);
        setError('Quiz session not found');
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  const handleJoin = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Please enter your name');
      return;
    }

    if (username.length > 50) {
      setError('Name must be 50 characters or less');
      return;
    }

    setJoining(true);
    setError('');

    try {
      // Pick a random avatar
      const avatar = AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)];

      // Join the session as a participant
      const { data: participantData, error: participantError } = await supabase
        .from('session_participants')
        .insert({
          quiz_session_id: sessionId,
          username: username.trim(),
          avatar: avatar,
        })
        .select()
        .single();

      if (participantError) throw participantError;

      // Store participant token in localStorage for reconnection
      localStorage.setItem(`quiz_participant_${sessionId}`, participantData.participant_token);

      // Navigate to player waiting view
      navigate(`/quiz-race/${sessionId}/play`, {
        state: { participantId: participantData.id, username: username.trim() }
      });
    } catch (error) {
      console.error('Error joining session:', error);
      setError('Failed to join quiz. Please try again.');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="quiz-join-page loading">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          ⚡
        </motion.div>
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="quiz-join-page error">
        <motion.div
          className="error-content"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="error-icon">❌</div>
          <h2>{error}</h2>
          <p>Please check the link or join code and try again</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="quiz-join-page">
      <motion.div
        className="join-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="join-header">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Join Quiz
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {quiz?.name}
          </motion.h2>
          <motion.p
            className="join-code-display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Code: <span className="join-code">{session?.join_code}</span>
          </motion.p>
        </div>

        <motion.form
          className="join-form"
          onSubmit={handleJoin}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="form-group">
            <label htmlFor="username">Enter Your Name</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name..."
              maxLength={50}
              autoFocus
              disabled={joining}
            />
          </div>

          {error && session && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            className="join-button"
            disabled={joining || !username.trim()}
          >
            {joining ? 'Joining...' : 'Join Quiz'}
          </button>
        </motion.form>

        <motion.div
          className="join-info"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>Wait in the lobby until the host starts the quiz</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default QuizJoinPage;

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import QRCodeDisplay from '../QRCodeDisplay';
import './QuizLobbyHost.css';

const QuizLobbyHost = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [autoReveal, setAutoReveal] = useState(true);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Load quiz and create session
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        console.log('Loading quiz:', quizId, 'User:', user?.id);

        // Get quiz details
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizError) {
          console.error('Quiz error:', quizError);
          throw quizError;
        }
        console.log('Quiz loaded:', quizData);
        setQuiz(quizData);

        // Generate a 6-digit join code using database function
        const { data: joinCodeData, error: joinCodeError } = await supabase
          .rpc('generate_join_code');

        if (joinCodeError) {
          console.error('Join code generation error:', joinCodeError);
          throw joinCodeError;
        }
        console.log('Generated join code:', joinCodeData);

        // Create quiz session
        const { data: sessionData, error: sessionError } = await supabase
          .from('quiz_sessions')
          .insert({
            quiz_id: quizId,
            host_user_id: user?.id,
            status: 'lobby',
            join_code: joinCodeData,
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }
        console.log('Session created:', sessionData);
        setSession(sessionData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading quiz:', error);
        alert(`Failed to create quiz session: ${error.message}`);
        setLoading(false);
      }
    };

    if (user) {
      loadQuiz();
    }
  }, [quizId, user]);

  // Subscribe to participant changes
  useEffect(() => {
    if (!session?.id) return;

    const loadParticipants = async () => {
      const { data, error } = await supabase
        .from('session_participants')
        .select('id, username, avatar')
        .eq('quiz_session_id', session.id)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error loading participants:', error);
        return;
      }

      if (data) {
        console.log('Loaded participants:', data);
        setParticipants(data);
      }
    };

    loadParticipants();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel(`host_participants:${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `quiz_session_id=eq.${session.id}`,
        },
        (payload) => {
          console.log('Host view - Participant change detected:', payload);
          loadParticipants();
        }
      )
      .subscribe((status) => {
        console.log('Host subscription status:', status);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [session?.id]);

  const handleStartQuiz = () => {
    if (session) {
      // Navigate to host game view
      navigate(`/quiz-race/${session.id}/host`, {
        state: { autoReveal, quiz },
      });
    }
  };

  const joinUrl = session
    ? `${window.location.origin}/quiz-race/${session.id}/join`
    : '';

  // Use the join_code from the session
  const joinCode = session?.join_code || 'LOADING';

  if (loading) {
    return (
      <div className="quiz-lobby-host loading">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          ⚡
        </motion.div>
        <p>Setting up quiz...</p>
      </div>
    );
  }

  return (
    <div className="quiz-lobby-host">
      <motion.div
        className="lobby-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Playing</h1>
        <h2>{quiz?.name}</h2>
      </motion.div>

      <div className="lobby-content">
        {/* Left side: QR Code and Join Info */}
        <motion.div
          className="join-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="join-code-display">
            <h3>Join code:</h3>
            <div className="join-code">{joinCode}</div>
          </div>

          <QRCodeDisplay url={joinUrl} />

          <div className="share-link">
            <input
              type="text"
              value={joinUrl}
              readOnly
              className="link-input"
            />
            <button
              className="copy-button"
              onClick={() => {
                navigator.clipboard.writeText(joinUrl);
              }}
            >
              Copy
            </button>
          </div>

          {/* Settings */}
          <div className="game-settings">
            <h3>Game Settings</h3>
            <label className="setting-item">
              <input
                type="checkbox"
                checked={autoReveal}
                onChange={(e) => setAutoReveal(e.target.checked)}
              />
              <span>Auto-reveal answers when time expires</span>
            </label>
          </div>
        </motion.div>

        {/* Right side: Participants */}
        <motion.div
          className="participants-section"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="participants-header">
            <h3>
              <span className="participant-count">
                {participants.length.toString().padStart(2, '0')}
              </span>
              {' '}Players
            </h3>
          </div>

          <div className="participants-grid">
            {participants.map((participant, index) => (
              <motion.div
                key={participant.id}
                className="participant-card"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="participant-avatar">{participant.avatar}</div>
                <div className="participant-name">{participant.username}</div>
              </motion.div>
            ))}

            {participants.length === 0 && (
              <div className="empty-participants">
                <p>Waiting for players to join...</p>
                <p className="empty-subtitle">Share the join code or QR code</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Start Button */}
      <motion.div
        className="start-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          className="start-quiz-button"
          onClick={handleStartQuiz}
          disabled={participants.length === 0}
        >
          Start Quiz
        </button>
      </motion.div>
    </div>
  );
};

export default QuizLobbyHost;

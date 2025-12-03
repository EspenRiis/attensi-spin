import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import './QuizPlayerWaiting.css';

const QuizPlayerWaiting = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [session, setSession] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [myParticipantId] = useState(location.state?.participantId);
  const [myUsername] = useState(location.state?.username);

  // Load session and participants
  useEffect(() => {
    const loadSession = async () => {
      try {
        // Get session and quiz details
        const { data: sessionData, error: sessionError } = await supabase
          .from('quiz_sessions')
          .select(`
            id,
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
        setSession(sessionData);
        setQuiz(sessionData.quizzes);

        // If quiz already started, navigate to game view
        if (sessionData.status === 'active') {
          navigate(`/quiz-race/${sessionId}/game`, {
            state: { participantId: myParticipantId, username: myUsername }
          });
        }
      } catch (error) {
        console.error('Error loading session:', error);
      }
    };

    loadSession();
  }, [sessionId, myParticipantId, myUsername, navigate]);

  // Load and subscribe to participants
  useEffect(() => {
    if (!sessionId) return;

    const loadParticipants = async () => {
      const { data, error } = await supabase
        .from('session_participants')
        .select('id, username, avatar')
        .eq('quiz_session_id', sessionId)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error loading participants:', error);
        return;
      }

      if (data) {
        console.log('Player view - Loaded participants:', data);
        setParticipants(data);
      }
    };

    loadParticipants();

    // Subscribe to real-time participant changes
    const participantChannel = supabase
      .channel(`player_participants:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `quiz_session_id=eq.${sessionId}`,
        },
        () => {
          console.log('Player view - Participant change detected');
          loadParticipants();
        }
      )
      .subscribe();

    // Subscribe to session status changes
    const sessionChannel = supabase
      .channel(`player_session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quiz_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Session status changed:', payload);
          if (payload.new.status === 'active') {
            // Quiz started, navigate to game view
            navigate(`/quiz-race/${sessionId}/game`, {
              state: { participantId: myParticipantId, username: myUsername }
            });
          }
        }
      )
      .subscribe();

    return () => {
      participantChannel.unsubscribe();
      sessionChannel.unsubscribe();
    };
  }, [sessionId, myParticipantId, myUsername, navigate]);

  return (
    <div className="quiz-player-waiting">
      <motion.div
        className="waiting-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="waiting-header">
          <motion.div
            className="waiting-icon"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⏳
          </motion.div>
          <h1>Get Ready!</h1>
          <h2>{quiz?.name}</h2>
          <p className="join-code-info">
            Code: <span className="join-code">{session?.join_code}</span>
          </p>
        </div>

        <div className="participants-section">
          <h3>
            <span className="participant-count">
              {participants.length.toString().padStart(2, '0')}
            </span>
            {' '}Players in Lobby
          </h3>

          <div className="participants-grid">
            <AnimatePresence mode="popLayout">
              {participants.map((participant, index) => (
                <motion.div
                  key={participant.id}
                  className={`participant-card ${participant.id === myParticipantId ? 'me' : ''}`}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <div className="participant-avatar">{participant.avatar}</div>
                  <div className="participant-name">
                    {participant.username}
                    {participant.id === myParticipantId && (
                      <span className="you-badge">YOU</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <motion.div
          className="waiting-message"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <p>Waiting for host to start the quiz...</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default QuizPlayerWaiting;

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import QRCodeDisplay from '../QRCodeDisplay';
import './styles/PollLobbyHost.css';

const PollLobbyHost = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Load poll and create session
  useEffect(() => {
    const loadPoll = async () => {
      try {
        console.log('Loading poll:', pollId, 'User:', user?.id);

        // Get poll details
        const { data: pollData, error: pollError } = await supabase
          .from('polls')
          .select('*')
          .eq('id', pollId)
          .single();

        if (pollError) {
          console.error('Poll error:', pollError);
          throw pollError;
        }
        console.log('Poll loaded:', pollData);
        setPoll(pollData);

        // Generate a 6-digit join code using database function
        const { data: joinCodeData, error: joinCodeError } = await supabase
          .rpc('generate_join_code');

        if (joinCodeError) {
          console.error('Join code generation error:', joinCodeError);
          throw joinCodeError;
        }
        console.log('Generated join code:', joinCodeData);

        // Create poll session
        const { data: sessionData, error: sessionError } = await supabase
          .from('poll_sessions')
          .insert({
            poll_id: pollId,
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
        console.error('Error loading poll:', error);
        alert(`Failed to create poll session: ${error.message}`);
        setLoading(false);
      }
    };

    if (user) {
      loadPoll();
    }
  }, [pollId, user]);

  // Subscribe to participant changes
  useEffect(() => {
    if (!session?.id) return;

    const loadParticipants = async () => {
      const { data, error } = await supabase
        .from('poll_participants')
        .select('id, username, joined_at')
        .eq('poll_session_id', session.id)
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
          table: 'poll_participants',
          filter: `poll_session_id=eq.${session.id}`,
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

  const handleStartPoll = () => {
    if (session) {
      // Navigate to host view
      navigate(`/polling/${session.id}/host`);
    }
  };

  const joinUrl = session
    ? `${window.location.origin}/polling/${session.id}/join`
    : '';

  const joinCode = session?.join_code || 'LOADING';

  if (loading) {
    return (
      <div className="poll-lobby-host loading">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          📊
        </motion.div>
        <p>Setting up poll...</p>
      </div>
    );
  }

  return (
    <div className="poll-lobby-host">
      <motion.div
        className="lobby-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Live Poll</h1>
        <h2>{poll?.name}</h2>
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
              {' '}Participants
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
                <div className="participant-icon">📱</div>
                <div className="participant-name">
                  {participant.username || `Participant ${index + 1}`}
                </div>
              </motion.div>
            ))}

            {participants.length === 0 && (
              <div className="empty-participants">
                <p>Waiting for participants to join...</p>
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
          className="start-poll-button"
          onClick={handleStartPoll}
          disabled={participants.length === 0}
        >
          Start Poll
        </button>
        {participants.length === 0 && (
          <p className="start-hint">At least 1 participant needed to start</p>
        )}
      </motion.div>
    </div>
  );
};

export default PollLobbyHost;

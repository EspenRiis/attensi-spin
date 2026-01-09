import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import DistributionCurve from './components/DistributionCurve';
import './styles/LivePollPage.css';

const LivePollPage = () => {
  const [sessionId, setSessionId] = useState(null);
  const [questionId, setQuestionId] = useState(null);
  const [questionText, setQuestionText] = useState('How do you feel about this?');
  const [minLabel, setMinLabel] = useState('Strongly Disagree');
  const [maxLabel, setMaxLabel] = useState('Strongly Agree');
  const [responseData, setResponseData] = useState([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [qrCollapsed, setQrCollapsed] = useState(false);

  const lastRefreshRef = useRef(0);

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      // Generate join code
      const { data: joinCodeData, error: joinCodeError } = await supabase
        .rpc('generate_join_code');

      if (joinCodeError) throw joinCodeError;

      // Create a simple poll (no user_id required for instant polls)
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .insert({
          name: 'Live Poll',
          description: 'Instant live poll',
          user_id: null, // Anonymous poll
        })
        .select()
        .single();

      if (pollError) throw pollError;

      // Create a single question
      const { data: questionData, error: questionError } = await supabase
        .from('poll_questions')
        .insert({
          poll_id: pollData.id,
          text: questionText,
          min_label: minLabel,
          max_label: maxLabel,
          order_index: 0,
        })
        .select()
        .single();

      if (questionError) throw questionError;

      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from('poll_sessions')
        .insert({
          poll_id: pollData.id,
          host_user_id: null, // Anonymous host
          join_code: joinCodeData,
          status: 'active',
          current_question_id: questionData.id,
          current_question_index: 0,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setSessionId(sessionData.id);
      setQuestionId(questionData.id);
    } catch (error) {
      console.error('Error initializing session:', error);
      alert('Failed to start poll session');
    }
  };

  // Subscribe to participants
  useEffect(() => {
    if (!sessionId) return;

    const loadParticipants = async () => {
      const { count } = await supabase
        .from('poll_participants')
        .select('*', { count: 'exact', head: true })
        .eq('poll_session_id', sessionId);

      setParticipantCount(count || 0);
    };

    loadParticipants();

    const channel = supabase
      .channel(`participants_${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'poll_participants',
        filter: `poll_session_id=eq.${sessionId}`,
      }, () => loadParticipants())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [sessionId, questionId]);

  // Subscribe to responses and refresh distribution
  useEffect(() => {
    if (!sessionId || !questionId) return;

    const refreshDistribution = async () => {
      // Throttle to max 1 refresh per second
      const now = Date.now();
      if (now - lastRefreshRef.current < 1000) return;
      lastRefreshRef.current = now;

      const { data, error } = await supabase.rpc('get_poll_responses', {
        p_session_id: sessionId,
        p_question_id: questionId,
      });

      if (error) {
        console.error('Error loading responses:', error);
        return;
      }

      setResponseData(data || []);
    };

    refreshDistribution();

    const channel = supabase
      .channel(`responses_${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'poll_responses',
        filter: `poll_session_id=eq.${sessionId}`,
      }, refreshDistribution)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [sessionId]);

  const handleQuestionChange = async (newText) => {
    setQuestionText(newText);
    // TODO: Update question in database
  };

  const handlePauseToggle = async () => {
    if (!sessionId) return;

    const newStatus = isPaused ? 'active' : 'paused';
    await supabase
      .from('poll_sessions')
      .update({ status: newStatus })
      .eq('id', sessionId);

    setIsPaused(!isPaused);
  };

  const handleReset = async () => {
    if (!confirm('Reset all responses? This cannot be undone.')) return;

    if (!sessionId) return;

    // Delete all responses
    await supabase
      .from('poll_responses')
      .delete()
      .eq('poll_session_id', sessionId);

    setResponseData([]);
  };

  const joinUrl = sessionId
    ? `${window.location.origin}/polling/${sessionId}/join`
    : '';

  if (!sessionId) {
    return (
      <div className="live-poll-page loading">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          📊
        </motion.div>
        <p>Starting poll...</p>
      </div>
    );
  }

  return (
    <div className="live-poll-page">
      {/* Left Sidebar - Settings & Controls */}
      <div className="left-sidebar">
        <div className="sidebar-section">
          <h3>Live Poll</h3>
          <div className="participant-badge">
            {participantCount} {participantCount === 1 ? 'person' : 'people'}
          </div>
        </div>

        <div className="sidebar-section">
          <label>Question</label>
          <textarea
            value={questionText}
            onChange={(e) => handleQuestionChange(e.target.value)}
            className="question-input"
            rows={3}
            placeholder="Enter your question..."
          />
        </div>

        <div className="sidebar-section">
          <label>Min Label (0)</label>
          <input
            type="text"
            value={minLabel}
            onChange={(e) => setMinLabel(e.target.value)}
            className="label-input"
            placeholder="e.g., Strongly Disagree"
          />
        </div>

        <div className="sidebar-section">
          <label>Max Label (100)</label>
          <input
            type="text"
            value={maxLabel}
            onChange={(e) => setMaxLabel(e.target.value)}
            className="label-input"
            placeholder="e.g., Strongly Agree"
          />
        </div>

        <div className="sidebar-section controls">
          <button
            className={`btn-control ${isPaused ? 'btn-resume' : 'btn-pause'}`}
            onClick={handlePauseToggle}
          >
            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </button>

          <button
            className="btn-control btn-reset"
            onClick={handleReset}
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Center - Distribution Curve */}
      <div className="center-content">
        <div className="poll-header">
          <h1>{questionText}</h1>
          {isPaused && (
            <span className="status-badge paused">⏸️ Paused</span>
          )}
        </div>

        <div className="distribution-container">
          <DistributionCurve
            data={responseData}
            minLabel={minLabel}
            maxLabel={maxLabel}
          />
        </div>
      </div>

      {/* Right Sidebar - QR Code */}
      <div className="right-sidebar">
        <motion.div
          className={`qr-panel ${qrCollapsed ? 'collapsed' : ''}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="qr-header">
            <h3>Scan to Join</h3>
            <button
              className="qr-toggle"
              onClick={() => setQrCollapsed(!qrCollapsed)}
            >
              {qrCollapsed ? '◀' : '▶'}
            </button>
          </div>

          {!qrCollapsed && (
            <div className="qr-content">
              <div className="qr-code-box">
                <QRCodeSVG
                  value={joinUrl}
                  size={200}
                  bgColor="#FFFFFF"
                  fgColor="#0A1628"
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="join-info">
                <span className="join-label">📱 Scan with your phone to join</span>
              </div>

              <div className="share-link">
                <input
                  type="text"
                  value={joinUrl}
                  readOnly
                  className="link-input"
                  onClick={(e) => e.target.select()}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default LivePollPage;

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import DistributionCurve from './components/DistributionCurve';
import './styles/PollHostView.css';

const PollHostView = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [poll, setPoll] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [responseData, setResponseData] = useState([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [qrCollapsed, setQrCollapsed] = useState(false);
  const lastRefreshRef = useRef(0);

  // Load session, poll, and questions
  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      // Load session
      const { data: sessionData, error: sessionError } = await supabase
        .from('poll_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Load poll
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .select('*')
        .eq('id', sessionData.poll_id)
        .single();

      if (pollError) throw pollError;
      setPoll(pollData);

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('poll_questions')
        .select('*')
        .eq('poll_id', sessionData.poll_id)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Set current question
      if (sessionData.current_question_id) {
        const current = questionsData.find(q => q.id === sessionData.current_question_id);
        setCurrentQuestion(current);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading session:', error);
      alert('Failed to load poll session');
      navigate('/polling');
    }
  };

  // Subscribe to session changes (for status, current question)
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'poll_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Session updated:', payload);
          setSession(payload.new);

          // Update current question if changed
          if (payload.new.current_question_id) {
            const question = questions.find(q => q.id === payload.new.current_question_id);
            setCurrentQuestion(question);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [sessionId, questions]);

  // Subscribe to participant changes
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poll_participants',
          filter: `poll_session_id=eq.${sessionId}`,
        },
        () => loadParticipants()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [sessionId]);

  // Subscribe to response changes and refresh distribution
  useEffect(() => {
    if (!sessionId || !currentQuestion) return;

    const refreshDistribution = async () => {
      // Throttle to max 1 refresh per second
      const now = Date.now();
      if (now - lastRefreshRef.current < 1000) return;
      lastRefreshRef.current = now;

      const { data, error } = await supabase.rpc('get_poll_responses', {
        p_session_id: sessionId,
        p_question_id: currentQuestion.id,
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poll_responses',
          filter: `poll_session_id=eq.${sessionId}`,
        },
        (payload) => {
          // Only refresh if it's for the current question
          if (payload.new?.question_id === currentQuestion.id) {
            refreshDistribution();
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [sessionId, currentQuestion]);

  // Handle next question
  const handleNextQuestion = async () => {
    const currentIndex = questions.findIndex(q => q.id === currentQuestion.id);
    if (currentIndex < questions.length - 1) {
      const nextQuestion = questions[currentIndex + 1];

      await supabase
        .from('poll_sessions')
        .update({
          current_question_id: nextQuestion.id,
          current_question_index: currentIndex + 1,
        })
        .eq('id', sessionId);
    }
  };

  // Handle pause/resume
  const handlePauseResume = async () => {
    const newStatus = session.status === 'active' ? 'paused' : 'active';

    await supabase
      .from('poll_sessions')
      .update({ status: newStatus })
      .eq('id', sessionId);
  };

  // Handle end session
  const handleEndSession = async () => {
    if (!confirm('End this poll session? Participants will no longer be able to respond.')) {
      return;
    }

    await supabase
      .from('poll_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    navigate('/polling');
  };

  if (loading) {
    return (
      <div className="poll-host-view loading">
        <div className="loading-spinner">📊</div>
        <p>Loading poll...</p>
      </div>
    );
  }

  const currentQuestionIndex = questions.findIndex(q => q.id === currentQuestion?.id);
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const joinUrl = `${window.location.origin}/polling/${sessionId}/join`;

  return (
    <div className="poll-host-view">
      {/* Header */}
      <div className="host-header">
        <div className="header-left">
          <h1>{poll?.name}</h1>
          <span className="session-status">
            {session?.status === 'paused' ? '⏸️ Paused' : '▶️ Active'}
          </span>
        </div>
        <div className="header-right">
          <span className="participant-badge">
            {participantCount} participant{participantCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="host-content">
        {/* Left Panel: QR Code + Controls */}
        <div className="left-panel">
          {/* QR Code Section */}
          <motion.div
            className={`qr-section ${qrCollapsed ? 'collapsed' : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="qr-header">
              <h3>Scan to Join</h3>
              <button
                className="qr-toggle"
                onClick={() => setQrCollapsed(!qrCollapsed)}
              >
                {qrCollapsed ? '▼' : '▲'}
              </button>
            </div>

            {!qrCollapsed && (
              <div className="qr-content">
                <div className="qr-code-box">
                  <QRCodeSVG
                    value={joinUrl}
                    size={180}
                    level="H"
                    includeMargin={true}
                    bgColor="#FFFFFF"
                    fgColor="#0A1628"
                  />
                </div>
                <div className="join-code-box">
                  <span className="join-code-label">Join Code:</span>
                  <span className="join-code">{session?.join_code}</span>
                </div>
                <div className="join-url">
                  <input
                    type="text"
                    value={joinUrl}
                    readOnly
                    onClick={(e) => e.target.select()}
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* Current Question */}
          <div className="question-panel">
            <div className="question-header">
              <span className="question-number">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            <h2 className="question-text">{currentQuestion?.text}</h2>
            <div className="question-labels">
              <span>{currentQuestion?.min_label || '0'}</span>
              <span>{currentQuestion?.max_label || '100'}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="control-panel">
            <button
              className="btn-control btn-pause"
              onClick={handlePauseResume}
            >
              {session?.status === 'paused' ? '▶️ Resume' : '⏸️ Pause'}
            </button>

            <button
              className="btn-control btn-next"
              onClick={handleNextQuestion}
              disabled={isLastQuestion}
            >
              Next Question →
            </button>

            <button
              className="btn-control btn-end"
              onClick={handleEndSession}
            >
              End Poll
            </button>
          </div>
        </div>

        {/* Right Panel: Distribution Curve */}
        <div className="right-panel">
          <DistributionCurve
            data={responseData}
            minLabel={currentQuestion?.min_label}
            maxLabel={currentQuestion?.max_label}
          />
        </div>
      </div>
    </div>
  );
};

export default PollHostView;

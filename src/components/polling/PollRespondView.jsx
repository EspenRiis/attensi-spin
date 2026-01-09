import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import SliderInput from './components/SliderInput';
import './styles/PollRespondView.css';

const PollRespondView = () => {
  const { sessionId } = useParams();

  const [session, setSession] = useState(null);
  const [poll, setPoll] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [participantId, setParticipantId] = useState(null);
  const [sliderValue, setSliderValue] = useState(50);
  const [lastSubmittedValue, setLastSubmittedValue] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null); // 'submitting', 'success', null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const submitTimeoutRef = useRef(null);

  // Load or create participant
  useEffect(() => {
    const initializeParticipant = async () => {
      const storedParticipantId = localStorage.getItem(`poll_participant_id_${sessionId}`);
      const storedDeviceToken = localStorage.getItem(`poll_device_${sessionId}`);

      if (storedParticipantId && storedDeviceToken) {
        // Participant already exists
        setParticipantId(storedParticipantId);
        return;
      }

      // Create new anonymous participant
      try {
        const { data: participant, error: participantError } = await supabase
          .from('poll_participants')
          .insert({
            poll_session_id: sessionId,
            username: null, // Anonymous
          })
          .select()
          .single();

        if (participantError) throw participantError;

        // Store in localStorage
        localStorage.setItem(`poll_participant_id_${sessionId}`, participant.id);
        localStorage.setItem(`poll_device_${sessionId}`, participant.device_token);

        setParticipantId(participant.id);
      } catch (err) {
        console.error('Error creating participant:', err);
        setError('Failed to join poll. Please try again.');
        setLoading(false);
      }
    };

    initializeParticipant();
  }, [sessionId]);

  // Load session, poll, and current question
  useEffect(() => {
    if (!participantId) return;

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

        // Load current question
        if (sessionData.current_question_id) {
          const { data: questionData, error: questionError } = await supabase
            .from('poll_questions')
            .select('*')
            .eq('id', sessionData.current_question_id)
            .single();

          if (questionError) throw questionError;
          setCurrentQuestion(questionData);

          // Load existing response for this question
          const { data: responseData } = await supabase
            .from('poll_responses')
            .select('response_value')
            .eq('poll_session_id', sessionId)
            .eq('participant_id', participantId)
            .eq('question_id', sessionData.current_question_id)
            .maybeSingle();

          if (responseData) {
            setSliderValue(responseData.response_value);
            setLastSubmittedValue(responseData.response_value);
          } else {
            setSliderValue(50); // Reset to default for new question
            setLastSubmittedValue(null);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Failed to load poll session');
        setLoading(false);
      }
    };

    loadSessionData();
  }, [sessionId, participantId]);

  // Subscribe to session changes (status, current question)
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`participant_session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'poll_sessions',
          filter: `id=eq.${sessionId}`,
        },
        async (payload) => {
          console.log('Session updated:', payload);
          const newSession = payload.new;
          setSession(newSession);

          // If question changed, load new question and reset slider
          if (newSession.current_question_id !== currentQuestion?.id) {
            const { data: questionData } = await supabase
              .from('poll_questions')
              .select('*')
              .eq('id', newSession.current_question_id)
              .single();

            if (questionData) {
              setCurrentQuestion(questionData);

              // Check for existing response
              const { data: responseData } = await supabase
                .from('poll_responses')
                .select('response_value')
                .eq('poll_session_id', sessionId)
                .eq('participant_id', participantId)
                .eq('question_id', newSession.current_question_id)
                .maybeSingle();

              if (responseData) {
                setSliderValue(responseData.response_value);
                setLastSubmittedValue(responseData.response_value);
              } else {
                setSliderValue(50);
                setLastSubmittedValue(null);
              }

              setSubmitStatus(null);
            }
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [sessionId, participantId, currentQuestion?.id]);

  // Handle slider change with throttled submission
  const handleSliderChange = (newValue) => {
    setSliderValue(newValue);
    setSubmitStatus('submitting');

    // Clear previous timeout
    clearTimeout(submitTimeoutRef.current);

    // Set new timeout for submission (500ms debounce)
    submitTimeoutRef.current = setTimeout(async () => {
      if (newValue === lastSubmittedValue) {
        setSubmitStatus(null);
        return;
      }

      try {
        const { error } = await supabase
          .from('poll_responses')
          .upsert({
            poll_session_id: sessionId,
            participant_id: participantId,
            question_id: currentQuestion.id,
            response_value: newValue,
          }, {
            onConflict: 'poll_session_id,participant_id,question_id',
          });

        if (error) throw error;

        setLastSubmittedValue(newValue);
        setSubmitStatus('success');

        // Clear success message after 2 seconds
        setTimeout(() => {
          setSubmitStatus(null);
        }, 2000);
      } catch (err) {
        console.error('Error submitting response:', err);
        setSubmitStatus(null);
      }
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="poll-respond-view loading">
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

  if (error) {
    return (
      <div className="poll-respond-view error">
        <div className="error-icon">⚠️</div>
        <h2>Oops!</h2>
        <p>{error}</p>
      </div>
    );
  }

  const isPaused = session?.status === 'paused';
  const isEnded = session?.status === 'ended';

  return (
    <div className="poll-respond-view">
      {/* Header */}
      <div className="respond-header">
        <h1>{poll?.name}</h1>
        {isPaused && (
          <span className="status-badge paused">⏸️ Paused</span>
        )}
        {isEnded && (
          <span className="status-badge ended">Poll Ended</span>
        )}
      </div>

      {/* Main Content */}
      <div className="respond-content">
        <AnimatePresence mode="wait">
          {currentQuestion ? (
            <motion.div
              key={currentQuestion.id}
              className="question-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Question Text */}
              <div className="question-display">
                <h2 className="question-text">{currentQuestion.text}</h2>
              </div>

              {/* Slider */}
              <div className="slider-section">
                <SliderInput
                  value={sliderValue}
                  onChange={handleSliderChange}
                  minLabel={currentQuestion.min_label || '0'}
                  maxLabel={currentQuestion.max_label || '100'}
                  disabled={isPaused || isEnded}
                />
              </div>

              {/* Submit Status */}
              <AnimatePresence>
                {submitStatus === 'success' && (
                  <motion.div
                    className="submit-status success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    ✓ Response submitted
                  </motion.div>
                )}
                {submitStatus === 'submitting' && (
                  <motion.div
                    className="submit-status submitting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Saving...
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              className="waiting-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="waiting-icon">⏳</div>
              <h2>Waiting for next question...</h2>
              <p>The host will advance to the next question soon.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Paused Overlay */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            className="paused-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="paused-content">
              <div className="paused-icon">⏸️</div>
              <h2>Paused by host</h2>
              <p>The poll will resume shortly...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ended Overlay */}
      <AnimatePresence>
        {isEnded && (
          <motion.div
            className="ended-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="ended-content">
              <div className="ended-icon">🎉</div>
              <h2>Poll Ended</h2>
              <p>Thank you for participating!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PollRespondView;

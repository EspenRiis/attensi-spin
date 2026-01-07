import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useQuizGame } from '../../hooks/useQuizGame';
import QuizRaceView from './QuizRaceView';
import QuestionDisplay from './QuestionDisplay';
import HostControls from './HostControls';
import './QuizHostView.css';
import './QuizRaceView.css';

/**
 * QuizHostViewRacing - 3D racing visualization for quiz host
 * Alternative to QuizHostView with integrated 3D racing
 */
const QuizHostViewRacing = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { autoReveal, quiz: quizFromState } = location.state || {};

  const [user, setUser] = useState(null);
  const [quiz, setQuiz] = useState(quizFromState);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQuestion, setShowQuestion] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState(false);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Load session and questions
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('quiz_sessions')
          .select(`
            *,
            quizzes (
              id,
              name,
              description
            )
          `)
          .eq('id', sessionId)
          .single();

        if (sessionError) throw sessionError;
        setQuiz(sessionData.quizzes);

        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', sessionData.quiz_id)
          .order('order_index', { ascending: true });

        if (questionsError) throw questionsError;
        setQuestions(questionsData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading session data:', error);
        alert('Failed to load quiz session');
        navigate('/quiz-builder');
      }
    };

    loadSessionData();
  }, [sessionId, navigate]);

  // Initialize WebSocket
  const {
    connected,
    gameState,
    startQuiz,
    revealAnswer,
    nextQuestion,
    endQuiz,
  } = useQuizGame(sessionId, user?.id);

  // Start quiz when ready
  useEffect(() => {
    const initializeQuiz = async () => {
      if (connected && user && !loading && questions.length > 0) {
        const { error } = await supabase
          .from('quiz_sessions')
          .update({
            status: 'active',
            started_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        if (error) {
          console.error('Error updating session status:', error);
        }

        startQuiz();
      }
    };

    initializeQuiz();
  }, [connected, user, loading, questions, sessionId, startQuiz]);

  // Handle question display with 3-second delay
  useEffect(() => {
    if (gameState.currentQuestion) {
      // Start with question hidden
      setShowQuestion(false);
      setAnswerRevealed(false);

      // After 3 seconds, show the question
      const timer = setTimeout(() => {
        setShowQuestion(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [gameState.currentQuestion?.id]);

  // Auto-reveal when time expires
  const handleTimeExpired = () => {
    if (autoReveal && !answerRevealed && gameState.currentQuestion) {
      handleRevealAnswer();
    }
  };

  const handleRevealAnswer = () => {
    if (gameState.currentQuestion) {
      revealAnswer(gameState.currentQuestion.id);
      setAnswerRevealed(true);
    }
  };

  const handleNextQuestion = () => {
    setShowQuestion(false);
    setAnswerRevealed(false);
    nextQuestion();
  };

  const handleExitToLobby = () => {
    if (confirm('Are you sure you want to exit? This will end the quiz for all players.')) {
      endQuiz();
      navigate(`/quiz-race/${quiz?.id}/lobby`);
    }
  };

  const handleBackTo2D = () => {
    navigate(`/quiz-race/${sessionId}/host`, { state: { autoReveal, quiz } });
  };

  if (loading || !connected) {
    return (
      <div className="quiz-host-view loading">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          ⚡
        </motion.div>
        <p>{loading ? 'Loading quiz...' : 'Connecting to game...'}</p>
      </div>
    );
  }

  // Quiz completed
  if (gameState.status === 'completed') {
    return (
      <div className="quiz-host-view completed">
        <motion.div
          className="completion-screen"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h1 className="completion-title">🏆 Race Complete!</h1>
          <h2 className="completion-subtitle">{quiz?.name}</h2>

          <div className="completion-actions">
            <button
              className="action-button primary"
              onClick={() => navigate('/quiz-builder')}
            >
              Back to Quizzes
            </button>
            <button
              className="action-button secondary"
              onClick={() => navigate(`/quiz-race/${quiz?.id}/lobby`)}
            >
              Play Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="quiz-host-view quiz-host-racing">
      {/* 3D Racing Background */}
      <QuizRaceView
        sessionId={sessionId}
        gameState={gameState}
        players={gameState.leaderboard || []}
      />

      {/* Overlay UI */}
      <div className="racing-overlay-ui">
        {/* Top Bar */}
        <div className="racing-header">
          <div className="quiz-info-racing">
            <h2>{quiz?.name}</h2>
            <span className="status-badge-racing">
              🏎️ 3D Racing View
            </span>
          </div>

          <button
            className="view-switch-btn"
            onClick={handleBackTo2D}
            title="Switch to 2D View"
          >
            📊 2D View
          </button>
        </div>

        {/* Question Display (Semi-transparent overlay) */}
        {gameState.currentQuestion && showQuestion && (
          <div className="racing-question-overlay">
            <QuestionDisplay
              question={gameState.currentQuestion}
              currentQuestionIndex={gameState.currentQuestionIndex}
              totalQuestions={gameState.totalQuestions}
              timeLimit={gameState.currentQuestion.time_limit}
              onTimeExpired={handleTimeExpired}
              showAnswers={showQuestion}
            />
          </div>
        )}

        {/* Host Controls (Bottom) */}
        <div className="racing-controls-overlay">
          <HostControls
            onRevealAnswer={handleRevealAnswer}
            onNextQuestion={handleNextQuestion}
            onExitToLobby={handleExitToLobby}
            showReveal={!answerRevealed}
            showNext={answerRevealed}
            answerRevealed={answerRevealed}
          />
        </div>
      </div>
    </div>
  );
};

export default QuizHostViewRacing;

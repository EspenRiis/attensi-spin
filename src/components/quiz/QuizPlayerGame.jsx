import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuizGame } from '../../hooks/useQuizGame';
import './QuizPlayerGame.css';

/**
 * QuizPlayerGame - Mobile-first game view for quiz players
 * Handles answering questions and viewing results in real-time
 */
const QuizPlayerGame = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { participantId, username } = location.state || {};

  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isCorrect, setIsCorrect] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Initialize WebSocket game connection
  const {
    connected,
    gameState,
    submitAnswer,
  } = useQuizGame(sessionId, participantId);

  // Redirect if no participant info
  useEffect(() => {
    if (!participantId || !username) {
      navigate(`/quiz-race/${sessionId}/join`);
    }
  }, [participantId, username, sessionId, navigate]);

  // Handle question timer
  useEffect(() => {
    if (gameState.currentQuestion && !hasSubmitted) {
      const timeLimit = gameState.currentQuestion.time_limit || 30;
      setTimeRemaining(timeLimit);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = Math.max(0, timeLimit - elapsed);
        setTimeRemaining(remaining);

        if (remaining === 0) {
          clearInterval(timerRef.current);
          // Auto-submit if time runs out
          if (!hasSubmitted) {
            handleSubmit();
          }
        }
      }, 100);

      return () => clearInterval(timerRef.current);
    }
  }, [gameState.currentQuestion?.id, hasSubmitted]);

  // Reset state when new question arrives
  useEffect(() => {
    if (gameState.currentQuestion) {
      setSelectedAnswers([]);
      setHasSubmitted(false);
      setIsCorrect(null);
      setPointsEarned(0);
    }
  }, [gameState.currentQuestion?.id]);

  // Check if answer was correct when results come in
  useEffect(() => {
    if (gameState.results && hasSubmitted) {
      const myResult = gameState.results.results?.find(
        (r) => r.participant_id === participantId
      );
      if (myResult) {
        setIsCorrect(myResult.is_correct);
        setPointsEarned(myResult.points_earned);
      }
    }
  }, [gameState.results, participantId, hasSubmitted]);

  const handleAnswerToggle = (index) => {
    if (hasSubmitted) return;

    const answerStr = index.toString();
    const question = gameState.currentQuestion;

    let finalAnswers;
    if (question.question_type === 'true_false') {
      // True/False: only one answer allowed, auto-submit immediately
      finalAnswers = [answerStr];
      setSelectedAnswers(finalAnswers);

      // Auto-submit for true/false
      const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
      submitAnswer(
        gameState.currentQuestion.id,
        finalAnswers,
        timeTaken,
        participantId
      );
      setHasSubmitted(true);
      clearInterval(timerRef.current);
    } else {
      // Multiple choice: toggle selection and auto-submit
      finalAnswers = selectedAnswers.includes(answerStr)
        ? selectedAnswers.filter((a) => a !== answerStr)
        : [...selectedAnswers, answerStr];

      setSelectedAnswers(finalAnswers);

      // Auto-submit for multiple choice
      if (finalAnswers.length > 0) {
        const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
        submitAnswer(
          gameState.currentQuestion.id,
          finalAnswers,
          timeTaken,
          participantId
        );
        setHasSubmitted(true);
        clearInterval(timerRef.current);
      }
    }
  };

  const handleSubmit = () => {
    // Auto-submit when timer expires (no manual submit)
    if (hasSubmitted) return;

    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const finalAnswers = selectedAnswers.length > 0 ? selectedAnswers : [];

    submitAnswer(
      gameState.currentQuestion.id,
      finalAnswers,
      timeTaken,
      participantId
    );
    setHasSubmitted(true);
    clearInterval(timerRef.current);
  };

  // Get player's rank from leaderboard
  const getMyRank = () => {
    const index = gameState.leaderboard?.findIndex(
      (entry) => entry.participant_id === participantId
    );
    return index !== -1 ? index + 1 : null;
  };

  const getMyScore = () => {
    const entry = gameState.leaderboard?.find(
      (entry) => entry.participant_id === participantId
    );
    return entry?.total_score || 0;
  };

  if (!connected) {
    return (
      <div className="quiz-player-game loading">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          ⚡
        </motion.div>
        <p>Connecting...</p>
      </div>
    );
  }

  // Quiz completed
  if (gameState.status === 'completed') {
    const myRank = getMyRank();
    const myScore = getMyScore();

    return (
      <div className="quiz-player-game completed">
        <motion.div
          className="completion-screen"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="completion-icon">
            {myRank === 1 ? '🏆' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '🎉'}
          </div>
          <h1>Quiz Complete!</h1>
          <div className="final-stats">
            <div className="stat-item">
              <div className="stat-value">#{myRank || '-'}</div>
              <div className="stat-label">Your Rank</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{myScore}</div>
              <div className="stat-label">Total Score</div>
            </div>
          </div>
          <button
            className="action-button"
            onClick={() => navigate('/quiz-builder')}
          >
            Back to Lobby
          </button>
        </motion.div>
      </div>
    );
  }

  // Waiting for question or results
  if (!gameState.currentQuestion) {
    return (
      <div className="quiz-player-game waiting">
        <motion.div
          className="waiting-content"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="waiting-icon">⏳</div>
          <p>Waiting for next question...</p>
        </motion.div>
      </div>
    );
  }

  const question = gameState.currentQuestion;
  const progress = ((gameState.currentQuestionIndex + 1) / gameState.totalQuestions) * 100;
  const timerPercent = (timeRemaining / (question.time_limit || 30)) * 100;

  return (
    <div className="quiz-player-game">
      {/* Header */}
      <div className="player-header">
        <div className="player-info">
          <span className="player-name">{username}</span>
          <div className="player-score">
            <span className="score-label">Score:</span>
            <span className="score-value">{getMyScore()}</span>
          </div>
        </div>
        <div className="question-progress">
          <span className="progress-text">
            {gameState.currentQuestionIndex + 1} / {gameState.totalQuestions}
          </span>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="timer-container">
        <motion.div
          className="timer-circle"
          animate={{
            scale: timeRemaining <= 5 && !hasSubmitted ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.5, repeat: timeRemaining <= 5 ? Infinity : 0 }}
        >
          <div className={`timer-value ${timeRemaining <= 5 ? 'urgent' : ''}`}>
            {timeRemaining}
          </div>
        </motion.div>
        <div className="timer-bar-container">
          <motion.div
            className={`timer-bar ${timeRemaining <= 5 ? 'urgent' : ''}`}
            initial={{ width: '100%' }}
            animate={{ width: `${timerPercent}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="question-container">
        <motion.h2
          className="question-text"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {question.text}
        </motion.h2>
      </div>

      {/* Answer Options - Always visible */}
      <div className="answers-container">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswers.includes(index.toString());
          const isCorrectAnswer = gameState.results?.correctAnswer?.includes(index.toString());
          const showResults = hasSubmitted && isCorrect !== null;

          let answerState = '';
          if (showResults) {
            if (isCorrectAnswer) {
              answerState = 'correct-answer';
            }
            if (isSelected && !isCorrectAnswer) {
              answerState = 'wrong-answer';
            }
            if (isSelected && isCorrectAnswer) {
              answerState = 'correct-answer selected';
            }
          } else if (isSelected) {
            answerState = 'selected';
          }

          return (
            <motion.button
              key={index}
              className={`answer-button ${answerState} ${hasSubmitted ? 'locked' : ''}`}
              onClick={() => handleAnswerToggle(index)}
              disabled={hasSubmitted}
              whileTap={!hasSubmitted ? { scale: 0.95 } : {}}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="answer-letter">
                {String.fromCharCode(65 + index)}
              </div>
              <div className="answer-text">{option}</div>
              {showResults && isCorrectAnswer && (
                <div className="answer-icon correct">✓</div>
              )}
              {showResults && isSelected && !isCorrectAnswer && (
                <div className="answer-icon incorrect">✗</div>
              )}
              {!showResults && isSelected && (
                <div className="answer-icon">✓</div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Result Feedback Overlay */}
      <AnimatePresence>
        {hasSubmitted && isCorrect !== null && (
          <motion.div
            className="result-overlay"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`result-badge ${isCorrect ? 'correct' : 'incorrect'}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              <div className="result-icon">
                {isCorrect ? '✓' : '✗'}
              </div>
              <div className="result-text">
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </div>
              {pointsEarned > 0 && (
                <div className="result-points">+{pointsEarned} points</div>
              )}
            </motion.div>
          </motion.div>
        )}

        {hasSubmitted && isCorrect === null && (
          <motion.div
            className="result-overlay waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="waiting-badge">
              <motion.div
                className="waiting-icon"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                ⚡
              </motion.div>
              <div className="waiting-text">Waiting for results...</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizPlayerGame;

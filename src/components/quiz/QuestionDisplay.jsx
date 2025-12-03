import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './QuestionDisplay.css';

const QuestionDisplay = ({
  question,
  currentQuestionIndex,
  totalQuestions,
  timeLimit,
  onTimeExpired,
  showAnswers = true,
}) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    setTimeLeft(timeLimit);
  }, [question?.id, timeLimit]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeExpired?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeExpired]);

  const getTimerColor = () => {
    const percentage = (timeLeft / timeLimit) * 100;
    if (percentage > 50) return 'var(--green-neon)';
    if (percentage > 25) return 'var(--cyan-bright)';
    return '#FF4444';
  };

  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="question-display">
      {/* Progress Bar */}
      <div className="question-progress">
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="progress-text">
          Question {currentQuestionIndex + 1}/{totalQuestions}
        </div>
      </div>

      {/* Timer */}
      <motion.div
        className="question-timer"
        key={question?.id}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <svg className="timer-ring" viewBox="0 0 120 120">
          <circle
            className="timer-ring-background"
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="var(--navy-medium)"
            strokeWidth="8"
          />
          <motion.circle
            className="timer-ring-progress"
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={getTimerColor()}
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ strokeDashoffset: 0 }}
            animate={{
              strokeDashoffset: 339.292 * (1 - timeLeft / timeLimit),
            }}
            style={{
              strokeDasharray: 339.292,
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
            }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </svg>
        <div className="timer-text" style={{ color: getTimerColor() }}>
          <span className="timer-seconds">{timeLeft.toString().padStart(2, '0')}</span>
          <span className="timer-label">seconds</span>
        </div>
      </motion.div>

      {/* Question Type Badge */}
      <div className="question-type-badge">
        {question?.question_type === 'true_false' ? 'TRUE/FALSE' : 'MULTIPLE CHOICE'}
      </div>

      {/* Question Text */}
      <motion.div
        className="question-text"
        key={question?.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {question?.text}
      </motion.div>

      {/* Answer Options (for host reference) */}
      {showAnswers && question?.options && (
        <motion.div
          className="answer-options-host"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="options-label">Answer Options:</div>
          <div className="options-grid">
            {question.options.map((option, index) => (
              <div key={index} className="option-item">
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="option-text">{option}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Answer Count */}
      <div className="answer-count">
        <span className="count-number">0/{totalQuestions}</span>
        <span className="count-label">answers</span>
      </div>
    </div>
  );
};

export default QuestionDisplay;

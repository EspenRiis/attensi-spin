import { motion } from 'framer-motion';
import './AnswerDistribution.css';

const AnswerDistribution = ({ question, results, correctAnswer }) => {
  if (!results || results.length === 0) {
    return null;
  }

  // Calculate distribution
  const distribution = {};
  const optionLabels = question.options || [];

  // Initialize with 0 for all options
  optionLabels.forEach((_, index) => {
    distribution[index] = 0;
  });

  // Count answers
  results.forEach((result) => {
    result.answer.forEach((answerIndex) => {
      const index = parseInt(answerIndex);
      distribution[index] = (distribution[index] || 0) + 1;
    });
  });

  const totalAnswers = results.length;
  const maxCount = Math.max(...Object.values(distribution), 1);

  const isCorrectAnswer = (index) => {
    return correctAnswer.includes(index.toString());
  };

  return (
    <div className="answer-distribution">
      <div className="distribution-header">
        <h3>Answer Distribution</h3>
        <p className="distribution-subtitle">
          {totalAnswers} {totalAnswers === 1 ? 'player' : 'players'} answered
        </p>
      </div>

      <div className="distribution-chart">
        {optionLabels.map((option, index) => {
          const count = distribution[index] || 0;
          const percentage = totalAnswers > 0 ? (count / totalAnswers) * 100 : 0;
          const barHeight = totalAnswers > 0 ? (count / maxCount) * 100 : 0;
          const isCorrect = isCorrectAnswer(index);

          return (
            <div
              key={index}
              className={`distribution-bar ${isCorrect ? 'correct' : ''}`}
            >
              <div className="bar-label">
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                {isCorrect && <span className="correct-badge">✓</span>}
              </div>

              <div className="bar-container">
                <motion.div
                  className="bar-fill"
                  initial={{ height: 0 }}
                  animate={{ height: `${barHeight}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 }}
                />
              </div>

              <div className="bar-stats">
                <span className="answer-count">{count}</span>
                <span className="answer-percentage">{percentage.toFixed(0)}%</span>
              </div>

              <div className="option-text">{option}</div>
            </div>
          );
        })}
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <div className="summary-item">
          <span className="summary-value">
            {results.filter((r) => r.is_correct).length}
          </span>
          <span className="summary-label">Correct</span>
        </div>
        <div className="summary-item">
          <span className="summary-value">
            {results.filter((r) => !r.is_correct).length}
          </span>
          <span className="summary-label">Incorrect</span>
        </div>
        <div className="summary-item">
          <span className="summary-value">
            {(
              results.reduce((sum, r) => sum + r.time_taken, 0) / results.length
            ).toFixed(1)}s
          </span>
          <span className="summary-label">Avg Time</span>
        </div>
      </div>
    </div>
  );
};

export default AnswerDistribution;

import { motion, AnimatePresence } from 'framer-motion';
import './Leaderboard.css';

const Leaderboard = ({ leaderboard, highlightChanges = false }) => {
  const getMedalEmoji = (position) => {
    if (position === 0) return '🥇';
    if (position === 1) return '🥈';
    if (position === 2) return '🥉';
    return null;
  };

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h2>Leaderboard</h2>
        <div className="leaderboard-subtitle">Live Rankings</div>
      </div>

      <div className="leaderboard-list">
        <AnimatePresence mode="popLayout">
          {leaderboard.map((player, index) => (
            <motion.div
              key={player.participant_id}
              className={`leaderboard-item ${index < 3 ? 'top-three' : ''}`}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: highlightChanges ? [1, 1.05, 1] : 1,
              }}
              exit={{ opacity: 0, x: 20 }}
              transition={{
                layout: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 },
              }}
            >
              <div className="player-rank">
                {getMedalEmoji(index) || (
                  <span className="rank-number">{index + 1}</span>
                )}
              </div>

              <div className="player-info">
                <div className="player-name">{player.username}</div>
                <div className="player-stats">
                  <span className="stat">
                    {player.correct_answers}/{player.total_answers} correct
                  </span>
                  {player.average_time > 0 && (
                    <span className="stat">
                      {player.average_time.toFixed(1)}s avg
                    </span>
                  )}
                </div>
              </div>

              <div className="player-score">
                <motion.span
                  key={player.total_score}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.3 }}
                >
                  {player.total_score}
                </motion.span>
                <span className="score-label">pts</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {leaderboard.length === 0 && (
          <div className="empty-leaderboard">
            <p>No scores yet</p>
            <p className="empty-subtitle">Players will appear as they answer</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;

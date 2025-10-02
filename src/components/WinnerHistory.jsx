import { motion, AnimatePresence } from 'framer-motion';
import './WinnerHistory.css';

const WinnerHistory = ({ winners, onClear }) => {
  if (winners.length === 0) return null;

  return (
    <motion.div
      className="winner-history"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="history-header">
        <h3>Previous Winners</h3>
        <button className="clear-history-btn" onClick={onClear}>
          Clear History
        </button>
      </div>
      <div className="history-items">
        <AnimatePresence>
          {winners.map((winner, index) => (
            <motion.div
              key={`${winner}-${index}`}
              className="history-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
            >
              <span className="history-rank">#{index + 1}</span>
              <span className="history-name">{winner}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default WinnerHistory;

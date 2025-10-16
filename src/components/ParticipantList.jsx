import { motion, AnimatePresence } from 'framer-motion';
import './ParticipantList.css';

const ParticipantList = ({ names, onRemove, onClearAll, winners = [] }) => {
  return (
    <div className="participant-list">
      <div className="list-header">
        <h3>Participants</h3>
        <span className="participant-count">{names.length} {names.length === 1 ? 'person' : 'people'}</span>
      </div>

      <div className="list-items">
        <AnimatePresence>
          {names.map((name, index) => {
            const isWinner = winners.includes(name);
            return (
              <motion.div
                key={`${name}-${index}`}
                className={`list-item ${isWinner ? 'winner' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="item-number">{index + 1}</span>
                <span className="item-name">{name}</span>
                {isWinner && <span className="winner-badge">🏆</span>}
                <button
                  className="item-remove"
                  onClick={() => onRemove(name)}
                  title="Remove participant"
                >
                  ×
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {names.length === 0 && (
        <div className="empty-state">
          <p>No participants yet</p>
          <p className="empty-subtitle">Add names to get started!</p>
        </div>
      )}

      {/* Clear All - subtle text link below list */}
      {onClearAll && names.length > 0 && (
        <button
          className="clear-all-link"
          onClick={onClearAll}
          title="Clear all participants"
        >
          Clear all participants
        </button>
      )}
    </div>
  );
};

export default ParticipantList;

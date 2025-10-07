import { motion, AnimatePresence } from 'framer-motion';
import './ParticipantList.css'; // Reuse the same styles

const WinnerList = ({ winners, onRestore, onRestoreAll }) => {
  return (
    <div className="participant-list winner-list">
      <div className="list-header">
        <h3>Winners</h3>
        <span className="participant-count">{winners.length} {winners.length === 1 ? 'winner' : 'winners'}</span>
      </div>

      <div className="list-items">
        <AnimatePresence>
          {winners.map((name, index) => (
            <motion.div
              key={`${name}-${index}`}
              className="list-item winner"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
            >
              <span className="item-number">{index + 1}</span>
              <span className="item-name">{name}</span>
              <span className="winner-badge">🏆</span>
              <button
                className="item-remove"
                onClick={() => onRestore(name)}
                title="Restore to wheel"
              >
                ↻
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {winners.length === 0 && (
        <div className="empty-state">
          <p>No winners yet</p>
          <p className="empty-subtitle">Spin the wheel to pick winners!</p>
        </div>
      )}

      {winners.length > 0 && onRestoreAll && (
        <button
          onClick={onRestoreAll}
          className="btn-restore-all"
          style={{
            marginTop: '16px',
            width: '100%',
            padding: '12px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#5568d3'}
          onMouseLeave={(e) => e.target.style.background = '#667eea'}
        >
          Restore All to Wheel
        </button>
      )}
    </div>
  );
};

export default WinnerList;

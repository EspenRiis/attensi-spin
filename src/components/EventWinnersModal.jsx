import { motion } from 'framer-motion';
import './WelcomeModal.css'; // Reuse existing modal styles

const EventWinnersModal = ({ winnersCount, onKeepWinners, onStartFresh, onStartEmpty }) => {
  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="modal-content"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.5 }}
      >
        <div className="modal-icon">🏆</div>
        <h2>This Event Has Winners!</h2>
        <p>Found {winnersCount} {winnersCount === 1 ? 'winner' : 'winners'} from a previous session.</p>
        <p className="modal-subtitle">How would you like to proceed?</p>

        <div className="modal-buttons" style={{ flexDirection: 'column', gap: '12px' }}>
          <button className="btn-continue" onClick={onKeepWinners}>
            <span>Keep Existing Winners</span>
            <span className="btn-subtitle">Winners removed from wheel, participants stay</span>
          </button>

          <button className="btn-fresh" onClick={onStartFresh}>
            <span>Start Fresh</span>
            <span className="btn-subtitle">Reset winners, keep all participants</span>
          </button>

          <button className="btn-fresh" onClick={onStartEmpty} style={{ opacity: 0.8 }}>
            <span>Start Empty</span>
            <span className="btn-subtitle">Clear everything (winners & participants)</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EventWinnersModal;

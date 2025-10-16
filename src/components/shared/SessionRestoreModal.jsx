import { motion } from 'framer-motion';
import './SharedModals.css';

/**
 * Shared modal for restoring previous session data
 * Used by both Name Roulette and Squad Scramble
 */
const SessionRestoreModal = ({
  title = "Welcome Back!",
  description = "Would you like to continue with your previous session?",
  icon = "🎯",
  continueLabel = "Continue",
  continueSubtitle = "Load saved data",
  freshLabel = "Start Fresh",
  freshSubtitle = "Clear all data",
  onContinue,
  onStartFresh
}) => {
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
        <div className="modal-icon">{icon}</div>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="modal-buttons">
          <button className="btn-continue" onClick={onContinue}>
            <span>{continueLabel}</span>
            <span className="btn-subtitle">{continueSubtitle}</span>
          </button>
          <button className="btn-fresh" onClick={onStartFresh}>
            <span>{freshLabel}</span>
            <span className="btn-subtitle">{freshSubtitle}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SessionRestoreModal;

import { motion } from 'framer-motion';
import './WelcomeModal.css';

const WelcomeModal = ({ onContinue, onStartFresh }) => {
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
        <div className="modal-icon">🎯</div>
        <h2>Welcome Back!</h2>
        <p>Would you like to continue with your previous session?</p>
        <div className="modal-buttons">
          <button className="btn-continue" onClick={onContinue}>
            <span>Continue</span>
            <span className="btn-subtitle">Load saved names</span>
          </button>
          <button className="btn-fresh" onClick={onStartFresh}>
            <span>Start Fresh</span>
            <span className="btn-subtitle">Clear all data</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeModal;

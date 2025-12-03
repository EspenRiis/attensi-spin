import { motion } from 'framer-motion';
import './HostControls.css';

const HostControls = ({
  onRevealAnswer,
  onNextQuestion,
  onExitToLobby,
  showReveal = true,
  showNext = false,
  answerRevealed = false,
}) => {
  return (
    <div className="host-controls">
      {showReveal && !answerRevealed && (
        <motion.button
          className="control-button reveal-button"
          onClick={onRevealAnswer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="button-icon">🔍</span>
          <span className="button-text">Reveal Answer</span>
        </motion.button>
      )}

      {showNext && (
        <motion.button
          className="control-button next-button"
          onClick={onNextQuestion}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="button-icon">➡️</span>
          <span className="button-text">Continue</span>
        </motion.button>
      )}

      <motion.button
        className="control-button exit-button"
        onClick={onExitToLobby}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="button-icon">🚪</span>
        <span className="button-text">Exit to Lobby</span>
      </motion.button>
    </div>
  );
};

export default HostControls;

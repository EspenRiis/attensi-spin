import { motion } from 'framer-motion';
import './SharedModals.css';

/**
 * Modal for importing participants from another tool (e.g., Name Roulette)
 * Used by Squad Scramble to detect and import participants
 */
const ParticipantImportModal = ({
  title = "Import Participants?",
  description,
  participantCount = 0,
  sourceTool = "Name Roulette",
  icon = "🔄",
  onImport,
  onStartEmpty
}) => {
  // Auto-generate description if not provided
  const defaultDescription = `Found ${participantCount} ${participantCount === 1 ? 'participant' : 'participants'} from an earlier session.`;

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
        <p>{description || defaultDescription}</p>
        <p className="modal-subtitle">Would you like to import them?</p>

        <div className="modal-buttons">
          <button className="btn-continue" onClick={onImport}>
            <span>Import Names</span>
            <span className="btn-subtitle">Load saved data</span>
          </button>
          <button className="btn-fresh" onClick={onStartEmpty}>
            <span>Start Empty</span>
            <span className="btn-subtitle">Add participants manually</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ParticipantImportModal;

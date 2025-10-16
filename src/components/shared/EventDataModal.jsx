import { motion } from 'framer-motion';
import './SharedModals.css';

/**
 * Shared modal for handling existing event data
 * Used by both Name Roulette and Squad Scramble
 * Supports multiple action options
 */
const EventDataModal = ({
  title = "This Event Has Data!",
  description,
  dataCount,
  dataLabel = "items",
  icon = "🏆",
  options = [],
  onOptionSelect
}) => {
  // Auto-generate description if not provided
  const defaultDescription = dataCount
    ? `Found ${dataCount} ${dataCount === 1 ? dataLabel.slice(0, -1) : dataLabel} from a previous session.`
    : description || "How would you like to proceed?";

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
        <p>{defaultDescription}</p>
        <p className="modal-subtitle">How would you like to proceed?</p>

        <div className="modal-buttons" style={{ flexDirection: 'column', gap: '12px' }}>
          {options.map((option, index) => (
            <button
              key={index}
              className={option.primary ? 'btn-continue' : 'btn-fresh'}
              onClick={() => onOptionSelect(option.value)}
              style={option.style}
            >
              <span>{option.label}</span>
              <span className="btn-subtitle">{option.subtitle}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EventDataModal;

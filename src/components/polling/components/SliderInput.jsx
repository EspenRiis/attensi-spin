import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../styles/SliderInput.css';

const SliderInput = ({
  value = 50,
  onChange,
  minLabel = '0',
  maxLabel = '100',
  disabled = false,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  const handleTouchStart = () => {
    setIsDragging(true);
    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Calculate color based on value (gradient from min to max)
  const getThumbColor = () => {
    const ratio = localValue / 100;
    const r = Math.round(255 * (1 - ratio) + 192 * ratio);
    const g = Math.round(107 * (1 - ratio) + 108 * ratio);
    const b = Math.round(157 * (1 - ratio) + 132 * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className={`slider-input ${disabled ? 'disabled' : ''} ${isDragging ? 'dragging' : ''}`}>
      {/* Current Value Display */}
      <motion.div
        className="slider-value-display"
        animate={{
          scale: isDragging ? 1.1 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <span className="value-number">{localValue}</span>
      </motion.div>

      {/* Labels */}
      <div className="slider-labels">
        <span className="label-min">{minLabel}</span>
        <span className="label-max">{maxLabel}</span>
      </div>

      {/* Slider Container */}
      <div className="slider-container">
        {/* Progress Track */}
        <div
          className="slider-progress"
          style={{
            width: `${localValue}%`,
            background: `linear-gradient(90deg, #FF6B9D 0%, ${getThumbColor()} 100%)`,
          }}
        />

        {/* Input */}
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={localValue}
          onChange={handleChange}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          disabled={disabled}
          className="slider-input-element"
          aria-label="Response slider"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={localValue}
        />

        {/* Tick Marks */}
        <div className="slider-ticks">
          {[0, 25, 50, 75, 100].map((tick) => (
            <div
              key={tick}
              className="tick-mark"
              style={{ left: `${tick}%` }}
            >
              <div className="tick-line" />
              <span className="tick-label">{tick}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Helper Text */}
      {disabled && (
        <div className="slider-disabled-message">
          Slider is currently disabled
        </div>
      )}
    </div>
  );
};

export default SliderInput;

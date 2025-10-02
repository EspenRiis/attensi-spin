import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import './WinnerModal.css';

const WinnerModal = ({ winner, onSpinAgain, onRemoveWinner, onClose }) => {
  useEffect(() => {
    // Trigger confetti animation
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#00D9FF', '#00FF88', '#0088FF', '#FFFFFF'],
        disableForReducedMotion: true
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#00D9FF', '#00FF88', '#0088FF', '#FFFFFF'],
        disableForReducedMotion: true
      });
    }, 250);

    return () => {
      clearInterval(interval);
      confetti.reset();
    };
  }, []);

  return (
    <motion.div
      className="winner-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        // Allow closing by clicking on the overlay background
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        className="winner-content"
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.6 }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          className="winner-icon"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 1
          }}
        >
          🎉
        </motion.div>
        
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Congratulations!
        </motion.h2>
        
        <motion.div
          className="winner-name"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {winner}
        </motion.div>
        
        <motion.div
          className="winner-buttons"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button 
            className="btn-spin-again" 
            onClick={(e) => {
              e.stopPropagation();
              onSpinAgain();
            }}
            type="button"
          >
            🎯 Spin Again
          </button>
          <button 
            className="btn-remove-winner" 
            onClick={(e) => {
              e.stopPropagation();
              onRemoveWinner();
            }}
            type="button"
          >
            ❌ Remove Winner
          </button>
          <button 
            className="btn-close-modal" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            type="button"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default WinnerModal;
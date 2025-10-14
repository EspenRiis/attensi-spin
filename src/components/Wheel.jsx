import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { generateSegmentColors } from '../utils/colors';
import './Wheel.css';

const Wheel = ({ names, onSpinComplete, isSpinning, clearWinner }) => {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [targetRotation, setTargetRotation] = useState(0);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [spinTrigger, setSpinTrigger] = useState(0);
  const [pointerBounce, setPointerBounce] = useState(false);
  const hasCalculatedWinner = useRef(false);
  const onSpinCompleteRef = useRef(onSpinComplete);
  const currentAnimationTarget = useRef(null);
  const emptyAnimationFrame = useRef(null);

  useEffect(() => {
    onSpinCompleteRef.current = onSpinComplete;
  }, [onSpinComplete]);

  // Separate effect for empty state animation
  useEffect(() => {
    if (names.length === 0) {
      // Start the empty state animation loop
      const animateEmptyState = () => {
        drawEmptyWheel();
        emptyAnimationFrame.current = requestAnimationFrame(animateEmptyState);
      };
      animateEmptyState();
    } else {
      // Cancel empty animation when names are added
      if (emptyAnimationFrame.current) {
        cancelAnimationFrame(emptyAnimationFrame.current);
        emptyAnimationFrame.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (emptyAnimationFrame.current) {
        cancelAnimationFrame(emptyAnimationFrame.current);
        emptyAnimationFrame.current = null;
      }
    };
  }, [names.length]);

  // Regular wheel rendering - only when we have names
  useEffect(() => {
    if (names.length > 0) {
      drawWheel();
    }
  }, [names, rotation, winnerIndex]);

  useEffect(() => {
    if (isSpinning) {
      // Reset ALL state for new spin
      hasCalculatedWinner.current = false;
      currentAnimationTarget.current = null;
      setWinnerIndex(null);
      setIsAnimating(false);
      spinWheel();
    }
  }, [isSpinning]);

  useEffect(() => {
    if (clearWinner) {
      setWinnerIndex(null);
    }
  }, [clearWinner]);

  const drawEmptyWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create animated gradient background for empty state
    const time = Date.now() / 1000;
    const gradient = ctx.createLinearGradient(
      centerX + Math.cos(time) * radius,
      centerY + Math.sin(time) * radius,
      centerX - Math.cos(time) * radius,
      centerY - Math.sin(time) * radius
    );
    gradient.addColorStop(0, '#1a2942');
    gradient.addColorStop(0.5, '#2a3952');
    gradient.addColorStop(1, '#1a2942');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Animated glowing border
    ctx.strokeStyle = `rgba(0, 217, 255, ${0.5 + Math.sin(time * 2) * 0.3})`;
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00D9FF';
    ctx.shadowBlur = 15 + Math.sin(time * 2) * 5;
    ctx.stroke();

    // Draw placeholder segments
    const placeholderCount = 8;
    const anglePerSegment = (2 * Math.PI) / placeholderCount;
    for (let i = 0; i < placeholderCount; i++) {
      const startAngle = i * anglePerSegment - Math.PI / 2;
      const endAngle = startAngle + anglePerSegment;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius - 10, startAngle, endAngle);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 70, 0, 2 * Math.PI);
    ctx.fillStyle = '#0A1628';
    ctx.fill();
    ctx.strokeStyle = '#00D9FF';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Text with glow
    ctx.shadowColor = '#00D9FF';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#00D9FF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Add names', centerX, centerY - 10);
    ctx.font = 'bold 14px Arial';
    ctx.fillText('to start!', centerX, centerY + 10);
  };

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const colors = generateSegmentColors(names.length);
    const anglePerSegment = (2 * Math.PI) / names.length;

    names.forEach((name, index) => {
      const startAngle = index * anglePerSegment - Math.PI / 2 + (rotation * Math.PI) / 180;
      const endAngle = startAngle + anglePerSegment;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index];
      ctx.fill();

      // Show golden glow only for the most recent winner (after animation completes)
      if (winnerIndex === index && !isAnimating) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 8;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 25;
      } else {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerSegment / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';

      let fontSize = 16;
      if (names.length <= 4) fontSize = 24;
      else if (names.length <= 8) fontSize = 20;
      else if (names.length <= 12) fontSize = 18;
      else if (names.length <= 20) fontSize = 16;
      else fontSize = 14;

      ctx.font = `bold ${fontSize}px Arial`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;

      const maxChars = names.length <= 8 ? 20 : 15;
      const displayName = name.length > maxChars ? name.substring(0, maxChars - 3) + '...' : name;
      ctx.fillText(displayName, radius - 25, 0);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, 60, 0, 2 * Math.PI);
    ctx.fillStyle = '#0A1628';
    ctx.fill();
    ctx.strokeStyle = '#00D9FF';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#00D9FF';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ATTENSI', centerX, centerY);
  };

  const spinWheel = () => {
    // Simple random spin - calculate winner AFTER based on where it stops
    const numberOfSpins = 5 + Math.random() * 5;
    const extraDegrees = Math.random() * 360;
    const totalRotation = numberOfSpins * 360 + extraDegrees;
    // Use targetRotation (or rotation if no target) to ensure consecutive spins work
    const baseRotation = targetRotation || rotation;
    const newTarget = baseRotation + totalRotation;

    setTargetRotation(newTarget);
    currentAnimationTarget.current = newTarget;
    // Increment spin trigger to force animation effect to run
    setSpinTrigger(prev => prev + 1);
  };

  useEffect(() => {
    // Only check spinTrigger to start animation, ignore rotation changes during animation
    if (spinTrigger > 0 &&
        targetRotation !== rotation &&
        Math.abs(targetRotation - rotation) > 0.1 &&
        currentAnimationTarget.current === targetRotation &&
        !isAnimating) {

      setIsAnimating(true);

      const mainDuration = 10000; // Main spin duration
      const settlingDuration = 800; // Settling animation duration
      const totalDuration = mainDuration + settlingDuration;
      const startTime = Date.now();
      const startRotation = rotation;
      const deltaRotation = targetRotation - startRotation;
      let winnerEffectsTriggered = false;

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);

        let currentRotation;

        if (elapsed < mainDuration) {
          // Main spin phase
          const mainProgress = elapsed / mainDuration;
          const easeOut = 1 - Math.pow(1 - mainProgress, 7);
          currentRotation = startRotation + deltaRotation * easeOut;

          // Trigger winner effects while wheel is still visibly moving (at 98%)
          if (mainProgress >= 0.98 && !winnerEffectsTriggered) {
            winnerEffectsTriggered = true;

            if (!hasCalculatedWinner.current) {
              hasCalculatedWinner.current = true;

              const finalNormalized = ((targetRotation % 360) + 360) % 360;
              const anglePerSegment = 360 / names.length;
              const segmentsRotated = finalNormalized / anglePerSegment;
              const calculatedWinnerIndex = (names.length - Math.floor(segmentsRotated) - 1 + names.length) % names.length;

              setWinnerIndex(calculatedWinnerIndex);

              // Trigger pointer bounce animation
              setPointerBounce(true);
              setTimeout(() => setPointerBounce(false), 600);

              // Trigger confetti burst from wheel center
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.5 },
                colors: ['#FFD700', '#00D9FF', '#00FF88', '#FFFFFF'],
                disableForReducedMotion: true
              });
            }
          }
        } else {
          // Settling phase - visible bounces (with winner already glowing)
          const settlingProgress = (elapsed - mainDuration) / settlingDuration;
          const settlingAmount = 8; // degrees of bounce - increased from 3 to 8 for visibility

          // Damped oscillation - creates realistic settling effect
          const dampingFactor = Math.pow(1 - settlingProgress, 2);
          const oscillation = Math.sin(settlingProgress * Math.PI * 3) * settlingAmount * dampingFactor;

          currentRotation = targetRotation + oscillation;
        }

        setRotation(currentRotation);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          currentAnimationTarget.current = null;
          setRotation(targetRotation);
          setIsAnimating(false);

          // Calculate final winner for modal
          if (hasCalculatedWinner.current) {
            const finalNormalized = ((targetRotation % 360) + 360) % 360;
            const anglePerSegment = 360 / names.length;

            // Calculate winner based on which segment is at the top (0° pointer position)
            // The wheel is drawn with segments starting at -90° (top), so we need to account for that
            // After rotation, we check which segment index is now at the -90° position

            console.log('🎯 WINNER CALCULATION - Using Visual Detection Method');
            console.log('📊 Final Rotation:', finalNormalized.toFixed(2) + '°');
            console.log('📊 Segments:', names.length, '| Angle per segment:', anglePerSegment.toFixed(2) + '°\n');

            // Calculate which segment is at the top pointer after rotation
            const segmentsRotated = finalNormalized / anglePerSegment;
            const calculatedWinnerIndex = (names.length - Math.floor(segmentsRotated) - 1 + names.length) % names.length;

            // Debug: show all segments and their positions
            names.forEach((name, index) => {
              const startAngle = index * anglePerSegment - 90 + finalNormalized;
              const endAngle = startAngle + anglePerSegment;
              const normalizedStart = ((startAngle % 360) + 360) % 360;
              const normalizedEnd = ((endAngle % 360) + 360) % 360;

              if (index === calculatedWinnerIndex) {
                console.log(`  ✅ WINNER: [${index}] ${name} (${normalizedStart.toFixed(1)}° to ${normalizedEnd.toFixed(1)}°)`);
              } else {
                console.log(`  [${index}] ${name}: ${normalizedStart.toFixed(1)}° to ${normalizedEnd.toFixed(1)}°`);
              }
            });

            console.log('\n' + '═'.repeat(60) + '\n');

            // Show winner modal with reduced delay
            setTimeout(() => {
              onSpinCompleteRef.current(names[calculatedWinnerIndex]);
            }, 200);
          }
        }
      };

      animate();
    }
  }, [targetRotation, rotation, names, spinTrigger]);

  const handleCanvasClick = (event) => {
    if (isAnimating || isSpinning) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const distance = Math.sqrt(Math.pow(canvasX - centerX, 2) + Math.pow(canvasY - centerY, 2));

    if (distance <= 60 && names.length >= 2) {
      spinWheel();
      setIsAnimating(true);
    }
  };

  return (
    <div className="wheel-container">
      <div className={`wheel-pointer ${pointerBounce ? 'pointer-bounce-winner' : ''}`}>▼</div>
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        className="wheel-canvas"
        onClick={handleCanvasClick}
        style={{ cursor: (names.length >= 2 && !isAnimating && !isSpinning) ? 'pointer' : 'default' }}
      />
    </div>
  );
};

export default Wheel;

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { generateSegmentColors } from '../utils/colors';
import './Wheel.css';

const Wheel = ({ names, onSpinComplete, isSpinning }) => {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [targetRotation, setTargetRotation] = useState(0);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const hasCalculatedWinner = useRef(false);
  const onSpinCompleteRef = useRef(onSpinComplete);
  const currentAnimationTarget = useRef(null);
  const preSelectedWinner = useRef(null);

  useEffect(() => {
    onSpinCompleteRef.current = onSpinComplete;
  }, [onSpinComplete]);

  useEffect(() => {
    drawWheel();
  }, [names, rotation, winnerIndex]);

  useEffect(() => {
    if (isSpinning) {
      // Reset state for new spin
      hasCalculatedWinner.current = false;
      preSelectedWinner.current = null;
      setWinnerIndex(null);
      spinWheel();
    }
  }, [isSpinning]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (names.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#1a2942';
      ctx.fill();
      ctx.strokeStyle = '#00D9FF';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#00D9FF';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add names to start!', centerX, centerY);
      return;
    }

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

      // Only show golden glow after animation is complete
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
    ctx.fillText('SK', centerX, centerY);
  };

  const spinWheel = () => {
    // PRE-SELECT THE WINNER
    const randomWinnerIndex = Math.floor(Math.random() * names.length);
    preSelectedWinner.current = randomWinnerIndex;

    const anglePerSegment = 360 / names.length;
    const numberOfSpins = 5 + Math.random() * 5;
    const fullSpins = numberOfSpins * 360;

    const currentNormalized = ((rotation % 360) + 360) % 360;

    // CORRECT FORMULA: 90 - (index + 0.5) * anglePerSegment
    let targetAngle = 90 - (randomWinnerIndex + 0.5) * anglePerSegment;
    targetAngle = ((targetAngle % 360) + 360) % 360;

    let angleToRotate = targetAngle - currentNormalized;
    while (angleToRotate <= 0) {
      angleToRotate += 360;
    }

    const newTarget = rotation + fullSpins + angleToRotate;

    setTargetRotation(newTarget);
    currentAnimationTarget.current = newTarget;
  };

  useEffect(() => {
    if (targetRotation !== rotation &&
        Math.abs(targetRotation - rotation) > 0.1 &&
        currentAnimationTarget.current === targetRotation) {

      setIsAnimating(true);

      const duration = 10000;
      const startTime = Date.now();
      const startRotation = rotation;
      const deltaRotation = targetRotation - startRotation;

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeOut = 1 - Math.pow(1 - progress, 7);
        const currentRotation = startRotation + deltaRotation * easeOut;

        setRotation(currentRotation);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          currentAnimationTarget.current = null;
          setRotation(targetRotation);
          setIsAnimating(false);

          if (!hasCalculatedWinner.current && preSelectedWinner.current !== null) {
            hasCalculatedWinner.current = true;
            setWinnerIndex(preSelectedWinner.current);

            setTimeout(() => {
              onSpinCompleteRef.current(names[preSelectedWinner.current]);
            }, 500);
          }
        }
      };

      animate();
    }
  }, [targetRotation, rotation, names]);

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
      <div className="wheel-pointer">▼</div>
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

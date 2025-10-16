import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TeamCard from './TeamCard';
import './TeamDisplay.css';

const TeamDisplay = ({ teams, setTeams, isEventMode, generationId, autoAssignCaptains, skipAnimations = false, onAnimationComplete }) => {
  const [revealedTeams, setRevealedTeams] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationMode, setAnimationMode] = useState('initial'); // 'initial' or 'update'
  const [currentShowcaseIndex, setCurrentShowcaseIndex] = useState(null);
  const [allShowcasesComplete, setAllShowcasesComplete] = useState(true); // Start true - will be set false when showcases begin
  const [showSkipButton, setShowSkipButton] = useState(false);
  const skipAnimationsRef = useRef(false);
  const hasRevealedRef = useRef(false);
  const teamCountRef = useRef(0);
  const animationTimeoutRef = useRef(null);
  const resolveAnimationRef = useRef(null);

  // Reveal teams one by one when teams change
  useEffect(() => {
    if (teams.length > 0) {
      // Check if this is a new generation or just an update
      const isNewGeneration = teams.length !== teamCountRef.current || !hasRevealedRef.current;
      teamCountRef.current = teams.length;

      // If skipAnimations is true, just show all teams immediately
      if (skipAnimations) {
        setAnimationMode('update');
        setRevealedTeams(teams.map((_, i) => i)); // Set to array of indices
        setCurrentShowcaseIndex(null);
        setAllShowcasesComplete(true);
        setShowSkipButton(false);
        setShowConfetti(false);
        hasRevealedRef.current = true;
        return;
      }

      if (isNewGeneration) {
        // Full dramatic reveal sequence - clear all state first
        setAnimationMode('initial');
        setRevealedTeams([]); // Clear immediately
        setCurrentShowcaseIndex(null); // Clear showcase state
        setAllShowcasesComplete(false); // Hide grid during showcases
        skipAnimationsRef.current = false; // Reset skip flag
        setShowSkipButton(true); // Show skip button
        hasRevealedRef.current = true;

        const revealSequence = async () => {
          // Brief delay to ensure state clears
          await new Promise(resolve => setTimeout(resolve, 100));

          for (let i = 0; i < teams.length; i++) {
            // Check if animations should be skipped
            if (skipAnimationsRef.current) {
              break;
            }

            const currentTeam = teams[i];

            // Start showcase
            setCurrentShowcaseIndex(i);

            // Calculate timing for this team's showcase
            const teamNameDelay = 1000; // Team name appears
            const memberRevealTime = currentTeam.members.length * 300; // 300ms per member

            // Captain selection timing (if captain exists)
            let captainSelectionTime = 0;
            if (currentTeam.captain) {
              const fullCycles = 2;
              const captainIndex = currentTeam.members.findIndex(m => m.id === currentTeam.captain.id);
              const totalSteps = (fullCycles * currentTeam.members.length) + captainIndex + 1;
              // Average delay calculation: starts at 80ms, ends at ~380ms
              const avgDelay = 80 + 150; // Approximate average
              captainSelectionTime = 600 + (totalSteps * avgDelay) + 800; // Pause + spins + final hold
            }

            const completePauseTime = 1000; // Show complete team

            const totalShowcaseTime = teamNameDelay + memberRevealTime + captainSelectionTime + completePauseTime;

            // Wait for entire showcase to complete
            await new Promise(resolve => {
              resolveAnimationRef.current = resolve;
              animationTimeoutRef.current = setTimeout(() => {
                resolve();
                resolveAnimationRef.current = null;
              }, totalShowcaseTime);
            });

            // Check again after waiting
            if (skipAnimationsRef.current) {
              break;
            }

            // End showcase - fly down
            setCurrentShowcaseIndex(null);

            // Wait for fly-down animation to complete + brief pause
            await new Promise(resolve => {
              resolveAnimationRef.current = resolve;
              animationTimeoutRef.current = setTimeout(() => {
                resolve();
                resolveAnimationRef.current = null;
              }, 1000);
            });
          }

          // All showcases complete - now reveal all teams in the grid at once
          setCurrentShowcaseIndex(null);
          setRevealedTeams(teams.map((_, index) => index));
          setAllShowcasesComplete(true);
          setShowSkipButton(false); // Hide skip button
          skipAnimationsRef.current = false; // Reset skip flag

          // Show confetti after all teams revealed
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);

          // Show toast after animations complete
          if (onAnimationComplete) {
            onAnimationComplete(teams.length);
          }
        };
        revealSequence();
      } else {
        // Just an update (captain change, name edit, etc.)
        setAnimationMode('update');
        // Ensure all teams are revealed
        if (revealedTeams.length !== teams.length) {
          setRevealedTeams(teams.map((_, i) => i));
        }
      }
    } else {
      // Reset when teams are cleared
      hasRevealedRef.current = false;
      teamCountRef.current = 0;
      setRevealedTeams([]);
      setCurrentShowcaseIndex(null);
    }
  }, [teams]);

  const handleSkipAnimations = () => {
    skipAnimationsRef.current = true;

    // Clear any pending timeouts
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    // Resolve any pending animation promises immediately
    if (resolveAnimationRef.current) {
      resolveAnimationRef.current();
      resolveAnimationRef.current = null;
    }
  };

  const Confetti = () => {
    const pieces = Array.from({ length: 50 });
    return (
      <div className="confetti-container">
        {pieces.map((_, i) => (
          <motion.div
            key={i}
            className="confetti-piece"
            initial={{
              left: `${Math.random() * 100}%`,
              top: '-10px',
              rotate: 0
            }}
            animate={{
              top: '110vh',
              rotate: 360
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 0.5,
              ease: 'linear'
            }}
            style={{
              backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'][
                Math.floor(Math.random() * 5)
              ]
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Confetti - renders above everything */}
      {showConfetti && <Confetti />}

      {/* Skip button - render in portal to escape stacking context */}
      {showSkipButton && createPortal(
        <AnimatePresence>
          <motion.button
            className="skip-animations-button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleSkipAnimations}
          >
            Skip ⏭
          </motion.button>
        </AnimatePresence>,
        document.body
      )}

      {/* Showcase Layer - renders above everything, outside the main container */}
      <AnimatePresence mode="wait">
        {currentShowcaseIndex !== null && (
          <motion.div
            className="showcase-layer"
            initial={{ backgroundColor: 'rgba(10, 22, 40, 0)' }}
            animate={{ backgroundColor: 'rgba(10, 22, 40, 0.85)' }}
            exit={{ backgroundColor: 'rgba(10, 22, 40, 0)' }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <TeamCard
              team={teams[currentShowcaseIndex]}
              teams={teams}
              setTeams={setTeams}
              isEventMode={isEventMode}
              generationId={generationId}
              animationMode="showcase"
              isShowcase={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content - grid section */}
      <motion.div
        className="team-display-section"
        initial={{ opacity: 0, y: 50 }}
        animate={{
          opacity: allShowcasesComplete ? 1 : 0,
          y: allShowcasesComplete ? 0 : 50
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Only show header when all showcases are complete */}
        {allShowcasesComplete && (
          <div className="teams-header">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              🎉 Your Teams
            </motion.h2>
            <motion.p
              className="teams-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {teams.length} teams • {teams.reduce((sum, t) => sum + t.members.length, 0)} participants
            </motion.p>
          </div>
        )}

        {/* Grid Layer - only show after all showcases complete */}
        {allShowcasesComplete && (
          <div className="teams-grid">
            {teams.map((team, index) => {
              const isRevealed = revealedTeams.includes(index);

              return (
                <AnimatePresence key={team.teamNumber}>
                  {isRevealed && (
                    <TeamCard
                      team={team}
                      teams={teams}
                      setTeams={setTeams}
                      isEventMode={isEventMode}
                      generationId={generationId}
                      animationMode={animationMode}
                      isShowcase={false}
                    />
                  )}
                </AnimatePresence>
              );
            })}
          </div>
        )}
      </motion.div>
    </>
  );
};

export default TeamDisplay;

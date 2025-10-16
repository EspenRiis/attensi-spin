import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TeamCard from './TeamCard';
import './TeamDisplay.css';

const TeamDisplay = ({ teams, setTeams, isEventMode, generationId }) => {
  const [revealedTeams, setRevealedTeams] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);

  // Reveal teams one by one when teams change
  useEffect(() => {
    if (teams.length > 0) {
      // Reset revealed teams
      setRevealedTeams([]);

      const revealSequence = async () => {
        for (let i = 0; i < teams.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 300));
          setRevealedTeams(prev => [...prev, i]);
        }
        // Show confetti after all teams revealed
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      };
      revealSequence();
    }
  }, [teams]);

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
    <motion.div
      className="team-display-section"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      {showConfetti && <Confetti />}

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

      <div className="teams-grid">
        {teams.map((team, index) => (
          <AnimatePresence key={team.teamNumber}>
            {revealedTeams.includes(index) && (
              <TeamCard
                team={team}
                teams={teams}
                setTeams={setTeams}
                isEventMode={isEventMode}
                generationId={generationId}
              />
            )}
          </AnimatePresence>
        ))}
      </div>
    </motion.div>
  );
};

export default TeamDisplay;

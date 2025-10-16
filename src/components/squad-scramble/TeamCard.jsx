import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { setCaptain, updateTeamName as updateTeamNameUtil } from '../../utils/squadScramble';
import { updateTeamCaptain, updateTeamName as updateTeamNameDB } from '../../utils/teamStorage';
import './TeamCard.css';

const TeamCard = ({ team, teams, setTeams, isEventMode, generationId, animationMode = 'initial', isShowcase = false }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(team.name);
  const [membersRevealed, setMembersRevealed] = useState(animationMode === 'update');
  const [revealedMemberCount, setRevealedMemberCount] = useState(animationMode === 'update' ? team.members.length : 0);
  const [captainHighlightIndex, setCaptainHighlightIndex] = useState(-1);
  const [captainSelectionComplete, setCaptainSelectionComplete] = useState(!isShowcase || animationMode === 'update');

  const handleSetCaptain = async (member) => {
    try {
      // Update local state
      const updatedTeams = setCaptain(teams, team.teamNumber, member);
      setTeams(updatedTeams);

      // Update database if in event mode and has generationId
      if (isEventMode && team.id) {
        await updateTeamCaptain(team.id, member.id);
      }
    } catch (err) {
      console.error('Error setting captain:', err);
    }
  };

  const handleSaveTeamName = async () => {
    if (editedName.trim() === '') {
      setEditedName(team.name);
      setIsEditingName(false);
      return;
    }

    try {
      // Update local state
      const updatedTeams = updateTeamNameUtil(teams, team.teamNumber, editedName.trim());
      setTeams(updatedTeams);

      // Update database if in event mode and has team ID
      if (isEventMode && team.id) {
        await updateTeamNameDB(team.id, editedName.trim());
      }

      setIsEditingName(false);
    } catch (err) {
      console.error('Error updating team name:', err);
      setEditedName(team.name);
      setIsEditingName(false);
    }
  };

  const handleCancelEditName = () => {
    setEditedName(team.name);
    setIsEditingName(false);
  };

  // Get members sorted with captain first (only in grid, not during showcase)
  const getSortedMembers = () => {
    if (isShowcase || !captainSelectionComplete) {
      // During showcase, keep original order
      return team.members;
    }

    // In grid view, move captain to top
    if (team.captain) {
      const captainMember = team.members.find(m => m.id === team.captain.id);
      const otherMembers = team.members.filter(m => m.id !== team.captain.id);
      return captainMember ? [captainMember, ...otherMembers] : team.members;
    }

    return team.members;
  };

  // Trigger member reveal - sequential in showcase, instant in grid
  useEffect(() => {
    if (animationMode === 'showcase' && isShowcase) {
      // Reset states
      setMembersRevealed(false);
      setRevealedMemberCount(0);
      setCaptainHighlightIndex(-1);
      setCaptainSelectionComplete(false);

      const runShowcaseSequence = async () => {
        // Wait for team name to show (1s)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Start revealing members
        setMembersRevealed(true);

        // Reveal members one by one (300ms each)
        for (let i = 0; i <= team.members.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 300));
          setRevealedMemberCount(i);
        }

        // If team has captain, run captain selection animation
        if (team.captain && team.members.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 600)); // Brief pause

          // Find captain index
          const captainIndex = team.members.findIndex(m => m.id === team.captain.id);

          // Calculate spins to land exactly on captain
          const fullCycles = 2; // Complete cycles before landing
          const totalSteps = (fullCycles * team.members.length) + captainIndex + 1; // +1 to land ON captain
          const baseDelay = 80; // Start speed

          for (let step = 0; step < totalSteps; step++) {
            const currentIndex = step % team.members.length;
            setCaptainHighlightIndex(currentIndex);

            // Smooth ease-out curve
            const progress = step / (totalSteps - 1);
            const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
            const delay = baseDelay + (easeOut * 300); // Gradually slow down
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          // We're now on the captain - hold position
          await new Promise(resolve => setTimeout(resolve, 800)); // Longer hold
          setCaptainSelectionComplete(true);
        } else {
          setCaptainSelectionComplete(true);
        }
      };

      runShowcaseSequence();
    } else if (animationMode === 'initial' && !isShowcase) {
      // In grid, show all members immediately
      setMembersRevealed(true);
      setRevealedMemberCount(team.members.length);
      setCaptainSelectionComplete(true);
      setCaptainHighlightIndex(-1);
    } else if (animationMode === 'update') {
      // For updates, show members immediately
      setMembersRevealed(true);
      setRevealedMemberCount(team.members.length);
      setCaptainSelectionComplete(true);
      setCaptainHighlightIndex(-1);
    }
  }, [animationMode, isShowcase, team.members.length, team.captain]);

  // Animation variants - showcase appears, then flies down to grid
  const showcaseVariants = {
    hidden: {
      opacity: 0,
      scale: 0.5,
      y: -30
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1] // Back ease for bounce-in
      }
    },
    exit: {
      opacity: 0,
      scale: 0.5,
      y: 400,
      transition: {
        duration: 0.8,
        ease: [0.32, 0, 0.67, 0] // Ease-in for acceleration
      }
    }
  };

  const gridVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] // Smooth ease-out
      }
    },
    update: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <motion.div
      className={`team-card ${isShowcase ? 'showcase-mode' : ''} bg-gradient-to-br ${team.color.bg}`}
      variants={isShowcase ? showcaseVariants : gridVariants}
      initial="hidden"
      animate={animationMode === 'update' && !isShowcase ? 'update' : 'visible'}
      exit="exit"
      transition={{
        duration: isShowcase ? 0.5 : (animationMode === 'update' ? 0.3 : 0.4),
        ease: [0.4, 0, 0.2, 1] // Custom cubic-bezier for smooth motion
      }}
      style={{
        borderColor: `var(--${team.color.border})`,
        borderWidth: '3px',
        borderStyle: 'solid'
      }}
    >
      {/* Team Header */}
      <div className="team-header">
        {isEditingName ? (
          <div className="team-name-edit">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleSaveTeamName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTeamName();
                if (e.key === 'Escape') handleCancelEditName();
              }}
              className="team-name-input"
              autoFocus
              maxLength={50}
            />
          </div>
        ) : (
          <h3
            className="team-name"
            onClick={() => setIsEditingName(true)}
            title="Click to edit"
          >
            {team.name}
          </h3>
        )}
        <span className="team-size-badge">
          {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
        </span>
      </div>

      {/* Captain Selection Message - show during showcase selection */}
      {isShowcase && captainHighlightIndex >= 0 && !captainSelectionComplete && (
        <motion.div
          className="captain-selection-message"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
        >
          <span className="selection-icon">👑</span>
          <span className="selection-text">Selecting Team Captain...</span>
        </motion.div>
      )}

      {/* Captain Hint - only show when not in showcase and members are revealed */}
      {!isShowcase && membersRevealed && !team.captain && team.members.length > 0 && (
        <div className="captain-hint">
          💡 Click a member to assign captain
        </div>
      )}

      {/* Team Members - shown based on reveal state */}
      {membersRevealed && (
        <div className="team-members">
          {getSortedMembers().slice(0, revealedMemberCount).map((member, index) => {
            const isCaptain = team.captain?.id === member.id;
            // During showcase, highlight based on current index in ORIGINAL order
            const originalIndex = team.members.findIndex(m => m.id === member.id);
            const isHighlighted = captainHighlightIndex === originalIndex && !captainSelectionComplete;
            const isFinalCaptain = isCaptain && captainSelectionComplete;

            return (
              <motion.div
                key={member.id}
                layout // Enable layout animations for reordering
                className={`team-member ${isFinalCaptain ? 'captain' : ''} ${isHighlighted ? 'captain-highlight' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                  layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } // Smooth reordering
                }}
                onClick={() => !isCaptain && !isShowcase && handleSetCaptain(member)}
                title={isFinalCaptain ? 'Captain' : (isShowcase ? '' : 'Click to make captain')}
              >
                <div className="member-info">
                  {isFinalCaptain && <span className="captain-badge">👑</span>}
                  <span className="member-name">{member.name}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default TeamCard;

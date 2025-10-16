import { useState } from 'react';
import { motion } from 'framer-motion';
import { setCaptain, updateTeamName as updateTeamNameUtil } from '../../utils/squadScramble';
import { updateTeamCaptain, updateTeamName as updateTeamNameDB } from '../../utils/teamStorage';
import './TeamCard.css';

const TeamCard = ({ team, teams, setTeams, isEventMode, generationId }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(team.name);

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

  return (
    <motion.div
      className={`team-card bg-gradient-to-br ${team.color.bg}`}
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5, type: 'spring' }}
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

      {/* Team Members */}
      <div className="team-members">
        {team.members.map((member, index) => {
          const isCaptain = team.captain?.id === member.id;

          return (
            <motion.div
              key={member.id}
              className={`team-member ${isCaptain ? 'captain' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => !isCaptain && handleSetCaptain(member)}
              title={isCaptain ? 'Captain' : 'Click to make captain'}
            >
              <div className="member-info">
                {isCaptain && <span className="captain-badge">👑</span>}
                <span className="member-name">{member.name}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default TeamCard;

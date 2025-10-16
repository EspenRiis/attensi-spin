import { motion } from 'framer-motion';
import './TeamConfiguration.css';

const TeamConfiguration = ({
  mode,
  setMode,
  teamCount,
  setTeamCount,
  teamSize,
  setTeamSize,
  participantCount
}) => {
  const handleTeamCountChange = (e) => {
    const value = e.target.value;
    // Allow empty string for editing
    if (value === '') {
      setTeamCount('');
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setTeamCount(Math.max(2, Math.min(50, numValue)));
    }
  };

  const handleTeamSizeChange = (e) => {
    const value = e.target.value;
    // Allow empty string for editing
    if (value === '') {
      setTeamSize('');
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setTeamSize(Math.max(1, Math.min(50, numValue)));
    }
  };

  const handleTeamCountBlur = () => {
    if (teamCount === '' || teamCount < 2) {
      setTeamCount(2);
    }
  };

  const handleTeamSizeBlur = () => {
    if (teamSize === '' || teamSize < 1) {
      setTeamSize(1);
    }
  };

  const incrementTeamCount = () => {
    setTeamCount(prev => Math.min(50, (parseInt(prev) || 2) + 1));
  };

  const decrementTeamCount = () => {
    setTeamCount(prev => Math.max(2, (parseInt(prev) || 2) - 1));
  };

  const incrementTeamSize = () => {
    setTeamSize(prev => Math.min(50, (parseInt(prev) || 1) + 1));
  };

  const decrementTeamSize = () => {
    setTeamSize(prev => Math.max(1, (parseInt(prev) || 1) - 1));
  };

  const calculatePreview = () => {
    if (participantCount < 2) {
      return { teams: 0, avgSize: 0, remainder: 0 };
    }

    if (mode === 'team_count') {
      const avg = Math.floor(participantCount / teamCount);
      const remainder = participantCount % teamCount;
      return {
        teams: teamCount,
        avgSize: avg,
        remainder: remainder
      };
    } else {
      const teams = Math.ceil(participantCount / teamSize);
      const remainder = participantCount % teamSize;
      return {
        teams: teams,
        avgSize: teamSize,
        remainder: remainder === 0 ? 0 : remainder
      };
    }
  };

  const preview = calculatePreview();

  return (
    <motion.div
      className="team-configuration"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className="config-title">Team Settings</h2>

      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button
          className={`mode-button ${mode === 'team_count' ? 'active' : ''}`}
          onClick={() => setMode('team_count')}
        >
          # of Teams
        </button>
        <button
          className={`mode-button ${mode === 'team_size' ? 'active' : ''}`}
          onClick={() => setMode('team_size')}
        >
          Team Size
        </button>
      </div>

      {/* Input Field */}
      <div className="config-input-section">
        {mode === 'team_count' ? (
          <div className="input-group">
            <label htmlFor="teamCount">Number of Teams</label>
            <div className="number-input-wrapper">
              <button
                className="number-button decrease"
                onClick={decrementTeamCount}
                type="button"
              >
                −
              </button>
              <input
                id="teamCount"
                type="number"
                min="2"
                max="50"
                value={teamCount}
                onChange={handleTeamCountChange}
                onBlur={handleTeamCountBlur}
                className="config-input"
              />
              <button
                className="number-button increase"
                onClick={incrementTeamCount}
                type="button"
              >
                +
              </button>
            </div>
            <span className="input-hint">2-50 teams</span>
          </div>
        ) : (
          <div className="input-group">
            <label htmlFor="teamSize">People per Team</label>
            <div className="number-input-wrapper">
              <button
                className="number-button decrease"
                onClick={decrementTeamSize}
                type="button"
              >
                −
              </button>
              <input
                id="teamSize"
                type="number"
                min="1"
                max="50"
                value={teamSize}
                onChange={handleTeamSizeChange}
                onBlur={handleTeamSizeBlur}
                className="config-input"
              />
              <button
                className="number-button increase"
                onClick={incrementTeamSize}
                type="button"
              >
                +
              </button>
            </div>
            <span className="input-hint">1-50 people</span>
          </div>
        )}
      </div>

      {/* Preview */}
      {participantCount >= 2 && (
        <motion.div
          className="preview-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="preview-title">Preview</div>
          <div className="preview-stats">
            <div className="preview-stat">
              <span className="stat-value">{preview.teams}</span>
              <span className="stat-label">Teams</span>
            </div>
            <div className="preview-stat">
              <span className="stat-value">{preview.avgSize}</span>
              <span className="stat-label">Avg Size</span>
            </div>
            {preview.remainder > 0 && (
              <div className="preview-stat warning">
                <span className="stat-value">+{preview.remainder}</span>
                <span className="stat-label">In Last Team</span>
              </div>
            )}
          </div>
          <div className="preview-description">
            {mode === 'team_count' ? (
              preview.remainder > 0 ? (
                <span>
                  Most teams will have {preview.avgSize} people, with {preview.remainder} extra
                  {preview.remainder === 1 ? ' person' : ' people'} in the last team.
                </span>
              ) : (
                <span>All teams will have exactly {preview.avgSize} people.</span>
              )
            ) : (
              preview.remainder > 0 ? (
                <span>
                  Most teams will have {preview.avgSize} people, with the last team having{' '}
                  {preview.remainder} {preview.remainder === 1 ? 'person' : 'people'}.
                </span>
              ) : (
                <span>All teams will have exactly {preview.avgSize} people.</span>
              )
            )}
          </div>
        </motion.div>
      )}

      {participantCount < 2 && (
        <div className="preview-section empty">
          <p>Add at least 2 participants to see preview</p>
        </div>
      )}
    </motion.div>
  );
};

export default TeamConfiguration;

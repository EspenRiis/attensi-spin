import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  generateTeamsByCount,
  generateTeamsBySize,
  assignRandomCaptains,
  validateTeamParams
} from '../../utils/squadScramble';
import {
  saveTeamGeneration,
  loadCurrentTeamGeneration
} from '../../utils/teamStorage';
import {
  addName,
  loadNames,
  removeName,
  addNameToEvent,
  removeNameFromEvent,
  loadParticipantsFromEvent
} from '../../utils/storage';
import { hasSession, createNewSession, getCurrentSessionId } from '../../utils/session';
import TeamConfiguration from './TeamConfiguration';
import TeamDisplay from './TeamDisplay';
import ParticipantList from '../ParticipantList';
import QRCodePanel from '../QRCodePanel';
import './SquadScramblePage.css';

const SquadScramblePage = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');

  // Participant management
  const [participants, setParticipants] = useState([]);
  const [inputName, setInputName] = useState('');

  // Team configuration
  const [mode, setMode] = useState('team_count'); // 'team_count' or 'team_size'
  const [teamCount, setTeamCount] = useState(2);
  const [teamSize, setTeamSize] = useState(3);

  // Generated teams
  const [teams, setTeams] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationId, setGenerationId] = useState(null);

  // Event mode state
  const [isEventMode, setIsEventMode] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [user, setUser] = useState(null);

  // UI state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState('');

  // Initialize: Check auth state and eventId parameter
  useEffect(() => {
    const initialize = async () => {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      // If eventId is provided, switch to event mode
      if (eventId) {
        setIsEventMode(true);
        setCurrentEventId(eventId);
        await loadEventData(eventId);
      } else {
        // Free tier: session-based mode
        setIsEventMode(false);
        setCurrentEventId(null);
        await initializeSessionMode();
      }
    };

    initialize();
  }, [eventId]);

  const initializeSessionMode = async () => {
    if (hasSession()) {
      await loadSessionData();
    } else {
      // No session, create a new one
      createNewSession();
      await loadSessionData();
    }
  };

  const loadSessionData = async () => {
    const namesFromDB = await loadNames();
    setParticipants(namesFromDB.map((name, index) => ({
      id: `participant-${index}`,
      name: name
    })));

    // Try to load existing team generation
    const { teams: loadedTeams } = await loadCurrentTeamGeneration(null, null);
    if (loadedTeams && loadedTeams.length > 0) {
      setTeams(loadedTeams);
    }
  };

  const loadEventData = async (evtId) => {
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', evtId)
        .single();

      if (!eventError && eventData) {
        setCurrentEvent(eventData);
      }

      // Load participants
      const { names: loadedNames } = await loadParticipantsFromEvent(evtId);
      setParticipants(loadedNames.map((name, index) => ({
        id: `participant-${index}`,
        name: name
      })));

      // Load existing team generation
      const { teams: loadedTeams, generation } = await loadCurrentTeamGeneration(evtId, null);
      if (loadedTeams && loadedTeams.length > 0) {
        setTeams(loadedTeams);
        setGenerationId(generation?.id || null);
      }
    } catch (err) {
      console.error('Error loading event data:', err);
      showToastMessage('Error loading event data');
    }
  };

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();

    if (inputName.trim() && !participants.find(p => p.name === inputName.trim())) {
      const result = isEventMode
        ? await addNameToEvent(currentEventId, inputName.trim())
        : await addName(inputName.trim());

      if (result.success) {
        setParticipants(prev => [...prev, { id: `participant-${Date.now()}`, name: inputName.trim() }]);
        setInputName('');
        showToastMessage(`${inputName.trim()} added!`);
      } else {
        showToastMessage('Error adding participant!');
      }
    } else if (participants.find(p => p.name === inputName.trim())) {
      showToastMessage('Participant already exists!');
    }
  };

  const handleRemoveParticipant = async (name) => {
    const result = isEventMode
      ? await removeNameFromEvent(currentEventId, name)
      : await removeName(name);

    if (result.success) {
      setParticipants(prev => prev.filter(p => p.name !== name));
      showToastMessage(`${name} removed!`);
    } else {
      showToastMessage('Error removing participant!');
    }
  };

  const handleGenerateTeams = async () => {
    setError('');

    // Validate
    const value = mode === 'team_count' ? teamCount : teamSize;
    const validation = validateTeamParams(mode, value, participants.length);

    if (!validation.valid) {
      setError(validation.error);
      showToastMessage(validation.error);
      return;
    }

    setIsGenerating(true);

    // Simulate generation delay for UX
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Generate teams
      let result;
      if (mode === 'team_count') {
        result = generateTeamsByCount(participants, teamCount);
      } else {
        result = generateTeamsBySize(participants, teamSize);
      }

      // Assign random captains
      const teamsWithCaptains = assignRandomCaptains(result.teams);

      // Save to database
      const saveResult = await saveTeamGeneration({
        eventId: isEventMode ? currentEventId : null,
        sessionId: isEventMode ? null : getCurrentSessionId(),
        mode: result.mode,
        teamCount: result.mode === 'team_count' ? result.teamCount : null,
        teamSize: result.mode === 'team_size' ? result.teamSize : null,
        teams: teamsWithCaptains
      });

      if (saveResult.success) {
        setGenerationId(saveResult.generationId);
        setTeams(teamsWithCaptains);
        showToastMessage(`Generated ${teamsWithCaptains.length} teams!`);
      } else {
        throw new Error(saveResult.error);
      }
    } catch (err) {
      console.error('Error generating teams:', err);
      setError(err.message);
      showToastMessage('Error generating teams!');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateTeams = () => {
    setTeams([]);
    setTimeout(() => handleGenerateTeams(), 100);
  };

  return (
    <div className="squad-scramble-page">
      <AnimatePresence>
        {showToast && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="page-header">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {isEventMode && currentEvent ? currentEvent.name : 'Squad Scramble'}
        </motion.h1>
        <motion.p
          className="subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Generate random, balanced teams
        </motion.p>
      </header>

      <div className="main-content">
        {/* Left Section: Participants */}
        <div className="left-section">
          <motion.div
            className="input-section"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <form onSubmit={handleAddParticipant} className="add-participant-form">
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="Enter participant name..."
                className="participant-input"
                maxLength={50}
              />
              <button type="submit" className="add-button">
                Add
              </button>
            </form>
          </motion.div>

          <ParticipantList
            names={participants.map(p => p.name)}
            onRemove={handleRemoveParticipant}
            winners={[]} // No winner tracking in Squad Scramble
          />
        </div>

        {/* Center Section: Configuration & Generation */}
        <div className="center-section">
          <TeamConfiguration
            mode={mode}
            setMode={setMode}
            teamCount={teamCount}
            setTeamCount={setTeamCount}
            teamSize={teamSize}
            setTeamSize={setTeamSize}
            participantCount={participants.length}
          />

          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.div>
          )}

          <motion.button
            className="generate-button"
            onClick={handleGenerateTeams}
            disabled={isGenerating || participants.length < 2}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isGenerating ? 'GENERATING...' : 'GENERATE TEAMS'}
          </motion.button>

          {teams.length > 0 && (
            <motion.button
              className="regenerate-button"
              onClick={handleRegenerateTeams}
              disabled={isGenerating}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔄 Shuffle Again
            </motion.button>
          )}
        </div>

        {/* Right Section: QR Code */}
        <div className="right-section">
          <QRCodePanel eventId={isEventMode ? currentEventId : null} />
        </div>
      </div>

      {/* Team Display */}
      {teams.length > 0 && (
        <TeamDisplay
          teams={teams}
          setTeams={setTeams}
          isEventMode={isEventMode}
          generationId={generationId}
        />
      )}
    </div>
  );
};

export default SquadScramblePage;

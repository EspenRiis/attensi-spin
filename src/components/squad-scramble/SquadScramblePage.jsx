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
  loadCurrentTeamGeneration,
  hasTeamGenerationData,
  clearAllTeamGenerations
} from '../../utils/teamStorage';
import {
  addName,
  loadNames,
  removeName,
  addNameToEvent,
  removeNameFromEvent,
  loadParticipantsFromEvent,
  loadParticipantsWithIds,
  loadParticipantsWithIdsFromEvent,
  archiveAllParticipants
} from '../../utils/storage';
import { hasSession, createNewSession, getCurrentSessionId } from '../../utils/session';
import TeamConfiguration from './TeamConfiguration';
import TeamDisplay from './TeamDisplay';
import ParticipantList from '../ParticipantList';
import QRCodePanel from '../QRCodePanel';
import SessionRestoreModal from '../shared/SessionRestoreModal';
import EventDataModal from '../shared/EventDataModal';
import ParticipantImportModal from '../shared/ParticipantImportModal';
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
  const [autoAssignCaptains, setAutoAssignCaptains] = useState(true);

  // Generated teams
  const [teams, setTeams] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationId, setGenerationId] = useState(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false); // Flag to skip animations

  // Event mode state
  const [isEventMode, setIsEventMode] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [user, setUser] = useState(null);

  // UI state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState('');

  // Modal state
  const [showSessionRestoreModal, setShowSessionRestoreModal] = useState(false);
  const [showEventDataModal, setShowEventDataModal] = useState(false);
  const [showParticipantImportModal, setShowParticipantImportModal] = useState(false);
  const [existingTeamsCount, setExistingTeamsCount] = useState(0);
  const [wheelParticipantCount, setWheelParticipantCount] = useState(0);

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
        await loadEventData(eventId, true); // isInitialLoad = true
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
    if (hasSession('scramble')) {
      // Check if there's existing team generation data
      const hasData = await hasTeamGenerationData(null, getCurrentSessionId('scramble'));

      if (hasData) {
        // Show modal to continue or start fresh - DON'T load data yet
        setShowSessionRestoreModal(true);
      } else {
        // Has session but no team data, check for imports BEFORE loading
        await checkForWheelParticipants();
      }
    } else {
      // No session, create a new one for Squad Scramble
      createNewSession('scramble');
      // Check for imports before loading participants
      await checkForWheelParticipants();
    }
  };

  const checkForWheelParticipants = async () => {
    // Check if Squad Scramble is empty AND Name Roulette has participants
    if (participants.length === 0) {
      // Load from Name Roulette's session
      const rouletteSessionId = getCurrentSessionId('roulette');
      if (rouletteSessionId) {
        const wheelParticipants = await loadParticipantsWithIds(rouletteSessionId);
        if (wheelParticipants.length > 0) {
          setWheelParticipantCount(wheelParticipants.length);
          setShowParticipantImportModal(true);
        }
      }
    }
  };

  const loadSessionData = async (loadTeams = true) => {
    // Load participants with real database IDs from Squad Scramble's session
    const scrambleSessionId = getCurrentSessionId('scramble');
    const participantsFromDB = await loadParticipantsWithIds(scrambleSessionId);
    setParticipants(participantsFromDB);

    // Try to load existing team generation
    if (loadTeams) {
      setIsLoadingExisting(true); // Flag to skip animations
      const { teams: loadedTeams, generation } = await loadCurrentTeamGeneration(null, null);
      if (loadedTeams && loadedTeams.length > 0) {
        setTeams(loadedTeams);
        setGenerationId(generation?.id || null);
      }
      // Reset flag after a brief delay to allow teams to render
      setTimeout(() => setIsLoadingExisting(false), 100);
    }
  };

const loadEventData = async (evtId, isInitialLoad = false) => {
    try {
      // Fetch event details if initial load
      if (isInitialLoad) {
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', evtId)
          .single();

        if (!eventError && eventData) {
          setCurrentEvent(eventData);
        }
      }

      // Load participants with real database IDs
      const participantsFromDB = await loadParticipantsWithIdsFromEvent(evtId);
      setParticipants(participantsFromDB);

      // Load existing team generation
      const { teams: loadedTeams, generation } = await loadCurrentTeamGeneration(evtId, null);

      // On initial load, check if there are existing teams
      if (isInitialLoad && loadedTeams && loadedTeams.length > 0) {
        // Show modal to ask user what to do with existing teams
        setExistingTeamsCount(loadedTeams.length);
        setShowEventDataModal(true);
        // Don't set teams yet - wait for user choice
        return;
      }

      // Not initial load or no existing teams - load normally
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

  // Participant Import Modal Handlers
  const handleImportParticipants = async () => {
    setShowParticipantImportModal(false);
    // Load participants from Name Roulette's session and copy to Squad Scramble's session
    const rouletteSessionId = getCurrentSessionId('roulette');
    const wheelParticipants = await loadParticipantsWithIds(rouletteSessionId);

    // Copy each participant to Squad Scramble's session
    const scrambleSessionId = getCurrentSessionId('scramble');
    for (const participant of wheelParticipants) {
      await addName(participant.name, scrambleSessionId);
    }

    // Reload participants from Squad Scramble's session
    const scrambleParticipants = await loadParticipantsWithIds(scrambleSessionId);
    setParticipants(scrambleParticipants);
    showToastMessage(`Imported ${scrambleParticipants.length} participants from Name Roulette!`);
  };

  const handleStartEmpty = async () => {
    setShowParticipantImportModal(false);
    // Don't load any participants, start with empty list
    setParticipants([]);
    showToastMessage('Ready to add participants manually!');
  };

  const handleClearAllParticipants = async () => {
    if (window.confirm(`Clear all ${participants.length} participants?`)) {
      const { clearNames } = await import('../../utils/storage');
      const scrambleSessionId = getCurrentSessionId('scramble');
      await clearNames(scrambleSessionId);
      setParticipants([]);
      setTeams([]); // Also clear any generated teams
      showToastMessage('All participants cleared!');
    }
  };

  // Session Modal Handlers
  const handleSessionContinue = async () => {
    setShowSessionRestoreModal(false);
    setIsLoadingExisting(true); // Skip animations when loading existing
    await loadSessionData(true); // Load with teams
    setTimeout(() => setIsLoadingExisting(false), 100);
    showToastMessage('Previous teams loaded!');
  };

  const handleSessionStartFresh = async () => {
    // Clear all team generations
    await clearAllTeamGenerations(null, null);

    // Reset state
    setTeams([]);
    setGenerationId(null);
    setShowSessionRestoreModal(false);

    // Load participants only
    await loadSessionData(false);
    showToastMessage('Starting fresh! Old teams cleared.');
  };

  // Event Modal Handlers
  const handleKeepTeams = async () => {
    setIsLoadingExisting(true); // Skip animations when loading existing
    const { teams: loadedTeams, generation } = await loadCurrentTeamGeneration(currentEventId, null);
    setTeams(loadedTeams);
    setGenerationId(generation?.id || null);
    setShowEventDataModal(false);
    setTimeout(() => setIsLoadingExisting(false), 100);
    showToastMessage(`Loaded ${loadedTeams.length} existing teams!`);
  };

  const handleClearAndRegenerate = async () => {
    // Clear existing team generations
    await clearAllTeamGenerations(currentEventId, null);

    // Reset teams state
    setTeams([]);
    setGenerationId(null);
    setShowEventDataModal(false);
    showToastMessage('Ready to generate new teams!');
  };

  const handleStartEmptyEvent = async () => {
    // Clear all team generations
    await clearAllTeamGenerations(currentEventId, null);

    // Archive all participants (soft delete)
    await archiveAllParticipants(currentEventId);

    // Reset state
    setParticipants([]);
    setTeams([]);
    setGenerationId(null);
    setShowEventDataModal(false);
    showToastMessage('All data cleared! Starting empty.');
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();

    if (inputName.trim() && !participants.find(p => p.name === inputName.trim())) {
      const result = isEventMode
        ? await addNameToEvent(currentEventId, inputName.trim())
        : await addName(inputName.trim());

      if (result.success) {
        // Reload participants to get real database IDs
        if (isEventMode) {
          const participantsFromDB = await loadParticipantsWithIdsFromEvent(currentEventId);
          setParticipants(participantsFromDB);
        } else {
          const participantsFromDB = await loadParticipantsWithIds();
          setParticipants(participantsFromDB);
        }
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

      // Optionally assign random captains
      const teamsToSave = autoAssignCaptains ? assignRandomCaptains(result.teams) : result.teams;

      // Save to database
      const saveResult = await saveTeamGeneration({
        eventId: isEventMode ? currentEventId : null,
        sessionId: isEventMode ? null : getCurrentSessionId(),
        mode: result.mode,
        teamCount: result.mode === 'team_count' ? result.teamCount : null,
        teamSize: result.mode === 'team_size' ? result.teamSize : null,
        teams: teamsToSave
      });

      if (saveResult.success) {
        setGenerationId(saveResult.generationId);
        setTeams(teamsToSave);
        // Toast will be shown after animations complete (handled by TeamDisplay)
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
    // Reset teams and regenerate
    setTeams([]);
    setTimeout(() => handleGenerateTeams(), 100);
  };

  return (
    <div className="squad-scramble-page">
      {/* Session Restore Modal */}
      <AnimatePresence>
        {showSessionRestoreModal && (
          <SessionRestoreModal
            title="Welcome Back!"
            description="Would you like to continue from an earlier session?"
            icon="🎲"
            continueLabel="Continue"
            continueSubtitle="Load saved data"
            freshLabel="Start Fresh"
            freshSubtitle="Clear all data"
            onContinue={handleSessionContinue}
            onStartFresh={handleSessionStartFresh}
          />
        )}
      </AnimatePresence>

      {/* Event Data Modal */}
      <AnimatePresence>
        {showEventDataModal && (
          <EventDataModal
            title="This Event Has Teams!"
            dataCount={existingTeamsCount}
            dataLabel="teams"
            icon="🏆"
            options={[
              {
                label: 'Keep Existing Teams',
                subtitle: 'Continue with current team setup',
                primary: true,
                value: 'keep'
              },
              {
                label: 'Regenerate Teams',
                subtitle: 'Clear teams, keep participants',
                primary: false,
                value: 'regenerate'
              },
              {
                label: 'Start Empty',
                subtitle: 'Clear everything (teams & participants)',
                primary: false,
                value: 'empty',
                style: { opacity: 0.8 }
              }
            ]}
            onOptionSelect={(value) => {
              if (value === 'keep') handleKeepTeams();
              else if (value === 'regenerate') handleClearAndRegenerate();
              else if (value === 'empty') handleStartEmptyEvent();
            }}
          />
        )}
      </AnimatePresence>

      {/* Participant Import Modal */}
      <AnimatePresence>
        {showParticipantImportModal && (
          <ParticipantImportModal
            title="Welcome Back!"
            participantCount={wheelParticipantCount}
            sourceTool="Name Roulette"
            icon="🔄"
            onImport={handleImportParticipants}
            onStartEmpty={handleStartEmpty}
          />
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
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
            onClearAll={handleClearAllParticipants}
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
            autoAssignCaptains={autoAssignCaptains}
            setAutoAssignCaptains={setAutoAssignCaptains}
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
            className={teams.length > 0 ? "regenerate-button" : "generate-button"}
            onClick={teams.length > 0 ? handleRegenerateTeams : handleGenerateTeams}
            disabled={isGenerating || participants.length < 2}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isGenerating ? 'GENERATING...' : teams.length > 0 ? '🔄 REGENERATE TEAMS' : 'GENERATE TEAMS'}
          </motion.button>
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
          autoAssignCaptains={autoAssignCaptains}
          skipAnimations={isLoadingExisting}
          onAnimationComplete={(teamCount) => {
            if (!isLoadingExisting) {
              const captainMsg = autoAssignCaptains ? ' with captains' : '';
              showToastMessage(`Generated ${teamCount} teams${captainMsg}!`);
            }
          }}
        />
      )}
    </div>
  );
};

export default SquadScramblePage;

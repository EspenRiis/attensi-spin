import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import Wheel from './Wheel';
import ParticipantList from './ParticipantList';
import WinnerList from './WinnerList';
import QRCodePanel from './QRCodePanel';
import SessionRestoreModal from './shared/SessionRestoreModal';
import EventDataModal from './shared/EventDataModal';
import ParticipantImportModal from './shared/ParticipantImportModal';
import WinnerModal from './WinnerModal';
import {
  addName,
  loadNames,
  clearNames,
  removeName,
  saveWinners,
  loadWinners,
  hasStoredData,
  loadParticipantsFromEvent,
  loadParticipantsWithIds,
  markParticipantAsWinner,
  addNameToEvent,
  removeNameFromEvent,
  clearAllWinners,
  restoreWinner,
  archiveAllParticipants
} from '../utils/storage';
import { hasSession, createNewSession, getCurrentSessionId, clearSession } from '../utils/session';
import { checkRateLimit, RATE_LIMITS } from '../utils/rateLimiter';
import { supabase } from '../lib/supabase';
import './WheelPage.css';

const WheelPage = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');

  const [names, setNames] = useState([]);
  const [inputName, setInputName] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showEventWinnersModal, setShowEventWinnersModal] = useState(false);
  const [showParticipantImportModal, setShowParticipantImportModal] = useState(false);
  const [existingWinnersCount, setExistingWinnersCount] = useState(0);
  const [squadParticipantCount, setSquadParticipantCount] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winners, setWinners] = useState([]); // People who won from spinning
  const [removedWinners, setRemovedWinners] = useState([]); // Winners removed from wheel (separate section)
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [clearWinner, setClearWinner] = useState(false);

  // Event mode state
  const [isEventMode, setIsEventMode] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [user, setUser] = useState(null);

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
    if (hasSession('roulette')) {
      // Check if there's data in this session
      const hasData = await hasStoredData(getCurrentSessionId('roulette'));

      if (hasData) {
        // Show modal to continue or start fresh - DON'T load data yet
        setShowWelcomeModal(true);
      } else {
        // Has session but no data, load it and check for imports
        await loadInitialData();
        await checkForSquadParticipants();
      }
    } else {
      // No session, create a new one for Name Roulette
      createNewSession('roulette');
      await loadInitialData();
      // Check for Squad Scramble imports after creating new session
      await checkForSquadParticipants();
    }
  };

  const checkForSquadParticipants = async () => {
    // Check if Name Roulette is empty AND Squad Scramble has participants
    if (names.length === 0) {
      const scrambleSessionId = getCurrentSessionId('scramble');
      if (scrambleSessionId) {
        const squadParticipants = await loadParticipantsWithIds(scrambleSessionId);
        if (squadParticipants.length > 0) {
          setSquadParticipantCount(squadParticipants.length);
          setShowParticipantImportModal(true);
        }
      }
    }
  };

  const loadEventData = async (evtId, isInitialLoad = false) => {
    // Fetch event details if initial load
    if (isInitialLoad) {
      try {
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', evtId)
          .single();

        if (!eventError && eventData) {
          setCurrentEvent(eventData);
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
      }
    }

    const { names: loadedNames, winners: dbWinners } = await loadParticipantsFromEvent(evtId);

    // On initial load, check if there are existing winners
    if (isInitialLoad && dbWinners.length > 0) {
      // Show modal to ask user what to do with existing winners
      setExistingWinnersCount(dbWinners.length);
      setShowEventWinnersModal(true);
      // Don't set names/winners yet - wait for user choice
      return;
    }

    // Always update names (participants list - non-winners only)
    setNames(loadedNames);

    // Update removedWinners list with current database winners (for real-time updates)
    if (!isInitialLoad) {
      setRemovedWinners(dbWinners);
    } else {
      setRemovedWinners([]);
    }
  };

  // Separate effect for real-time subscription (handles both session and event modes)
  useEffect(() => {
    if (isEventMode && currentEventId) {
      // Event mode: Subscribe to event_id changes
      console.log('🔔 Setting up event mode subscription for event:', currentEventId);
      const channel = supabase
        .channel('event-participants-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'participants',
            filter: `event_id=eq.${currentEventId}`
          },
          async (payload) => {
            console.log('✅ Real-time update (event mode):', payload);
            await loadEventData(currentEventId);
          }
        )
        .subscribe((status) => {
          console.log('📡 Event subscription status:', status);
        });

      return () => {
        console.log('🔌 Cleaning up event subscription');
        supabase.removeChannel(channel);
      };
    } else {
      // Session mode: Subscribe to session_id changes (Name Roulette)
      const sessionId = getCurrentSessionId('roulette');
      if (!sessionId) {
        console.warn('⚠️ No session ID found for subscription');
        return;
      }

      console.log('🔔 Setting up session mode subscription for session:', sessionId);
      const channel = supabase
        .channel('session-participants-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'participants',
            filter: `session_id=eq.${sessionId}`
          },
          async (payload) => {
            console.log('✅ Real-time update (session mode):', payload);
            const updatedNames = await loadNames(sessionId);
            setNames(updatedNames);
          }
        )
        .subscribe((status) => {
          console.log('📡 Session subscription status:', status);
        });

      return () => {
        console.log('🔌 Cleaning up session subscription');
        supabase.removeChannel(channel);
      };
    }
  }, [isEventMode, currentEventId]);

  const loadInitialData = async () => {
    const rouletteSessionId = getCurrentSessionId('roulette');
    const namesFromDB = await loadNames(rouletteSessionId);
    setNames(namesFromDB);

    const savedWinners = loadWinners();
    setWinners(savedWinners);
  };

  // Participant Import Modal Handlers
  const handleImportFromSquad = async () => {
    setShowParticipantImportModal(false);
    // Load from Squad Scramble's session and copy to Name Roulette's session
    const scrambleSessionId = getCurrentSessionId('scramble');
    const squadParticipants = await loadParticipantsWithIds(scrambleSessionId);

    // Copy each participant to Name Roulette's session
    const rouletteSessionId = getCurrentSessionId('roulette');
    for (const participant of squadParticipants) {
      await addName(participant.name, rouletteSessionId);
    }

    // Reload from Name Roulette's session
    const namesFromDB = await loadNames(rouletteSessionId);
    setNames(namesFromDB);
    showToastMessage(`Imported ${squadParticipants.length} participants from Squad Scramble!`);
  };

  const handleStartWithoutImport = () => {
    setShowParticipantImportModal(false);
    // Participants are already loaded from the same session, just close modal
    showToastMessage(`Imported ${squadParticipantCount} participants from Squad Scramble!`);
  };

  const handleStartEmptyWheel = async () => {
    setShowParticipantImportModal(false);
    // Clear any existing participants
    await clearNames(getCurrentSessionId('roulette'));
    setNames([]);
    showToastMessage('Ready to add participants manually!');
  };

  const handleClearAllParticipants = async () => {
    if (window.confirm(`Clear all ${names.length} participants?`)) {
      await clearNames(getCurrentSessionId('roulette'));
      setNames([]);
      setWinners([]);
      setRemovedWinners([]);
      showToastMessage('All participants cleared!');
    }
  };

  const handleContinue = async () => {
    setShowWelcomeModal(false);
    await loadInitialData();
  };

  const handleStartFresh = async () => {
    // Clear the old session data for Name Roulette
    const rouletteSessionId = getCurrentSessionId('roulette');
    await clearNames(rouletteSessionId);
    clearSession('roulette');

    // Create new session for Name Roulette
    createNewSession('roulette');

    // Reset state
    setNames([]);
    setWinners([]);
    setShowWelcomeModal(false);

    // Load new session
    await loadInitialData();

    // Check for Squad Scramble imports after starting fresh
    await checkForSquadParticipants();
  };

  // Event Winners Modal handlers
  const handleKeepWinners = async () => {
    // Load data with existing winners in the Winners section
    const { names: loadedNames, winners: dbWinners } = await loadParticipantsFromEvent(currentEventId);
    setNames(loadedNames); // Non-winners only
    setRemovedWinners(dbWinners); // Winners go to separate section
    setShowEventWinnersModal(false);
    showToastMessage(`Loaded ${dbWinners.length} existing winners!`);
  };

  const handleStartFreshWithParticipants = async () => {
    // Clear winner status in database
    await clearAllWinners(currentEventId);
    // Reload all participants (now all available to spin)
    const { names: loadedNames } = await loadParticipantsFromEvent(currentEventId);
    setNames(loadedNames);
    setRemovedWinners([]);
    setWinners([]);
    setShowEventWinnersModal(false);
    showToastMessage('Winner status cleared! All participants available.');
  };

  const handleStartEmpty = async () => {
    // Archive all participants (soft delete - preserves history)
    await archiveAllParticipants(currentEventId);

    setNames([]);
    setRemovedWinners([]);
    setWinners([]);
    setShowEventWinnersModal(false);
    showToastMessage('All participants archived! Starting fresh.');
  };

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddName = async (e) => {
    e.preventDefault();

    // Rate limiting check
    const rateLimitCheck = checkRateLimit(
      'add_participant',
      RATE_LIMITS.ADD_PARTICIPANT.maxAttempts,
      RATE_LIMITS.ADD_PARTICIPANT.windowMs
    );

    if (!rateLimitCheck.allowed) {
      showToastMessage(rateLimitCheck.message);
      return;
    }

    if (inputName.trim() && !names.includes(inputName.trim())) {
      const result = isEventMode
        ? await addNameToEvent(currentEventId, inputName.trim())
        : await addName(inputName.trim(), getCurrentSessionId('roulette'));

      if (result.success) {
        // Optimistically update local state immediately
        setNames(prevNames => [...prevNames, inputName.trim()]);
        setInputName('');
        showToastMessage(`${inputName.trim()} added!`);
      } else {
        showToastMessage('Error adding name!');
      }
    } else if (names.includes(inputName.trim())) {
      showToastMessage('Name already exists!');
    }
  };

  const handleRemoveName = async (nameToRemove) => {
    const result = isEventMode
      ? await removeNameFromEvent(currentEventId, nameToRemove)
      : await removeName(nameToRemove, getCurrentSessionId('roulette'));

    if (result.success) {
      // Immediately update local state - remove from participants list
      setNames(prevNames => prevNames.filter(name => name !== nameToRemove));

      // DON'T remove from winners array - keep them for "Remove All Winners" button
      // Winners will be moved to removedWinners when that button is clicked

      // Save current winners to localStorage in session mode
      if (!isEventMode) {
        saveWinners(winners);
      }

      showToastMessage(`${nameToRemove} removed!`);
    } else {
      showToastMessage('Error removing name!');
    }
  };

  const handleSpin = () => {
    // Rate limiting check
    const rateLimitCheck = checkRateLimit(
      'spin_wheel',
      RATE_LIMITS.SPIN_WHEEL.maxAttempts,
      RATE_LIMITS.SPIN_WHEEL.windowMs
    );

    if (!rateLimitCheck.allowed) {
      showToastMessage(rateLimitCheck.message);
      return;
    }

    if (names.length < 2) {
      showToastMessage('Add at least 2 participants to spin!');
      return;
    }
    setIsSpinning(true);
  };

  // CRITICAL FIX: Wrap in useCallback to prevent infinite loop
  // This ensures the function reference stays stable across renders
  const handleSpinComplete = useCallback(async (winnerName) => {
    setWinner(winnerName);
    setIsSpinning(false);

    // Increment global spin counter
    try {
      await supabase.rpc('increment_spin_counter');
    } catch (error) {
      console.error('Failed to increment spin counter:', error);
      // Non-critical error, don't block the flow
    }

    // Add to winners list (for tracking and showing badge)
    setWinners(prevWinners => {
      if (!prevWinners.includes(winnerName)) {
        const newWinners = [...prevWinners, winnerName];

        // Save to localStorage in session mode
        if (!isEventMode) {
          saveWinners(newWinners);
        }

        return newWinners;
      }
      return prevWinners;
    });

    // NOTE: Don't mark as winner in database yet
    // Winner stays on wheel until "Remove Winner" button is clicked
  }, [isEventMode, currentEventId]);

  const handleSpinAgain = () => {
    setWinner(null);
  };

  const handleRemoveWinner = async () => {
    if (winner) {
      // Mark as winner in database for event mode (dashboard visibility)
      if (isEventMode && currentEventId) {
        await markParticipantAsWinner(currentEventId, winner);
      } else {
        // Session mode: remove from database
        await removeName(winner, getCurrentSessionId('roulette'));
      }

      // Move winner to removedWinners list (shown in Winners section)
      setRemovedWinners(prev => [...prev, winner]);

      // Remove from participants list
      setNames(prevNames => prevNames.filter(name => name !== winner));

      // Remove from winners tracking array
      setWinners(prevWinners => prevWinners.filter(name => name !== winner));

      // Save updated winners in session mode
      if (!isEventMode) {
        saveWinners(winners.filter(name => name !== winner));
      }

      setWinner(null);
      showToastMessage(`${winner} removed from wheel!`);
    }
  };

  const handleCloseWinnerModal = () => {
    setWinner(null);
  };

  const handleClearWinners = () => {
    setWinners([]);
    if (!isEventMode) {
      saveWinners([]);
    }
    setClearWinner(true);
    setTimeout(() => setClearWinner(false), 0);
    showToastMessage('Winner history cleared!');
  };

  const handleRemoveAllWinners = async () => {
    // In event mode, winners are already marked in DB when they won
    // In session mode, we need to remove them from the database
    if (!isEventMode) {
      const rouletteSessionId = getCurrentSessionId('roulette');
      for (const winner of winners) {
        await removeName(winner, rouletteSessionId);
      }
    }

    // Move winners to removedWinners list (shown in separate Winners section)
    setRemovedWinners(prev => [...prev, ...winners]);

    // Update state - remove winners from names list
    const newNames = names.filter(name => !winners.includes(name));
    setNames(newNames);
    setWinners([]);

    if (!isEventMode) {
      saveWinners([]);
    }

    showToastMessage('All winners removed from wheel!');
  };

  const handleRestoreWinner = async (name) => {
    if (isEventMode) {
      // Restore in database (removes is_winner flag)
      await restoreWinner(currentEventId, name);
      // Real-time subscription will handle adding back to names list
    } else {
      // Session mode: re-add participant to database
      const result = await addName(name, getCurrentSessionId('roulette'));
      if (result.success) {
        // Optimistically update local state
        setNames(prevNames => [...prevNames, name]);
      } else {
        showToastMessage('Error restoring participant!');
        return;
      }
    }

    // Remove from removedWinners list
    setRemovedWinners(prev => prev.filter(n => n !== name));

    showToastMessage(`${name} restored to wheel!`);
  };

  const handleRestoreAllWinners = async () => {
    if (isEventMode) {
      // Restore all winners in database
      for (const winner of removedWinners) {
        await restoreWinner(currentEventId, winner);
      }
      // Real-time subscription will handle adding back to names list
    } else {
      // Session mode: re-add all participants to database
      const restoredNames = [];
      const rouletteSessionId = getCurrentSessionId('roulette');
      for (const winner of removedWinners) {
        const result = await addName(winner, rouletteSessionId);
        if (result.success) {
          restoredNames.push(winner);
        }
      }
      // Optimistically update local state with successfully restored names
      if (restoredNames.length > 0) {
        setNames(prevNames => [...prevNames, ...restoredNames]);
      }
    }

    // Clear the removedWinners list
    setRemovedWinners([]);

    showToastMessage('All winners restored to wheel!');
  };

  return (
    <div className="wheel-page">
      <AnimatePresence>
        {showWelcomeModal && (
          <SessionRestoreModal
            title="Welcome Back!"
            description="Would you like to continue from an earlier session?"
            icon="🎯"
            continueLabel="Continue"
            continueSubtitle="Load saved data"
            freshLabel="Start Fresh"
            freshSubtitle="Clear all data"
            onContinue={handleContinue}
            onStartFresh={handleStartFresh}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEventWinnersModal && (
          <EventDataModal
            title="This Event Has Winners!"
            dataCount={existingWinnersCount}
            dataLabel="winners"
            icon="🏆"
            options={[
              {
                label: 'Keep Existing Winners',
                subtitle: 'Winners removed from wheel, participants stay',
                primary: true,
                value: 'keep'
              },
              {
                label: 'Start Fresh',
                subtitle: 'Reset winners, keep all participants',
                primary: false,
                value: 'fresh'
              },
              {
                label: 'Start Empty',
                subtitle: 'Clear everything (winners & participants)',
                primary: false,
                value: 'empty',
                style: { opacity: 0.8 }
              }
            ]}
            onOptionSelect={(value) => {
              if (value === 'keep') handleKeepWinners();
              else if (value === 'fresh') handleStartFreshWithParticipants();
              else if (value === 'empty') handleStartEmpty();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showParticipantImportModal && (
          <ParticipantImportModal
            title="Welcome Back!"
            participantCount={squadParticipantCount}
            sourceTool="Squad Scramble"
            icon="🔄"
            onImport={handleImportFromSquad}
            onStartEmpty={handleStartEmptyWheel}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {winner && (
          <WinnerModal
            winner={winner}
            onSpinAgain={handleSpinAgain}
            onRemoveWinner={handleRemoveWinner}
            onClose={handleCloseWinnerModal}
          />
        )}
      </AnimatePresence>

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
          {isEventMode && currentEvent ? currentEvent.name : 'Name Roulette'}
        </motion.h1>
      </header>

      <div className="main-content">
        <div className="left-section">
          <motion.div
            className="input-section"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <form onSubmit={handleAddName} className="add-name-form">
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="Enter a name..."
                className="name-input"
                maxLength={50}
              />
              <button type="submit" className="add-button">
                Add
              </button>
            </form>
          </motion.div>

          <ParticipantList
            names={names}
            onRemove={handleRemoveName}
            onClearAll={handleClearAllParticipants}
            winners={winners}
          />

          {removedWinners.length > 0 && (
            <WinnerList
              winners={removedWinners}
              onRestore={handleRestoreWinner}
              onRestoreAll={handleRestoreAllWinners}
            />
          )}

          {winners.length > 0 && (
            <motion.div
              className="winner-controls"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <button onClick={handleClearWinners} className="btn-clear-history">
                Clear Winner History
              </button>
              <button onClick={handleRemoveAllWinners} className="btn-remove-winners">
                Remove All Winners from Wheel
              </button>
            </motion.div>
          )}
        </div>

        <div className="center-section">
          <Wheel
            names={names}
            onSpinComplete={handleSpinComplete}
            isSpinning={isSpinning}
            clearWinner={clearWinner}
          />
          
          <motion.button
            className="spin-button"
            onClick={handleSpin}
            disabled={isSpinning || names.length < 2}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSpinning ? 'SPINNING...' : 'SPIN'}
          </motion.button>
        </div>

        <div className="right-section">
          <QRCodePanel eventId={isEventMode ? currentEventId : null} />
        </div>
      </div>
    </div>
  );
};

export default WheelPage;
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import Wheel from './Wheel';
import ParticipantList from './ParticipantList';
import WinnerList from './WinnerList';
import QRCodePanel from './QRCodePanel';
import WelcomeModal from './WelcomeModal';
import EventWinnersModal from './EventWinnersModal';
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
  markParticipantAsWinner,
  addNameToEvent,
  removeNameFromEvent,
  clearAllWinners,
  restoreWinner,
  archiveAllParticipants
} from '../utils/storage';
import { hasSession, createNewSession, getCurrentSessionId, clearSession } from '../utils/session';
import { supabase } from '../lib/supabase';
import './WheelPage.css';

const WheelPage = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');

  const [names, setNames] = useState([]);
  const [inputName, setInputName] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showEventWinnersModal, setShowEventWinnersModal] = useState(false);
  const [existingWinnersCount, setExistingWinnersCount] = useState(0);
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
    if (hasSession()) {
      // Check if there's data in this session
      const hasData = await hasStoredData();

      if (hasData) {
        // Show modal to continue or start fresh - DON'T load data yet
        setShowWelcomeModal(true);
      } else {
        // Has session but no data, just load it
        await loadInitialData();
      }
    } else {
      // No session, create a new one
      createNewSession();
      await loadInitialData();
    }
  };

  const loadEventData = async (evtId, isInitialLoad = false) => {
    const { names: loadedNames, winners: dbWinners } = await loadParticipantsFromEvent(evtId);

    // On initial load, check if there are existing winners
    if (isInitialLoad && dbWinners.length > 0) {
      // Show modal to ask user what to do with existing winners
      setExistingWinnersCount(dbWinners.length);
      setShowEventWinnersModal(true);
      // Don't set names/winners yet - wait for user choice
      return;
    }

    // Always update names (participants list)
    setNames(loadedNames);

    // On initial load with no winners, just load normally
    if (isInitialLoad) {
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
      // Session mode: Subscribe to session_id changes
      const sessionId = getCurrentSessionId();
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
            const updatedNames = await loadNames();
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
    const namesFromDB = await loadNames();
    setNames(namesFromDB);

    const savedWinners = loadWinners();
    setWinners(savedWinners);
  };

  const handleContinue = async () => {
    setShowWelcomeModal(false);
    await loadInitialData();
  };

  const handleStartFresh = async () => {
    // Clear the old session data
    await clearNames();
    clearSession();

    // Create new session
    createNewSession();

    // Reset state
    setNames([]);
    setWinners([]);
    setShowWelcomeModal(false);

    // Load new session
    await loadInitialData();
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
    if (inputName.trim() && !names.includes(inputName.trim())) {
      const result = isEventMode
        ? await addNameToEvent(currentEventId, inputName.trim())
        : await addName(inputName.trim());

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
      : await removeName(nameToRemove);

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

    // Add to winners list
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

    // Mark as winner in database immediately (for dashboard visibility)
    // But keep them in participants list until "Remove All Winners" is clicked
    if (isEventMode && currentEventId) {
      await markParticipantAsWinner(currentEventId, winnerName);
    }
  }, [isEventMode, currentEventId]);

  const handleSpinAgain = () => {
    setWinner(null);
  };

  const handleRemoveWinner = () => {
    if (winner) {
      handleRemoveName(winner);
      setWinner(null);
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
      for (const winner of winners) {
        await removeName(winner);
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
    }

    // Clear the removedWinners list
    setRemovedWinners([]);

    showToastMessage('All winners restored to wheel!');
  };

  return (
    <div className="wheel-page">
      <AnimatePresence>
        {showWelcomeModal && (
          <WelcomeModal
            onContinue={handleContinue}
            onStartFresh={handleStartFresh}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEventWinnersModal && (
          <EventWinnersModal
            winnersCount={existingWinnersCount}
            onKeepWinners={handleKeepWinners}
            onStartFresh={handleStartFreshWithParticipants}
            onStartEmpty={handleStartEmpty}
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
          Name Roulette
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
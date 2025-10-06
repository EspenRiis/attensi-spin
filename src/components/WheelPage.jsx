import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import Wheel from './Wheel';
import ParticipantList from './ParticipantList';
import QRCodePanel from './QRCodePanel';
import WelcomeModal from './WelcomeModal';
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
  removeNameFromEvent
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
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winners, setWinners] = useState([]);
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

  const loadEventData = async (evtId) => {
    const { names: loadedNames, winners: loadedWinners } = await loadParticipantsFromEvent(evtId);
    setNames(loadedNames);
    setWinners(loadedWinners);
  };

  // Separate effect for real-time subscription (handles both session and event modes)
  useEffect(() => {
    if (isEventMode && currentEventId) {
      // Event mode: Subscribe to event_id changes
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
            console.log('Real-time update (event mode):', payload);
            await loadEventData(currentEventId);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // Session mode: Subscribe to session_id changes
      const sessionId = getCurrentSessionId();
      if (!sessionId) return;

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
            console.log('Real-time update (session mode):', payload);
            const updatedNames = await loadNames();
            setNames(updatedNames);
          }
        )
        .subscribe();

      return () => {
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
      // Immediately update local state
      setNames(prevNames => prevNames.filter(name => name !== nameToRemove));

      // Also remove from winners if present
      const newWinners = winners.filter(name => name !== nameToRemove);
      setWinners(newWinners);

      // Only save to localStorage in session mode
      if (!isEventMode) {
        saveWinners(newWinners);
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
  const handleSpinComplete = useCallback((winnerName) => {
    setWinner(winnerName);
    setIsSpinning(false);

    // Add to winners list
    setWinners(prevWinners => {
      if (!prevWinners.includes(winnerName)) {
        const newWinners = [...prevWinners, winnerName];

        // Save winner based on mode
        if (isEventMode && currentEventId) {
          // Event mode: Save to database
          markParticipantAsWinner(currentEventId, winnerName);
        } else {
          // Session mode: Save to localStorage
          saveWinners(newWinners);
        }

        return newWinners;
      }
      return prevWinners;
    });
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
    // Remove each winner individually (works for both modes)
    for (const winner of winners) {
      if (isEventMode) {
        await removeNameFromEvent(currentEventId, winner);
      } else {
        await removeName(winner);
      }
    }

    // Update state
    const newNames = names.filter(name => !winners.includes(name));
    setNames(newNames);
    setWinners([]);

    if (!isEventMode) {
      saveWinners([]);
    }

    showToastMessage('All winners removed from wheel!');
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
          Attensi Spin
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
          <QRCodePanel />
        </div>
      </div>

      <footer className="page-footer">
        <p>Powered by Attensi</p>
      </footer>
    </div>
  );
};

export default WheelPage;
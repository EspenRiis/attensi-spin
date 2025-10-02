import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Wheel from './Wheel';
import ParticipantList from './ParticipantList';
import QRCodePanel from './QRCodePanel';
import WelcomeModal from './WelcomeModal';
import WinnerModal from './WinnerModal';
import { addName, loadNames, clearNames, removeName, saveWinners, loadWinners, hasStoredData } from '../utils/storage';
import { hasSession, createNewSession, getCurrentSessionId, clearSession } from '../utils/session';
import { supabase } from '../lib/supabase';
import './WheelPage.css';

const WheelPage = () => {
  const [names, setNames] = useState([]);
  const [inputName, setInputName] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winners, setWinners] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [clearWinner, setClearWinner] = useState(false);

  useEffect(() => {
    // Check if user has an existing session with data
    const initializeSession = async () => {
      console.log('Initializing session...');
      console.log('Has session?', hasSession());

      if (hasSession()) {
        // Check if there's data in this session
        const hasData = await hasStoredData();
        console.log('Has stored data?', hasData);

        if (hasData) {
          // Show modal to continue or start fresh - DON'T load data yet
          console.log('Setting showWelcomeModal to true');
          setShowWelcomeModal(true);
        } else {
          // Has session but no data, just load it
          console.log('Loading initial data (no stored data)');
          await loadInitialData();
        }
      } else {
        // No session, create a new one
        console.log('Creating new session');
        createNewSession();
        await loadInitialData();
      }
    };

    initializeSession();
  }, []);

  const loadInitialData = async () => {
    const namesFromDB = await loadNames();
    setNames(namesFromDB);

    const savedWinners = loadWinners();
    setWinners(savedWinners);

    // Set up real-time subscription for live sync across devices
    const sessionId = getCurrentSessionId();
    if (sessionId) {
      const channel = supabase
        .channel('participants-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'participants',
            filter: `session_id=eq.${sessionId}`
          },
          async (payload) => {
            console.log('Real-time update:', payload);
            // Reload all names when any change occurs
            const updatedNames = await loadNames();
            setNames(updatedNames);
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(channel);
      };
    }
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
      const result = await addName(inputName.trim());
      if (result.success) {
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
    const result = await removeName(nameToRemove);
    if (result.success) {
      // Also remove from winners if present
      const newWinners = winners.filter(name => name !== nameToRemove);
      setWinners(newWinners);
      saveWinners(newWinners);

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
        saveWinners(newWinners);
        return newWinners;
      }
      return prevWinners;
    });
  }, []); // Empty dependency array - function never changes

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
    saveWinners([]);
    setClearWinner(true);
    setTimeout(() => setClearWinner(false), 0);
    showToastMessage('Winner history cleared!');
  };

  const handleRemoveAllWinners = () => {
    const newNames = names.filter(name => !winners.includes(name));
    setNames(newNames);
    saveNames(newNames);
    setWinners([]);
    saveWinners([]);
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
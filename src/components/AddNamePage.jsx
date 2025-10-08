import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { addName } from '../utils/storage';
import './AddNamePage.css';

const AddNamePage = () => {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Get session ID from URL
    const session = searchParams.get('session');
    if (session) {
      setSessionId(session);
    } else {
      setError('Invalid session. Please scan the QR code again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!sessionId) {
      setError('Invalid session. Please scan the QR code again.');
      return;
    }

    if (name.trim()) {
      setError('');
      const result = await addName(name.trim(), sessionId);

      if (result.success) {
        setSubmitted(true);

        // Reset after 3 seconds
        setTimeout(() => {
          setName('');
          setSubmitted(false);
        }, 3000);
      } else {
        // Check if error is due to duplicate name
        if (result.error.includes('already in the list') || result.error.includes('duplicate') || result.error.includes('unique')) {
          setError('Name already in the wheel. Please use a variation (e.g., "John S.")');
        } else {
          setError('Error adding name. Please try again.');
        }
      }
    }
  };

  return (
    <div className="add-name-page">
      <div className="add-name-container">
        <motion.div
          className="add-name-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="card-header">
            <h1>Name Roulette</h1>
            <p>Join the wheel!</p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="add-name-form-mobile">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="name-input-mobile"
                maxLength={50}
                autoFocus
              />
              <button type="submit" className="submit-button" disabled={!name.trim()}>
                Add My Name
              </button>
              {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            </form>
          ) : (
            <motion.div
              className="success-message"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="success-icon">✅</div>
              <h2>Success!</h2>
              <p>You've been added to the wheel</p>
              <p className="name-display">{name}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AddNamePage;

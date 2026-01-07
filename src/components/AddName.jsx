import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import './AddName.css';

const AddName = ({ onAddName }) => {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onAddName(name.trim());
      setSubmitted(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  };

  return (
    <div className="add-name-page">
      <motion.div
        className="add-name-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="add-name-header">
          <h1 className="glow-text">SESSIONKIT</h1>
          <p className="subtitle">Add Your Name</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="add-name-form">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="name-input"
              autoFocus
              maxLength={50}
            />
            <button type="submit" className="btn btn-primary glow-button">
              Join the Wheel
            </button>
          </form>
        ) : (
          <motion.div
            className="success-message"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="success-icon">✓</div>
            <h2>You're in!</h2>
            <p>Good luck, {name}!</p>
            <p className="redirect-hint">Redirecting...</p>
          </motion.div>
        )}

        <div className="add-name-footer">
        </div>
      </motion.div>
    </div>
  );
};

export default AddName;

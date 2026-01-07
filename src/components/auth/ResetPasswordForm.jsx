import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './ResetPasswordForm.css';

const ResetPasswordForm = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState('request'); // 'request' or 'update'
  const navigate = useNavigate();

  // Request reset state
  const [email, setEmail] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState('');

  // Update password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    // Check if we have a recovery token in the URL (from email link)
    // Supabase sends tokens in URL hash, not query params
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
    const type = hashParams.get('type') || searchParams.get('type');
    const error = hashParams.get('error') || searchParams.get('error');

    // Check for errors from Supabase
    if (error) {
      if (error === 'access_denied') {
        setRequestError('Reset link has expired or is invalid. Please request a new one.');
      }
      return;
    }

    if (accessToken && type === 'recovery') {
      setMode('update');
    }
  }, [searchParams]);

  const validateEmail = (email) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setRequestError('');

    if (!validateEmail(email)) {
      setRequestError('Please enter a valid email address');
      return;
    }

    setRequestLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setRequestSuccess(true);
    } catch (err) {
      console.error('Reset request error:', err);
      setRequestError(err.message || 'An error occurred. Please try again.');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setUpdateError('');

    if (newPassword.length < 8) {
      setUpdateError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setUpdateError('Passwords do not match');
      return;
    }

    setUpdateLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setUpdateSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Password update error:', err);
      setUpdateError(err.message || 'An error occurred. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <motion.div
          className="reset-password-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="card-header">
            <h1>Name Roulette</h1>
            <p>{mode === 'request' ? 'Reset your password' : 'Set new password'}</p>
          </div>

          {mode === 'request' ? (
            // Step 1: Request reset email
            !requestSuccess ? (
              <form onSubmit={handleRequestReset} className="reset-form">
                <p className="instruction-text">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="form-input"
                    required
                    autoFocus
                    disabled={requestLoading}
                  />
                </div>

                {requestError && (
                  <motion.div
                    className="error-message"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {requestError}
                  </motion.div>
                )}

                <button
                  type="submit"
                  className="submit-button"
                  disabled={requestLoading || !email}
                >
                  {requestLoading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="back-button"
                >
                  ← Back to Login
                </button>
              </form>
            ) : (
              <motion.div
                className="success-message"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <div className="success-icon">✅</div>
                <h2>Check Your Email!</h2>
                <p>We've sent a password reset link to:</p>
                <p className="email-display">{email}</p>
                <p className="instruction-text">
                  Click the link in the email to reset your password.
                </p>

                <button
                  onClick={() => navigate('/login')}
                  className="back-button"
                >
                  ← Back to Login
                </button>
              </motion.div>
            )
          ) : (
            // Step 2: Update password
            !updateSuccess ? (
              <form onSubmit={handleUpdatePassword} className="reset-form">
                <p className="instruction-text">
                  Enter your new password below.
                </p>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="form-input"
                    required
                    minLength={8}
                    autoFocus
                    disabled={updateLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="form-input"
                    required
                    disabled={updateLoading}
                  />
                </div>

                {updateError && (
                  <motion.div
                    className="error-message"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {updateError}
                  </motion.div>
                )}

                <button
                  type="submit"
                  className="submit-button"
                  disabled={updateLoading || !newPassword || !confirmPassword}
                >
                  {updateLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            ) : (
              <motion.div
                className="success-message"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <div className="success-icon">✅</div>
                <h2>Password Updated!</h2>
                <p>Your password has been successfully reset.</p>
                <p className="redirect-message">Redirecting to login...</p>
              </motion.div>
            )
          )}
        </motion.div>

        <footer className="reset-password-footer">
        </footer>
      </div>
    </div>
  );
};

export default ResetPasswordForm;

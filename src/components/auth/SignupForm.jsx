import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './SignupForm.css';

const SignupForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      // Create user_profiles record
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([
            {
              id: authData.user.id,
              email: email,
              subscription_tier: 'free',
            },
          ]);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Note: User is still created in auth.users, just profile creation failed
          // This can be handled by a database trigger in production
        }
      }

      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Signup error:', err);

      // Handle specific error messages
      if (err.message.includes('already registered')) {
        setError('This email is already registered. Please login instead.');
      } else if (err.message.includes('Invalid email')) {
        setError('Please enter a valid email address');
      } else if (err.message.includes('Password')) {
        setError('Password is too weak. Please use at least 8 characters.');
      } else {
        setError(err.message || 'An error occurred during signup. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <motion.div
          className="signup-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="card-header">
            <h1>Name Roulette</h1>
            <p>Create your account</p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="signup-form">
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
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="form-input"
                  required
                  minLength={8}
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>

              {error && (
                <motion.div
                  className="error-message"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={loading || !email || !password || !confirmPassword}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>

              <div className="login-link">
                Already have an account? <Link to="/login">Login here</Link>
              </div>
            </form>
          ) : (
            <motion.div
              className="success-message"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="success-icon">✅</div>
              <h2>Account Created!</h2>
              <p>Please check your email to verify your account.</p>
              <p className="redirect-message">Redirecting to dashboard...</p>
            </motion.div>
          )}

          <button onClick={() => navigate('/')} className="back-button">
            ← Back to Home
          </button>
        </motion.div>

        <footer className="signup-footer">
          <p>Powered by Attensi</p>
        </footer>
      </div>
    </div>
  );
};

export default SignupForm;

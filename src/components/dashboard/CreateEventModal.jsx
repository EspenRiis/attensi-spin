import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './CreateEventModal.css';

const CreateEventModal = ({ isOpen, onClose, onSuccess }) => {
  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (eventName.trim().length < 3) {
      setError('Event name must be at least 3 characters');
      return;
    }

    if (eventName.trim().length > 100) {
      setError('Event name must be less than 100 characters');
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Create event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert([
          {
            host_user_id: user.id,
            name: eventName.trim(),
            status: 'draft',
            form_config: {
              fields: {
                name: { enabled: true, required: true, label: 'Name' },
                email: { enabled: true, required: true, label: 'Email' },
                organization: { enabled: true, required: false, label: 'Organization' },
                phone: { enabled: false, required: false, label: 'Phone' },
                custom1: { enabled: false, required: false, label: 'Custom Field 1' },
                custom2: { enabled: false, required: false, label: 'Custom Field 2' }
              },
              consent_text: 'I consent to receive marketing emails'
            },
            branding_config: {
              primary_color: '#00D9FF',
              logo_url: null,
              show_attensi_branding: true
            },
            anonymous_display: false
          }
        ])
        .select()
        .single();

      if (eventError) {
        throw eventError;
      }

      // Create default email templates
      const { error: templatesError } = await supabase
        .from('email_templates')
        .insert([
          {
            event_id: event.id,
            type: 'winner',
            subject: '🎉 Congratulations! You won at {{event_name}}!',
            body_html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                  .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                  .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎉 Congratulations!</h1>
                  </div>
                  <div class="content">
                    <p>Hi {{name}},</p>
                    <p>Great news! You've been selected as a winner at <strong>{{event_name}}</strong>!</p>
                    <p>Please contact us at {{host_email}} to claim your prize.</p>
                    <p>Thank you for participating!</p>
                  </div>
                  <div class="footer">
                  </div>
                </div>
              </body>
              </html>
            `
          },
          {
            event_id: event.id,
            type: 'loser',
            subject: 'Thank you for participating in {{event_name}}!',
            body_html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                  .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Thank You!</h1>
                  </div>
                  <div class="content">
                    <p>Hi {{name}},</p>
                    <p>Thank you for participating in <strong>{{event_name}}</strong>!</p>
                    <p>While you weren't selected this time, we truly appreciate your interest and participation.</p>
                    <p>Stay tuned for future events and opportunities!</p>
                  </div>
                  <div class="footer">
                  </div>
                </div>
              </body>
              </html>
            `
          }
        ]);

      if (templatesError) {
        console.error('Error creating email templates:', templatesError);
        // Don't fail the whole operation if templates fail
      }

      // Success! Close modal and redirect
      onSuccess();
      navigate(`/events/${event.id}`);
    } catch (err) {
      console.error('Create event error:', err);
      setError(err.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEventName('');
      setError('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="modal-container"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className="modal-header">
              <h2>Create New Event</h2>
              <button
                className="modal-close"
                onClick={handleClose}
                disabled={loading}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="eventName">Event Name *</label>
                <input
                  id="eventName"
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Summer Conference 2025"
                  className="form-input"
                  required
                  minLength={3}
                  maxLength={100}
                  autoFocus
                  disabled={loading}
                />
                <small className="form-hint">3-100 characters</small>
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

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading || !eventName.trim()}
                >
                  {loading ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateEventModal;

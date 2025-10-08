import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './RegisterPage.css';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventId = searchParams.get('event');

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    phone: '',
    custom_field_1: '',
    custom_field_2: '',
    consent_marketing: false
  });

  useEffect(() => {
    if (!eventId) {
      setError('Invalid registration link');
      setLoading(false);
      return;
    }
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (fetchError) {
        console.error('Supabase error:', fetchError);
        throw fetchError;
      }

      if (!data) {
        setError('Event not found');
        setLoading(false);
        return;
      }

      if (data.status !== 'live') {
        setError(`This event is not currently accepting registrations (Status: ${data.status})`);
        setLoading(false);
        return;
      }

      setEvent(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError(`Event not found: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const fields = event.form_config.fields;

    // Validate name
    if (fields.name.enabled && fields.name.required && !formData.name.trim()) {
      return 'Name is required';
    }
    if (formData.name.trim().length < 2 || formData.name.trim().length > 100) {
      return 'Name must be between 2 and 100 characters';
    }

    // Validate email
    if (fields.email.enabled && fields.email.required && !formData.email.trim()) {
      return 'Email is required';
    }
    if (formData.email.trim() && !validateEmail(formData.email)) {
      return 'Please enter a valid email address';
    }

    // Validate organization
    if (fields.organization.enabled && fields.organization.required && !formData.organization.trim()) {
      return 'Organization is required';
    }

    // Validate phone
    if (fields.phone.enabled && fields.phone.required && !formData.phone.trim()) {
      return 'Phone is required';
    }

    // Validate custom fields
    if (fields.custom1?.enabled && fields.custom1.required && !formData.custom_field_1.trim()) {
      return `${fields.custom1.label} is required`;
    }
    if (fields.custom2?.enabled && fields.custom2.required && !formData.custom_field_2.trim()) {
      return `${fields.custom2.label} is required`;
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      // Check if name already exists using secure function
      const { data: isDuplicate, error: checkError } = await supabase
        .rpc('check_duplicate_name', {
          p_name: formData.name.trim(),
          p_event_id: eventId,
          p_session_id: null
        });

      if (checkError) {
        throw checkError;
      }

      if (isDuplicate) {
        throw new Error('Name already in the wheel. Please use a variation (e.g., "John S.")');
      }

      const { error: insertError } = await supabase
        .from('participants')
        .insert([
          {
            event_id: eventId,
            name: formData.name.trim(),
            email: formData.email.trim() || null,
            organization: formData.organization.trim() || null,
            phone: formData.phone.trim() || null,
            custom_field_1: formData.custom_field_1.trim() || null,
            custom_field_2: formData.custom_field_2.trim() || null,
            consent_marketing: formData.consent_marketing
          }
        ]);

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('This email is already registered for this event');
        }
        throw insertError;
      }

      setSuccess(true);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="register-page">
        <div className="register-container">
          <div className="loading-state">Loading...</div>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="register-page">
        <div className="register-container">
          <div className="error-state">
            <h2>{error}</h2>
            <button onClick={() => navigate('/')} className="btn-primary">
              ← Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="register-page" style={{ background: event.branding_config.primary_color || '#667eea' }}>
        <div className="register-container">
          <motion.div
            className="success-card"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="success-icon">✅</div>
            <h2>You're Registered!</h2>
            <p>Thank you for registering for <strong>{event.name}</strong></p>
            <p className="success-message">Good luck!</p>
          </motion.div>
        </div>
      </div>
    );
  }

  const fields = event.form_config.fields;
  const primaryColor = event.branding_config.primary_color || '#667eea';

  return (
    <div className="register-page" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)` }}>
      <div className="register-container">
        <motion.div
          className="register-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {event.branding_config.logo_url && (
            <img src={event.branding_config.logo_url} alt="Logo" className="event-logo" />
          )}

          <div className="card-header">
            <h1>{event.name}</h1>
            <p>Register to participate</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            {fields.name.enabled && (
              <div className="form-group">
                <label htmlFor="name">
                  {fields.name.label}
                  {fields.name.required && <span className="required">*</span>}
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="form-input"
                  required={fields.name.required}
                  disabled={submitting}
                />
              </div>
            )}

            {fields.email.enabled && (
              <div className="form-group">
                <label htmlFor="email">
                  {fields.email.label}
                  {fields.email.required && <span className="required">*</span>}
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="form-input"
                  required={fields.email.required}
                  disabled={submitting}
                />
              </div>
            )}

            {fields.organization.enabled && (
              <div className="form-group">
                <label htmlFor="organization">
                  {fields.organization.label}
                  {fields.organization.required && <span className="required">*</span>}
                </label>
                <input
                  id="organization"
                  type="text"
                  value={formData.organization}
                  onChange={(e) => handleInputChange('organization', e.target.value)}
                  className="form-input"
                  required={fields.organization.required}
                  disabled={submitting}
                />
              </div>
            )}

            {fields.phone.enabled && (
              <div className="form-group">
                <label htmlFor="phone">
                  {fields.phone.label}
                  {fields.phone.required && <span className="required">*</span>}
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="form-input"
                  required={fields.phone.required}
                  disabled={submitting}
                />
              </div>
            )}

            {fields.custom1?.enabled && (
              <div className="form-group">
                <label htmlFor="custom1">
                  {fields.custom1.label}
                  {fields.custom1.required && <span className="required">*</span>}
                </label>
                <input
                  id="custom1"
                  type="text"
                  value={formData.custom_field_1}
                  onChange={(e) => handleInputChange('custom_field_1', e.target.value)}
                  className="form-input"
                  required={fields.custom1.required}
                  disabled={submitting}
                />
              </div>
            )}

            {fields.custom2?.enabled && (
              <div className="form-group">
                <label htmlFor="custom2">
                  {fields.custom2.label}
                  {fields.custom2.required && <span className="required">*</span>}
                </label>
                <input
                  id="custom2"
                  type="text"
                  value={formData.custom_field_2}
                  onChange={(e) => handleInputChange('custom_field_2', e.target.value)}
                  className="form-input"
                  required={fields.custom2.required}
                  disabled={submitting}
                />
              </div>
            )}

            <div className="consent-group">
              <label className="consent-label">
                <input
                  type="checkbox"
                  checked={formData.consent_marketing}
                  onChange={(e) => handleInputChange('consent_marketing', e.target.checked)}
                  disabled={submitting}
                />
                <span>{event.form_config.consent_text}</span>
              </label>
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
              style={{ background: primaryColor }}
              disabled={submitting}
            >
              {submitting ? 'Registering...' : 'Register'}
            </button>
          </form>

          {event.branding_config.show_attensi_branding && (
            <div className="powered-by">
              <p>Powered by Attensi</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;

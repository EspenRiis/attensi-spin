import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import './CustomizeTab.css';

const CustomizeTab = ({ event, onEventUpdate }) => {
  const [formConfig, setFormConfig] = useState(event.form_config || {});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setFormConfig(event.form_config || getDefaultFormConfig());
  }, [event]);

  const getDefaultFormConfig = () => ({
    fields: {
      name: { enabled: true, required: true, label: 'Name' },
      email: { enabled: true, required: true, label: 'Email' },
      organization: { enabled: true, required: false, label: 'Organization' },
      phone: { enabled: false, required: false, label: 'Phone' },
      custom1: { enabled: false, required: false, label: 'Custom Field 1' },
      custom2: { enabled: false, required: false, label: 'Custom Field 2' }
    },
    consent_text: 'I consent to receive marketing emails'
  });

  const handleFieldToggle = (fieldName, property, value) => {
    setFormConfig(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          [property]: value
        }
      }
    }));
  };

  const handleConsentTextChange = (e) => {
    setFormConfig(prev => ({
      ...prev,
      consent_text: e.target.value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');

    try {
      const { error } = await supabase
        .from('events')
        .update({ form_config: formConfig })
        .eq('id', event.id);

      if (error) throw error;

      onEventUpdate({ ...event, form_config: formConfig });
      setSaveMessage('✓ Form configuration saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error('Error saving form config:', err);
      setSaveMessage('✗ Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const fields = formConfig.fields || getDefaultFormConfig().fields;

  return (
    <div className="customize-tab">
      <motion.div
        className="customize-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>Registration Form Fields</h2>
        <p className="section-description">
          Choose which fields to show on your registration form and whether they're required.
        </p>

        <div className="fields-list">
          {Object.entries(fields).map(([fieldName, fieldConfig]) => (
            <motion.div
              key={fieldName}
              className="field-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="field-header">
                <label className="field-toggle">
                  <input
                    type="checkbox"
                    checked={fieldConfig.enabled}
                    onChange={(e) => handleFieldToggle(fieldName, 'enabled', e.target.checked)}
                    disabled={fieldName === 'name'} // Name is always required
                  />
                  <span className="toggle-slider"></span>
                </label>
                <input
                  type="text"
                  className="field-label-input"
                  value={fieldConfig.label}
                  onChange={(e) => handleFieldToggle(fieldName, 'label', e.target.value)}
                  disabled={!fieldConfig.enabled}
                  placeholder="Field label"
                />
              </div>

              {fieldConfig.enabled && (
                <div className="field-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={fieldConfig.required}
                      onChange={(e) => handleFieldToggle(fieldName, 'required', e.target.checked)}
                      disabled={fieldName === 'name'} // Name is always required
                    />
                    <span>Required</span>
                  </label>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="customize-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2>Consent Text</h2>
        <p className="section-description">
          This text will appear with a checkbox on the registration form.
        </p>
        <textarea
          className="consent-textarea"
          value={formConfig.consent_text || ''}
          onChange={handleConsentTextChange}
          placeholder="Enter consent text..."
          rows={3}
        />
      </motion.div>

      <div className="customize-actions">
        <button
          className="btn-save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {saveMessage && (
          <span className={`save-message ${saveMessage.includes('✓') ? 'success' : 'error'}`}>
            {saveMessage}
          </span>
        )}
      </div>
    </div>
  );
};

export default CustomizeTab;

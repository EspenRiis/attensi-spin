import { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import './EventQRCodePanel.css';

const EventQRCodePanel = ({ eventId, eventName, event, onEventUpdate }) => {
  const qrRef = useRef(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Form configuration state
  const [formConfig, setFormConfig] = useState(event?.form_config || {});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showCustomFields, setShowCustomFields] = useState(false);

  useEffect(() => {
    setFormConfig(event?.form_config || getDefaultFormConfig());
    // Check if custom fields are already enabled
    const hasCustomFields = event?.form_config?.fields?.custom1?.enabled ||
                           event?.form_config?.fields?.custom2?.enabled;
    setShowCustomFields(hasCustomFields);
  }, [event]);

  const getDefaultFormConfig = () => ({
    fields: {
      name: { enabled: true, required: true, label: 'Name' },
      email: { enabled: true, required: false, label: 'Email' },
      organization: { enabled: false, required: false, label: 'Organization' },
      phone: { enabled: false, required: false, label: 'Phone' },
      custom1: { enabled: false, required: false, label: 'Custom Field 1' },
      custom2: { enabled: false, required: false, label: 'Custom Field 2' }
    }
  });

  // Generate registration URL
  const registrationUrl = `${window.location.origin}/register?event=${eventId}`;

  // Download QR code as PNG
  const downloadQR = () => {
    setDownloadLoading(true);

    try {
      // Get the SVG element - query directly from DOM since ref may not work with QRCodeSVG
      const svgElement = document.querySelector('.event-qr-panel .qr-code-wrapper svg');
      if (!svgElement) {
        console.error('SVG element not found');
        alert('QR code not ready. Please try again.');
        setDownloadLoading(false);
        return;
      }

      // Create a canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 512; // High quality size
      canvas.width = size;
      canvas.height = size;

      // Fill with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);

      // Convert SVG to data URL
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      // Create an image and draw it on canvas
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(url);

        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `${eventName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-qr-code.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);
          setDownloadLoading(false);
        }, 'image/png');
      };
      img.onerror = (e) => {
        console.error('Failed to load QR code image:', e);
        alert('Failed to download QR code. Please try again.');
        setDownloadLoading(false);
      };
      img.src = url;
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Error downloading QR code. Please try again.');
      setDownloadLoading(false);
    }
  };

  // Copy link to clipboard
  const copyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(registrationUrl);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = registrationUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link. Please copy manually.');
    }
  };

  // Form configuration handlers
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

  const handleSaveFormConfig = async () => {
    setSaving(true);
    setSaveMessage('');

    try {
      const { error } = await supabase
        .from('events')
        .update({ form_config: formConfig })
        .eq('id', eventId);

      if (error) throw error;

      onEventUpdate({ ...event, form_config: formConfig });
      setSaveMessage('✓ Saved!');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (err) {
      console.error('Error saving form config:', err);
      setSaveMessage('✗ Failed');
      setTimeout(() => setSaveMessage(''), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomField = () => {
    setShowCustomFields(true);
    // Enable first available custom field
    if (!formConfig.fields.custom1.enabled) {
      handleFieldToggle('custom1', 'enabled', true);
    } else if (!formConfig.fields.custom2.enabled) {
      handleFieldToggle('custom2', 'enabled', true);
    }
  };

  const handleRemoveCustomField = (fieldName) => {
    handleFieldToggle(fieldName, 'enabled', false);
    // If both are disabled, hide the section
    const otherField = fieldName === 'custom1' ? 'custom2' : 'custom1';
    if (!formConfig.fields[otherField].enabled) {
      setShowCustomFields(false);
    }
  };

  const fields = formConfig.fields || getDefaultFormConfig().fields;
  const canAddMoreCustomFields = !fields.custom1.enabled || !fields.custom2.enabled;

  return (
    <motion.div
      className="event-qr-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="qr-panel-headers">
        <h4 className="qr-column-header">Registration QR Code</h4>
        <h4 className="form-column-header">QR Registration Form Fields</h4>
      </div>

      <div className="qr-panel-grid">
        {/* Left Column - QR Code */}
        <div className="qr-column">
          <div className="qr-code-container">
            <div className="qr-code-wrapper">
              <QRCodeSVG
                ref={qrRef}
                value={registrationUrl}
                size={180}
                level="H"
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#0A1628"
              />
            </div>
          </div>

          <div className="qr-url-display">
            <code>{registrationUrl}</code>
          </div>

          <div className="qr-actions">
            <button
              className="btn-qr-action btn-download"
              onClick={downloadQR}
              disabled={downloadLoading}
              aria-label="Download QR code as PNG"
            >
              <span className="btn-icon">⬇️</span>
              {downloadLoading ? 'Downloading...' : 'Download'}
            </button>

            <button
              className="btn-qr-action btn-copy"
              onClick={copyLink}
              aria-label="Copy registration link to clipboard"
            >
              <span className="btn-icon">{copySuccess ? '✓' : '📋'}</span>
              {copySuccess ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Right Column - Form Settings */}
        <div className="form-settings-column">
          <div className="form-fields-list">
            {/* Core Fields */}
            {['name', 'email', 'phone', 'organization'].map(fieldName => (
              <div key={fieldName} className="form-field-item">
                <label className="field-checkbox">
                  <input
                    type="checkbox"
                    checked={fields[fieldName].enabled}
                    onChange={(e) => handleFieldToggle(fieldName, 'enabled', e.target.checked)}
                    disabled={fieldName === 'name'}
                  />
                  <span className="checkbox-label">
                    {fields[fieldName].label}
                    {fieldName === 'name' && <span className="required-badge">Required</span>}
                  </span>
                </label>
                {fields[fieldName].enabled && fieldName !== 'name' && (
                  <label className="field-required-toggle">
                    <input
                      type="checkbox"
                      checked={fields[fieldName].required}
                      onChange={(e) => handleFieldToggle(fieldName, 'required', e.target.checked)}
                    />
                    <span>Required</span>
                  </label>
                )}
              </div>
            ))}

            {/* Custom Fields */}
            {showCustomFields && (
              <div className="custom-fields-section">
                {fields.custom1.enabled && (
                  <div className="custom-field-item">
                    <input
                      type="text"
                      className="custom-field-input"
                      value={fields.custom1.label}
                      onChange={(e) => handleFieldToggle('custom1', 'label', e.target.value)}
                      placeholder="Custom field label"
                    />
                    <label className="field-required-toggle">
                      <input
                        type="checkbox"
                        checked={fields.custom1.required}
                        onChange={(e) => handleFieldToggle('custom1', 'required', e.target.checked)}
                      />
                      <span>Required</span>
                    </label>
                    <button
                      className="btn-remove-field"
                      onClick={() => handleRemoveCustomField('custom1')}
                      aria-label="Remove custom field"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {fields.custom2.enabled && (
                  <div className="custom-field-item">
                    <input
                      type="text"
                      className="custom-field-input"
                      value={fields.custom2.label}
                      onChange={(e) => handleFieldToggle('custom2', 'label', e.target.value)}
                      placeholder="Custom field label"
                    />
                    <label className="field-required-toggle">
                      <input
                        type="checkbox"
                        checked={fields.custom2.required}
                        onChange={(e) => handleFieldToggle('custom2', 'required', e.target.checked)}
                      />
                      <span>Required</span>
                    </label>
                    <button
                      className="btn-remove-field"
                      onClick={() => handleRemoveCustomField('custom2')}
                      aria-label="Remove custom field"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Add Custom Field Button */}
            {canAddMoreCustomFields && (
              <button
                className="btn-add-custom-field"
                onClick={handleAddCustomField}
              >
                ➕ Add Custom Field
              </button>
            )}
          </div>

          {/* Save Button */}
          <div className="form-settings-actions">
            <button
              className="btn-save-form"
              onClick={handleSaveFormConfig}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Form Settings'}
            </button>
            {saveMessage && (
              <span className={`save-message ${saveMessage.includes('✓') ? 'success' : 'error'}`}>
                {saveMessage}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EventQRCodePanel;

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentSessionId } from '../utils/session';
import './QRCodePanel.css';

const QRCodePanel = ({ eventId = null }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Use the actual URL the page was loaded from
  // This will be localhost when accessed via localhost, or the IP when accessed via IP
  const currentUrl = window.location.origin;

  // Generate URL based on mode (event vs session)
  const registrationUrl = eventId
    ? `${currentUrl}/register?event=${eventId}`
    : `${currentUrl}/add-name?session=${getCurrentSessionId()}`;

  return (
    <motion.div
      className={`qr-panel ${isCollapsed ? 'collapsed' : ''}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="qr-panel-header">
        <h3>Scan to Join</h3>
        <button
          className="collapse-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand QR code' : 'Collapse QR code'}
        >
          <span className="toggle-text">{isCollapsed ? 'Show QR' : 'Hide QR'}</span>
          <span className="toggle-icon">{isCollapsed ? '▼' : '▲'}</span>
        </button>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            className="qr-panel-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="qr-code-wrapper">
              <QRCodeSVG
                value={registrationUrl}
                size={180}
                level="H"
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#0A1628"
              />
            </div>
            <p className="qr-instruction">
              📱 Scan with your phone to add your name
            </p>
            <div className="qr-url">
              <code>{registrationUrl}</code>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QRCodePanel;

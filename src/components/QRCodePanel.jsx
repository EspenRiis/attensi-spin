import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { getCurrentSessionId } from '../utils/session';
import './QRCodePanel.css';

const QRCodePanel = ({ eventId = null }) => {
  // Use the actual URL the page was loaded from
  // This will be localhost when accessed via localhost, or the IP when accessed via IP
  const currentUrl = window.location.origin;

  // Generate URL based on mode (event vs session)
  const registrationUrl = eventId
    ? `${currentUrl}/register?event=${eventId}`
    : `${currentUrl}/add-name?session=${getCurrentSessionId()}`;

  return (
    <motion.div
      className="qr-panel"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <h3>Scan to Join</h3>
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
  );
};

export default QRCodePanel;

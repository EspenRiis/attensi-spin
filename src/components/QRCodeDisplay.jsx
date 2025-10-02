import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import './QRCodeDisplay.css';

const QRCodeDisplay = ({ url }) => {
  return (
    <motion.div
      className="qr-code-container"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <h3 className="qr-title">Scan to Join</h3>
      <div className="qr-code-wrapper">
        <QRCodeSVG
          value={url}
          size={200}
          bgColor="#0A1628"
          fgColor="#00D9FF"
          level="H"
          includeMargin={true}
        />
      </div>
      <p className="qr-hint">Participants can add their names</p>
    </motion.div>
  );
};

export default QRCodeDisplay;

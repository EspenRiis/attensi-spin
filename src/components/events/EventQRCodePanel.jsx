import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import './EventQRCodePanel.css';

const EventQRCodePanel = ({ eventId, eventName }) => {
  const qrRef = useRef(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

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

  return (
    <motion.div
      className="event-qr-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3>Registration QR Code</h3>
      <p className="qr-description">
        Share this QR code with participants to let them register for your event
      </p>

      <div className="qr-code-container">
        <div className="qr-code-wrapper">
          <QRCodeSVG
            ref={qrRef}
            value={registrationUrl}
            size={256}
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
          {downloadLoading ? 'Downloading...' : 'Download QR'}
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

      <p className="qr-tip">
        💡 Tip: Download the QR code to print or share on social media
      </p>
    </motion.div>
  );
};

export default EventQRCodePanel;

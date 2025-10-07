import { motion } from 'framer-motion';
import './CustomizeTab.css';

const CustomizeTab = ({ event }) => {
  return (
    <div className="customize-tab">
      <motion.div
        className="placeholder-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="placeholder-icon">🎨</div>
        <h2>Branding Customization Coming Soon</h2>
        <p className="placeholder-description">
          Soon you'll be able to customize your event's branding including logo, colors, and email templates.
        </p>

        <div className="coming-soon-features">
          <div className="feature-card disabled">
            <div className="feature-icon">🖼️</div>
            <h3>Logo Upload</h3>
            <p>Add your company logo to registration pages and QR codes</p>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>

          <div className="feature-card disabled">
            <div className="feature-icon">🎨</div>
            <h3>Brand Colors</h3>
            <p>Customize colors to match your brand identity</p>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>

          <div className="feature-card disabled">
            <div className="feature-icon">📧</div>
            <h3>Email Templates</h3>
            <p>Design custom email templates for winners and participants</p>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>
        </div>

        <div className="info-box">
          <p>💡 <strong>Note:</strong> Form field settings have moved to the Overview tab, next to the QR code for easier access.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomizeTab;

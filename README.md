# Attensi Spin - Wheel of Names App

A fully-featured, gamified wheel of names application built with React, featuring the Attensi brand identity.

🚀 **Live Demo:** https://attensi-spin.vercel.app

## 🎯 Features

### Core Functionality
- ✅ **Dynamic Name Management**: Add and remove names on the fly with instant UI updates
- ✅ **QR Code Integration**: Users can scan a QR code to add their names via mobile
- ✅ **Session-Based Isolation**: Each host has their own private session with unique session ID
- ✅ **Session Management**: Welcome-back modal to continue previous session or start fresh
- ✅ **Cross-Device Real-time Sync**: Changes sync instantly across all devices via Supabase
- ✅ **Unlimited Participants**: No limit on number of names (though readability decreases with many names)
- ✅ **Winner Tracking**: Keeps track of all previous winners (stored locally)
- ✅ **Multiple Spins**: Support for multiple winners with option to remove past winners
- ✅ **Privacy & GDPR Compliant**: Session-based data isolation ensures users don't see each other's data

### Gamification
- 🎉 **Confetti Animation**: Celebration with colorful confetti when winner is announced
- 🎯 **Smooth Wheel Spin**: 4-5 second spin with ease-out animation
- 💫 **Particle Effects**: Subtle background animations
- ✨ **Glowing Effects**: Cyan glow effects on buttons and winner announcement
- 🎨 **Animated Transitions**: Smooth framer-motion animations throughout

### Design
- 🎨 **Attensi Brand Colors**: Dark navy blue, cyan bright, and neon green
- 📱 **Fully Responsive**: Works on desktop, tablet, and mobile
- 🌟 **Modern UI**: Clean, professional interface with glassmorphism effects
- ⚡ **Performance Optimized**: Smooth 60fps animations

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher recommended)
- npm or yarn
- Supabase account (free tier works fine)

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the database migration from `SESSION-MIGRATION.md`
   - Get your Supabase URL and anon key from project settings

3. **Configure environment variables:**
   Create a `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The production files will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## 📱 How to Use

### Main Wheel Page

1. **Add Names Manually**:
   - Type a name in the input field
   - Click "Add" or press Enter
   - Name appears in the participant list

2. **Add Names via QR Code**:
   - Show the QR code on the right panel (includes your unique session ID)
   - Participants scan with their phones
   - They're taken to a mobile-friendly page to enter their name
   - Names appear instantly on the main wheel AND all connected devices

3. **Spin the Wheel**:
   - Click the large "SPIN" button
   - Watch the wheel spin for 4-5 seconds
   - Winner is announced with confetti!

4. **Manage Winners**:
   - Winners are marked with 🏆 in the participant list
   - "Remove Winner" - removes the winner from the wheel entirely
   - "Clear Winner History" - clears the winner badges but keeps names
   - "Remove All Winners from Wheel" - removes all previous winners at once

### Session Management

**First Visit:**
- A unique session ID is automatically generated and stored in your browser
- Your QR code includes this session ID
- Participants who scan join YOUR specific session

**Returning to the App:**
- If you have saved data in your session, you'll see a "Welcome Back!" modal
- Choose "Continue" to load your previous session with all names
- Choose "Start Fresh" to clear everything and create a new session

**Privacy:**
- Each session is completely isolated
- Other users cannot see your participants
- Incognito mode always starts a fresh session
- GDPR compliant - no cross-session data sharing

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Supabase** - Backend database with real-time subscriptions
- **Framer Motion** - Animations
- **QRCode.react** - QR code generation
- **Canvas Confetti** - Celebration effects
- **React Router** - Navigation
- **CSS3** - Styling with custom properties

## 📂 Project Structure

```
attensi-spin/
├── src/
│   ├── components/
│   │   ├── WheelPage.jsx         # Main page with wheel
│   │   ├── WheelPage.css
│   │   ├── AddNamePage.jsx       # Mobile QR code page
│   │   ├── AddNamePage.css
│   │   ├── Wheel.jsx             # Spinning wheel component
│   │   ├── Wheel.css
│   │   ├── ParticipantList.jsx   # List of names
│   │   ├── ParticipantList.css
│   │   ├── QRCodePanel.jsx       # QR code display with session ID
│   │   ├── QRCodePanel.css
│   │   ├── WelcomeModal.jsx      # Session continue/fresh modal
│   │   ├── WelcomeModal.css
│   │   ├── WinnerModal.jsx       # Winner announcement
│   │   └── WinnerModal.css
│   ├── utils/
│   │   ├── storage.js            # Supabase storage utilities
│   │   ├── session.js            # Session ID management
│   │   ├── colors.js             # Color generation
│   │   └── firebase.js           # Legacy (unused)
│   ├── lib/
│   │   └── supabase.js           # Supabase client configuration
│   ├── App.jsx                   # Main app with routing
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles
├── index.html
├── package.json
├── vite.config.js
├── vercel.json                   # Vercel deployment config
├── README.md                     # This file
├── SESSION-MIGRATION.md          # Database migration guide
└── DEPLOYMENT.md                 # Deployment instructions
```

## 🎨 Attensi Brand Guidelines

### Color Palette
- **Primary Background**: `#0A1628` (Dark Navy)
- **Secondary Background**: `#1a2942` (Medium Navy)
- **Primary Accent**: `#00D9FF` (Cyan Bright)
- **Secondary Accent**: `#00FF88` (Neon Green)
- **Text**: `#FFFFFF` (White)
- **Light Text**: `#E0E0E0` (Light Gray)

### Design Principles
1. **Impactful** - Bold, high-contrast designs
2. **Thoughtful** - Scientific, professional approach
3. **Playful** - Gamification elements, engaging visuals

### Typography
- Font Family: Avenir (fallback to system sans-serif)
- Headers: Bold, large with glow effects
- Body: Clean, readable

## 🔧 Customization

### Modify Colors
Edit `src/index.css` to change the color scheme:
```css
:root {
  --navy-dark: #0A1628;
  --cyan-bright: #00D9FF;
  --green-neon: #00FF88;
  /* ... */
}
```

### Adjust Spin Duration
Edit `src/components/Wheel.jsx`:
```javascript
const duration = 4000; // Change to desired milliseconds
```

### Change Wheel Size
Edit `src/components/Wheel.jsx`:
```javascript
width={500}  // Change canvas width
height={500} // Change canvas height
```

## 📝 Notes

### Backend Architecture
This app uses **Supabase** for real-time cross-device synchronization:

- **Participants Table**: Stores names with session_id for isolation
- **Real-time Subscriptions**: Changes sync instantly across all devices
- **Session Management**: Each host gets a unique session ID stored in localStorage
- **Row Level Security**: Policies allow public read/write (can be locked down if needed)

See `SESSION-MIGRATION.md` for database schema details.

### Data Storage
- **Participant Names**: Stored in Supabase, filtered by session_id
- **Session ID**: Stored in browser localStorage
- **Winners History**: Stored locally in localStorage (not synced)

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled
- localStorage must be available for session persistence

## 🐛 Known Limitations

- Wheel becomes hard to read with 50+ names (consider limiting participants)
- Confetti may be performance-intensive on older devices
- Winner history is local only (not synced across devices)
- Session ID stored in localStorage (clearing browser data clears session)

## 📄 License

This project is created for Attensi. All rights reserved.

## 🤝 Support

For issues or questions, please contact the development team.

---

**Powered by Attensi** 🎯

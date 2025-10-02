# Attensi Spin - Wheel of Names App

A fully-featured, gamified wheel of names application built with React, featuring the Attensi brand identity.

🚀 **Live Demo:** https://attensi-spin.vercel.app

## 🎯 Features

### Core Functionality
- ✅ **Dynamic Name Management**: Add and remove names on the fly
- ✅ **QR Code Integration**: Users can scan a QR code to add their names via mobile
- ✅ **Session Persistence**: Saves names to localStorage with welcome-back modal
- ✅ **Unlimited Participants**: No limit on number of names (though readability decreases with many names)
- ✅ **Winner Tracking**: Keeps track of all previous winners
- ✅ **Multiple Spins**: Support for multiple winners with option to remove past winners
- ✅ **Real-time Updates**: Changes made via QR code appear instantly on the main wheel

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

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
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
   - Show the QR code on the right panel
   - Users scan with their phones
   - They're taken to a mobile-friendly page to enter their name
   - Names appear instantly on the main wheel

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

When you return to the app:
- If you have saved names, you'll see a welcome modal
- Choose "Continue" to load previous session
- Choose "Start Fresh" to clear everything and start over

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
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
│   │   ├── QRCodePanel.jsx       # QR code display
│   │   ├── QRCodePanel.css
│   │   ├── WelcomeModal.jsx      # Session modal
│   │   ├── WelcomeModal.css
│   │   ├── WinnerModal.jsx       # Winner announcement
│   │   └── WinnerModal.css
│   ├── utils/
│   │   ├── storage.js            # localStorage utilities
│   │   └── colors.js             # Color generation
│   ├── App.jsx                   # Main app with routing
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles
├── index.html
├── package.json
├── vite.config.js
└── README.md
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

### Backend Integration (Optional)
The current version uses localStorage for data persistence. For true real-time sync across devices:

1. **Firebase**: Add Firebase Realtime Database
2. **Supabase**: Use Supabase with real-time subscriptions
3. **Custom Backend**: Build your own WebSocket server

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled
- localStorage must be available

## 🐛 Known Limitations

- QR code real-time sync works via localStorage events (same browser only)
- For true cross-device sync, backend integration is needed
- Wheel becomes hard to read with 50+ names (consider limiting or grouping)
- Confetti may be performance-intensive on older devices

## 📄 License

This project is created for Attensi. All rights reserved.

## 🤝 Support

For issues or questions, please contact the development team.

---

**Powered by Attensi** 🎯

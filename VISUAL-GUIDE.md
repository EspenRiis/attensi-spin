# Attensi Spin - Visual Feature Guide

## 🎨 User Interface Overview

### Main Screen Layout

```
┌─────────────────────────────────────────────────────────────┐
│                      ATTENSI SPIN                           │
│                  (Glowing cyan title)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐   ┌────────────────┐   ┌──────────────┐ │
│  │              │   │                │   │              │ │
│  │  ADD NAME    │   │   SPINNING     │   │  QR CODE     │ │
│  │  ─────────   │   │    WHEEL       │   │  PANEL       │ │
│  │  [Input Box] │   │      ▼         │   │  ┌────────┐  │ │
│  │  [Add Button]│   │   ╱      ╲     │   │  │ QR     │  │ │
│  │              │   │  │ ATTENSI │   │   │  │ CODE   │  │ │
│  │──────────────│   │   ╲      ╱     │   │  └────────┘  │ │
│  │ PARTICIPANTS │   │                │   │              │ │
│  │              │   │   [SPIN BTN]   │   │ Scan to Join │ │
│  │ 1. Name 1  × │   │                │   │              │ │
│  │ 2. Name 2  × │   │                │   │              │ │
│  │ 3. Name 3🏆×  │   │                │   │              │ │
│  │              │   │                │   │              │ │
│  └──────────────┘   └────────────────┘   └──────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                   Powered by Attensi                        │
└─────────────────────────────────────────────────────────────┘
```

## 📱 Feature Breakdown

### 1. Name Input Section
```
┌──────────────────────────────┐
│  [Enter a name...     ] [Add]│
└──────────────────────────────┘
```
- **Location**: Left panel, top
- **Features**:
  - Text input field
  - Add button (cyan gradient)
  - Validates duplicates
  - Max 50 characters
  - Enter key submits

### 2. Participant List
```
┌──────────────────────────────┐
│  Participants      [25 people]│
├──────────────────────────────┤
│  ① Alice Johnson          ×  │
│  ② Bob Smith              ×  │
│  ③ Charlie Davis      🏆  ×  │
│  ④ Diana Prince           ×  │
│  ...                          │
└──────────────────────────────┘
```
- **Features**:
  - Numbered list
  - Total count badge
  - Remove button (×) per name
  - Winner badge (🏆) for past winners
  - Scrollable list
  - Hover effects

### 3. The Spinning Wheel
```
        ▼ (pointer)
    ┌─────────┐
   ╱           ╲
  │   SEGMENT   │
  │ ──────────  │
  │  ATTENSI   │ (logo in center)
  │ ──────────  │
  │   SEGMENT   │
   ╲           ╱
    └─────────┘
```
- **Features**:
  - Canvas-based rendering
  - Dynamic segments
  - Auto-colored from Attensi palette
  - Pointer at top
  - Logo in center
  - Smooth rotation
  - Responsive sizing

### 4. Spin Button
```
┌──────────────────────────────┐
│                              │
│         S  P  I  N           │
│                              │
└──────────────────────────────┘
```
- **States**:
  - Default: Cyan gradient, large text
  - Hover: Glows and lifts
  - Spinning: Shows "SPINNING..."
  - Disabled: Gray (< 2 names)
- **Animation**: Pulsing glow effect

### 5. QR Code Panel
```
┌──────────────────────────────┐
│        Scan to Join          │
│                              │
│      ┌──────────────┐        │
│      │  ███  ██  ██ │        │
│      │  █  ██  █  █ │        │
│      │  ███  ██  ██ │        │
│      └──────────────┘        │
│                              │
│  📱 Scan with your phone     │
│  to add your name            │
│                              │
│  https://yoururl/add-name    │
└──────────────────────────────┘
```
- **Features**:
  - Live QR code generation
  - Displays URL
  - Icon instructions
  - Clean white background

## 🎭 Modal Screens

### Welcome Back Modal
```
┌──────────────────────────────────────┐
│                                      │
│              🎯                      │
│                                      │
│         Welcome Back!                │
│                                      │
│  Would you like to continue with     │
│     your previous session?           │
│                                      │
│  ┌──────────────────────────────┐   │
│  │      Continue                │   │
│  │   Load saved names           │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │    Start Fresh               │   │
│  │    Clear all data            │   │
│  └──────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
```

### Winner Announcement Modal
```
┌──────────────────────────────────────┐
│                                      │
│              🎉                      │
│           (animated)                 │
│                                      │
│      Congratulations!                │
│                                      │
│    ┌──────────────────────┐         │
│    │   WINNER NAME        │         │
│    └──────────────────────┘         │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  🎯 Spin Again               │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  ❌ Remove Winner            │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │       Close                  │   │
│  └──────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
```
**With confetti falling!** 🎊

## 📲 Mobile QR Entry Page

```
┌──────────────────────────────┐
│                              │
│       ATTENSI SPIN           │
│        Join the wheel!       │
│                              │
│  ┌────────────────────────┐  │
│  │  [Enter your name...] │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │   Add My Name          │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  ← Back to Wheel       │  │
│  └────────────────────────┘  │
│                              │
│     Powered by Attensi       │
│                              │
└──────────────────────────────┘
```

**After submission:**
```
┌──────────────────────────────┐
│                              │
│       ATTENSI SPIN           │
│                              │
│           ✅                 │
│                              │
│        Success!              │
│                              │
│   You've been added to       │
│        the wheel             │
│                              │
│      Your Name Here          │
│                              │
└──────────────────────────────┘
```

## 🎨 Color Usage Examples

### Buttons
- **Primary Action**: Cyan gradient (#00D9FF → #0088FF)
- **Danger**: Red (#FF4444)
- **Warning**: Orange (#FFA500)
- **Secondary**: White with transparency

### Text
- **Headers**: Cyan bright with glow
- **Body**: White
- **Subtle**: Light gray
- **Success**: Neon green

### Backgrounds
- **Main**: Dark navy (#0A1628)
- **Cards**: Medium navy with transparency
- **Borders**: Cyan with transparency

## 🎬 Animation Examples

### On Page Load
1. Title fades in and slides down
2. Components fade in sequentially (stagger)
3. Wheel draws itself

### On Name Add
1. Toast notification slides in from top-right
2. New name animates into list
3. Wheel segments redistribute

### On Spin
1. Button pulses
2. Wheel accelerates
3. Decelerates with easing
4. Winner is highlighted
5. Modal scales in
6. Confetti explodes!

### Hover Effects
- Buttons: Lift and glow
- List items: Slide right and glow border
- QR panel: Subtle scale
- Spin button: Intense glow

## 📊 Responsive Breakpoints

### Desktop (> 1200px)
```
[Participants] [Wheel] [QR Code]
   (3 columns)
```

### Tablet (768px - 1200px)
```
      [Wheel]
[Participants]
   [QR Code]
  (1 column)
```

### Mobile (< 768px)
```
    [Wheel]
[Participants]
 [QR Code]
(Full width)
```

## 🎯 Interactive States

### Spin Button States
1. **Ready**: Cyan glow, cursor pointer
2. **Hover**: Lifts, intensifies glow
3. **Active**: Slightly pressed
4. **Spinning**: Gray, shows "SPINNING..."
5. **Disabled**: Transparent, no cursor

### List Item States
1. **Default**: Subtle background
2. **Hover**: Cyan glow, slides right
3. **Winner**: Green background, trophy icon
4. **Removing**: Fades out

### Modal States
1. **Entering**: Scales up from 0.8
2. **Present**: Full size, backdrop blur
3. **Exiting**: Fades and scales down

## 🔔 Toast Notifications

```
┌────────────────────┐
│  Alice added! ✓   │
└────────────────────┘
```

**Examples:**
- "Name added!"
- "Name already exists!"
- "Name removed!"
- "Winner history cleared!"
- "Add at least 2 participants!"

**Position**: Top-right
**Duration**: 3 seconds
**Style**: Cyan gradient

---

This visual guide helps understand how the app looks and behaves!

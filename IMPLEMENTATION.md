# HaleyOS Frontend Implementation Guide

## Overview
This document provides complete implementation details for the HaleyOS v1.0 frontend update, including all design specifications, behavior rules, and technical implementation.

## Design Specification Compliance

### ✅ Theme Implementation

All colors from the specification have been implemented:

```typescript
Primary Accent: #6A5FA7
Primary Accent Hover: #7B70C0
Primary Accent Pressed: #584E8D
Secondary Accent: #8FB6FF
Secondary Accent Dim: #6A90D6

Input Background: #121218
Input Border: #2A2A33
Input Text: #E8E8F0
Input Placeholder: #7C7C90

Text Title: #EDE9FF
Text Body: #D5D1E8
Text Subtext: #A29FC0

Google Button BG: #FFFFFF
```

### ✅ Wallpaper Implementation

**Location**: `/public/wallpaper.png`
- Milky Way diagonal orientation
- Small comet in lower-right (~3-5% of frame)
- Foreground mountains silhouette
- Darkening gradient overlay for readability

**CSS Implementation**:
```css
.wallpaper-bg {
  background-image: url('/wallpaper.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

.wallpaper-bg::before {
  background: linear-gradient(to bottom, 
    rgba(0,0,0,0) 0%,
    rgba(0,0,0,0.25) 50%,
    rgba(0,0,0,0.35) 100%
  );
}
```

### ✅ Login Screen

**File**: `src/app/page.tsx`

Features:
- Centered glass card (rgba(0,0,0,0.35))
- Card shadow: 0 0 20px rgba(0,0,0,0.35)
- Padding: 32px
- Corner radius: 20px
- Title: "HaleyOS" in #EDE9FF
- Subtitle: "Your AI Assistant" in #A29FC0
- Email/password inputs with theme styling
- Primary button with glow shadow
- Google Sign-In button (white bg, black text)

### ✅ Chat Interface

**File**: `src/app/chat/page.tsx`

#### Header
- Standard mobile layout
- Hamburger menu (left)
- Mode display (center) - "Assistant", "Regular", "Developer", or "System"
- Three-dot menu (right)
- Font color: #EDE9FF, weight: 600

#### Message Area
- Padding top: 12px
- Padding bottom: 90px (for input bar)
- Timestamp style: small, muted (#A29FC0)
- Bubble spacing: 8px
- Bubble max width: 82%
- User bubbles: Right-aligned, primary color
- Assistant bubbles: Left-aligned, glass effect

#### Input Bar
- Height: 70px
- Background: rgba(0,0,0,0.55)
- Border radius: 24px
- Padding horizontal: 14px

**Controls** (left to right):
1. **Plus Button**: Opens sheet with "Files" and "Gallery" options
2. **Text Input**: Full-width, placeholder: "Message Haley..."
3. **Reasoning Toggle**: Thinking emoji outline, monochrome, theme-aware
4. **Mic Button**: Two-step interaction (tap to start, tap to send)
5. **Live Call Button**: Audio wave icon, exclusive with mic

### ✅ Behavior Rules

#### 1. Mic & Call Exclusivity
```typescript
// In ChatInputBar.tsx
if (isInCall) return; // Mic disabled when in call
if (isRecording) return; // Call disabled when recording
```

#### 2. Response Audio
```typescript
// In chat/page.tsx
if (audioBlob) {
  speakResponse(resultContent); // Only speak if voice was used
}
```

#### 3. Two-Step Mic Interaction
```typescript
// Tap 1: Start recording
startRecording()

// Tap 2: Stop and send
stopRecording() // Automatically sends message
```

NOT Gemini-style auto-send on silence detection.

### ✅ Magic Window

**File**: `src/components/MagicWindow.tsx`

- Location: Bottom-left floating
- Size: Auto (w-96 h-96 when expanded)
- Displays: UI previews, Roblox content, code execution
- Renders above wallpaper, below system dialogs
- Minimizable and closable

### ✅ Mobile Responsiveness

**Safe Zones**:
```css
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

**Max Width Rules**:
- Input bar: Never exceed screen width - 24px
- Message area: Adaptive with max-w-4xl
- Login card: 90% width on mobile

**Viewport Meta**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover">
```

## File Structure

```
haleyos-updated/
├── public/
│   └── wallpaper.png                    # Milky Way background
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # Root layout
│   │   ├── page.tsx                     # Login page
│   │   └── chat/
│   │       └── page.tsx                 # Chat interface
│   ├── components/
│   │   ├── ChatHeader.tsx               # Header component
│   │   ├── ChatMessages.tsx             # Messages display
│   │   ├── ChatInputBar.tsx             # Input controls
│   │   ├── ThinkingToggle.tsx           # Reasoning toggle
│   │   ├── Sidebar.tsx                  # Navigation
│   │   └── MagicWindow.tsx              # Preview window
│   ├── lib/
│   │   ├── authContext.tsx              # Auth provider
│   │   ├── firebaseClient.ts            # Firebase config
│   │   └── haleyApi.ts                  # API integration
│   └── styles/
│       └── globals.css                  # Global styles
├── tailwind.config.js                   # Tailwind theme
├── package.json                         # Dependencies
├── tsconfig.json                        # TypeScript config
├── next.config.js                       # Next.js config
├── postcss.config.js                    # PostCSS config
├── firebase.json                        # Firebase hosting
├── .env.example                         # Environment template
├── .gitignore                           # Git ignore rules
└── README.md                            # Documentation
```

## Component Architecture

### State Management
- **Auth State**: Managed by AuthContext (Firebase)
- **Chat State**: Local state in chat/page.tsx
- **Messages**: Array of Message objects
- **UI State**: Sidebar open/closed, menu visibility, etc.

### Data Flow
```
User Input → ChatInputBar → chat/page.tsx → haleyApi.ts → Backend
Backend Response → chat/page.tsx → ChatMessages → Render
```

### Type System
```typescript
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    operation?: string;
    state_changed?: boolean;
    mama_invoked?: boolean;
    syscalls?: number;
    model_used?: string;
  };
}
```

## API Integration

### Backend Endpoints
- `POST /logic/process` - Send messages
- `GET /logic/system/health` - System status

### Request Format
```typescript
{
  intent: 'chat.message',
  user_id: 'user',
  payload: {
    message: string
  },
  permissions: ['user'],
  mode: 'auto'
}
```

### Response Format
```typescript
{
  status: 'success' | 'error' | 'completed',
  result: any,
  error?: string,
  model_used?: string,
  task?: string
}
```

## Voice Features

### Microphone Recording
- Uses Web MediaRecorder API
- Records in WebM format
- Two-step interaction (start → stop/send)
- Exclusive with call mode

### Text-to-Speech
- Uses Web Speech API
- Triggered only when voice input is used
- Rate: 1.0, Pitch: 1.0

### Live Call
- Real-time audio streaming (to be implemented)
- Exclusive with mic recording
- Persistent during conversation

## Styling System

### Utility Classes
```css
.haley-input        # Themed input field
.haley-button       # Primary button
.google-button      # Google Sign-In button
.glass              # Glass morphism effect
.message-bubble     # Message container
.timestamp          # Timestamp text
.safe-area-top      # Top safe area
.safe-area-bottom   # Bottom safe area
```

### Theme Colors (Tailwind)
```javascript
colors: {
  haley: {
    'primary': '#6A5FA7',
    'primary-hover': '#7B70C0',
    'secondary': '#8FB6FF',
    'text-title': '#EDE9FF',
    // ... etc
  }
}
```

## Deployment Checklist

### Pre-Deployment
- [ ] Set up Firebase project
- [ ] Configure environment variables
- [ ] Test authentication flow
- [ ] Test backend connectivity
- [ ] Verify mobile responsiveness
- [ ] Test voice features
- [ ] Validate wallpaper rendering

### Deployment Steps
1. Install dependencies: `npm install`
2. Set environment variables in `.env.local`
3. Build project: `npm run build`
4. Deploy to hosting platform
5. Verify production environment
6. Test all features in production

### Post-Deployment
- Monitor error logs
- Test on multiple devices
- Collect user feedback
- Monitor API usage
- Update documentation

## Testing

### Manual Testing
- [ ] Login with email/password
- [ ] Login with Google
- [ ] Send text messages
- [ ] Use voice recording
- [ ] Toggle deep reasoning
- [ ] Upload files
- [ ] Test sidebar navigation
- [ ] Test Magic Window
- [ ] Sign out

### Browser Compatibility
- Chrome/Edge (Chromium)
- Safari (iOS/macOS)
- Firefox
- Mobile browsers

### Device Testing
- Desktop (Windows/Mac/Linux)
- iPhone (various sizes)
- Android (various sizes)
- Tablet devices

## Future Enhancements

### Planned Features
- [ ] Real-time call implementation
- [ ] File upload to backend
- [ ] Gallery integration
- [ ] Conversation history persistence
- [ ] Export conversations
- [ ] Theme customization
- [ ] Keyboard shortcuts
- [ ] Markdown rendering in messages
- [ ] Code syntax highlighting
- [ ] Image generation preview
- [ ] Multi-language support

### Performance Optimizations
- [ ] Message virtualization for long conversations
- [ ] Image lazy loading
- [ ] Code splitting
- [ ] Service worker for offline support
- [ ] WebSocket for real-time updates

## Troubleshooting

### Common Issues

**Firebase Auth Not Working**
- Verify environment variables
- Check Firebase console settings
- Enable authentication methods

**Backend Connection Failed**
- Check NEXT_PUBLIC_BACKEND_URL
- Verify backend is running
- Check CORS settings

**Voice Recording Not Working**
- Check browser permissions
- Verify HTTPS connection
- Test microphone access

**Styling Issues**
- Clear browser cache
- Rebuild with `npm run build`
- Check Tailwind configuration

## Support

For issues or questions:
- Check documentation
- Review error logs
- Contact HaleyOS team

---

**Implementation Status**: ✅ Complete
**Version**: 1.0.0
**Last Updated**: 2025-12-09

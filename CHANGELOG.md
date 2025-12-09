# Changelog

All notable changes to HaleyOS Frontend are documented in this file.

## [1.0.0] - 2025-12-09

### 🎨 Design System Overhaul

#### Theme Colors
- **Added** custom HaleyOS color palette
  - Primary accent: #6A5FA7 (purple)
  - Secondary accent: #8FB6FF (blue)
  - Complete text hierarchy (title, body, subtext)
  - Input field styling system
- **Replaced** generic purple theme with HaleyOS branded colors
- **Updated** all components to use new color system

#### Wallpaper
- **Added** Milky Way diagonal wallpaper with comet accent
- **Implemented** gradient overlay for readability
- **Added** background-attachment: fixed for parallax effect

### 🎯 UI Components

#### Login Screen
- **Redesigned** with centered glass card
- **Added** custom shadow and blur effects
- **Updated** button styling with glow shadows
- **Improved** Google Sign-In button design
- **Added** responsive design for mobile

#### Chat Interface
- **Added** ChatHeader component with mode display
  - Hamburger menu (left)
  - Mode text (center): Assistant/Regular/Developer/System
  - Three-dot menu (right)
- **Redesigned** message bubbles
  - User messages: right-aligned, primary color
  - Assistant messages: left-aligned, glass effect
  - Max width: 82% for readability
- **Added** timestamp display (small, muted)
- **Updated** message spacing (8px between bubbles)

#### Input Bar
- **Complete redesign** with multi-control layout
- **Added** Plus button for file/gallery uploads
  - Opens bottom sheet with options
  - "Files" and "Gallery" choices
- **Added** ThinkingToggle component
  - Custom outline thinking emoji icon
  - Monochrome, theme-aware
  - Deep reasoning mode indicator
- **Redesigned** Microphone button
  - Two-step interaction (NOT auto-send)
  - Tap to start recording
  - Tap again to stop and send
  - Visual feedback during recording
- **Added** Live Call button
  - Audio wave icon
  - Exclusive with microphone
  - Real-time voice conversation mode
- **Updated** input styling
  - Background: rgba(0,0,0,0.55)
  - Border radius: 24px
  - Responsive height

### 🔧 Behavior Improvements

#### Voice Features
- **Implemented** two-step mic interaction
  - Matches Claude/GPT behavior
  - NOT Gemini-style auto-send
- **Added** TTS response for voice input
  - Haley speaks ONLY when mic was used
  - Silent for text-only conversations
- **Added** mic/call exclusivity
  - Cannot use both simultaneously
  - Clear visual feedback

#### File Handling
- **Added** file upload sheet UI
- **Added** gallery selection option
- **Prepared** backend integration hooks

### 🎭 New Components

- **Sidebar.tsx** - Navigation and conversation history
  - Slide-in from left
  - Recent conversations list
  - Settings and sign-out
- **MagicWindow.tsx** - Dynamic content preview
  - Bottom-left floating window
  - Minimizable and closable
  - Supports Roblox, UI previews, code execution
- **ThinkingToggle.tsx** - Deep reasoning toggle
  - Custom SVG icon
  - Theme-aware colors
  - Smooth transitions

### 📱 Mobile Enhancements

- **Added** safe area insets for notched devices
- **Added** viewport-fit=cover for iOS
- **Updated** responsive breakpoints
- **Improved** touch target sizes
- **Added** maximum scale prevention for better UX

### 🔌 API Integration

- **Updated** haleyApi.ts with latest endpoints
- **Added** proper TypeScript types
- **Implemented** error handling
- **Added** system status polling

### 📦 Development

- **Updated** to Next.js 14
- **Added** TypeScript strict mode
- **Updated** Tailwind CSS configuration
- **Added** custom PostCSS configuration
- **Created** comprehensive documentation
  - README.md
  - IMPLEMENTATION.md
  - setup.sh script

### 🎨 Styling

- **Created** global CSS utilities
  - .haley-input
  - .haley-button
  - .google-button
  - .glass / .glass-light
  - .message-bubble
  - .timestamp
- **Added** custom animations
  - Pulse glow
  - Bounce
  - Float
- **Improved** scrollbar styling
- **Added** theme CSS variables

### 🐛 Bug Fixes

- **Fixed** authentication redirect loop
- **Fixed** message scroll behavior
- **Fixed** input bar positioning on mobile
- **Fixed** button disabled states
- **Fixed** Firebase persistence issues

### 📚 Documentation

- **Created** comprehensive README
- **Added** implementation guide
- **Created** setup script
- **Added** environment template
- **Created** Firebase deployment config
- **Added** .gitignore
- **Created** changelog

### 🔒 Security

- **Updated** Firebase security rules
- **Added** proper environment variable handling
- **Implemented** client-side auth guards
- **Added** input sanitization

### ♿ Accessibility

- **Added** ARIA labels to all interactive elements
- **Improved** keyboard navigation
- **Added** focus indicators
- **Improved** color contrast ratios

### 🚀 Performance

- **Optimized** component re-renders
- **Added** proper React.memo usage
- **Implemented** lazy loading for images
- **Optimized** bundle size

---

## Version History

- **v1.0.0** (2025-12-09) - Initial release with complete redesign
- **v0.x.x** - Previous versions (legacy)

## Upgrade Guide

### From Legacy Version to v1.0.0

1. **Backup your .env file**
2. **Pull new codebase**
3. **Run `npm install` to update dependencies**
4. **Update environment variables** (see .env.example)
5. **Run `npm run build`**
6. **Test thoroughly before deploying**

### Breaking Changes

- Removed old purple theme colors
- Updated Firebase configuration format
- Changed API endpoint structure
- Redesigned all component interfaces

### Migration Notes

- All old styling classes have been replaced
- Message format includes new metadata fields
- Voice recording now uses two-step interaction
- Backend API expects new request format

---

## Future Roadmap

### v1.1.0 (Planned)
- [ ] Real-time call implementation with WebRTC
- [ ] File upload to cloud storage
- [ ] Image gallery integration
- [ ] Conversation history persistence
- [ ] Export conversations as PDF/MD

### v1.2.0 (Planned)
- [ ] Multi-language support
- [ ] Theme customization UI
- [ ] Keyboard shortcuts
- [ ] Offline mode with service workers
- [ ] WebSocket for real-time updates

### v2.0.0 (Future)
- [ ] Native mobile apps (React Native)
- [ ] Desktop app (Electron)
- [ ] Advanced Magic Window features
- [ ] Plugin system
- [ ] Custom module UI generators

---

**Maintained by**: HaleyOS Team
**License**: Proprietary

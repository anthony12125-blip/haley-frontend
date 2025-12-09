# HaleyOS Frontend Testing Guide

## Testing Checklist

### 🔐 Authentication Testing

#### Email/Password Authentication
- [ ] Sign up with new email
- [ ] Sign in with existing credentials
- [ ] Error handling for invalid credentials
- [ ] Error handling for weak passwords
- [ ] Email validation
- [ ] Password visibility toggle
- [ ] Form submission on Enter key
- [ ] Loading states during authentication
- [ ] Redirect after successful login

#### Google Authentication
- [ ] Google Sign-In popup opens
- [ ] Successful authentication redirects to chat
- [ ] Error handling for popup blocked
- [ ] Error handling for cancelled login
- [ ] Proper session persistence

#### Session Management
- [ ] User stays logged in after page refresh
- [ ] Sign out functionality works
- [ ] Redirect to login when session expires
- [ ] Protected routes require authentication

---

### 💬 Chat Interface Testing

#### Message Sending
- [ ] Send text message with Enter key
- [ ] Send text message with button click
- [ ] Prevent sending empty messages
- [ ] Loading indicator while processing
- [ ] Message appears in chat immediately
- [ ] Response received and displayed
- [ ] Proper error handling for failed requests
- [ ] Message ordering is correct
- [ ] Timestamps display correctly

#### Message Display
- [ ] User messages align right (purple background)
- [ ] Assistant messages align left (glass effect)
- [ ] System messages display differently
- [ ] Max width is 82% of container
- [ ] Messages wrap properly for long text
- [ ] Proper spacing between messages (8px)
- [ ] Timestamps are muted and small
- [ ] Auto-scroll to bottom on new messages
- [ ] Messages persist during session

#### Header
- [ ] Hamburger menu opens sidebar
- [ ] Mode display shows current mode
- [ ] Three-dot menu opens (if implemented)
- [ ] System status badge updates
- [ ] Header is sticky on scroll

---

### 🎤 Voice Features Testing

#### Microphone Recording
- [ ] Mic button is visible and clickable
- [ ] First tap starts recording
- [ ] Visual feedback during recording (red square)
- [ ] Second tap stops and sends
- [ ] Audio permission request appears
- [ ] Recording works in HTTPS only
- [ ] Cancel recording functionality
- [ ] Mic disabled when call is active
- [ ] Browser compatibility (Chrome, Firefox, Safari)

#### Text-to-Speech
- [ ] Haley speaks response when voice input used
- [ ] No TTS for text-only conversations
- [ ] TTS can be interrupted
- [ ] Speech rate is natural (1.0)
- [ ] Volume is appropriate
- [ ] Works across different browsers

#### Live Call
- [ ] Call button is visible and clickable
- [ ] Call button exclusive with mic
- [ ] Visual feedback when call is active
- [ ] Call can be ended by tapping again
- [ ] Proper audio stream handling
- [ ] Call disabled when recording

---

### 📎 File Upload Testing

#### Plus Button
- [ ] Plus button opens upload sheet
- [ ] Sheet displays "Files" and "Gallery" options
- [ ] Sheet can be closed by clicking outside
- [ ] Sheet closes after selection

#### File Upload
- [ ] File picker opens when "Files" selected
- [ ] Multiple files can be selected
- [ ] File size validation
- [ ] File type validation
- [ ] Upload progress indication
- [ ] Error handling for failed uploads
- [ ] File preview in chat (if implemented)

#### Gallery
- [ ] Gallery picker opens when selected
- [ ] Images can be selected
- [ ] Selected images display properly
- [ ] Image compression (if implemented)

---

### 🧠 Deep Reasoning Testing

#### Thinking Toggle
- [ ] Toggle button is visible
- [ ] Icon changes when toggled
- [ ] Color changes to secondary accent when active
- [ ] State persists during conversation
- [ ] Tooltip displays on hover
- [ ] Toggle affects backend request
- [ ] Visual feedback is immediate

---

### 🎨 UI/UX Testing

#### Sidebar
- [ ] Opens from hamburger menu
- [ ] Slides in smoothly from left
- [ ] Overlay darkens background
- [ ] Closes when clicking overlay
- [ ] Closes when clicking X button
- [ ] Conversation history displays
- [ ] New Chat button works
- [ ] Settings button accessible
- [ ] Sign Out button works
- [ ] Delete conversation works

#### Magic Window
- [ ] Appears when content is available
- [ ] Bottom-left positioning correct
- [ ] Can be minimized
- [ ] Can be closed
- [ ] Expands/collapses smoothly
- [ ] Content renders properly
- [ ] Roblox preview displays (if implemented)
- [ ] UI preview displays
- [ ] Code execution displays
- [ ] Doesn't interfere with other UI elements

#### Responsive Design
- [ ] Desktop layout (1920x1080)
- [ ] Laptop layout (1366x768)
- [ ] Tablet layout (768x1024)
- [ ] Mobile portrait (375x667)
- [ ] Mobile landscape (667x375)
- [ ] Safe area insets on iPhone X+
- [ ] No horizontal scroll
- [ ] Touch targets minimum 44x44px
- [ ] Text remains readable at all sizes

---

### 🎨 Theme Testing

#### Colors
- [ ] Primary accent (#6A5FA7) displays correctly
- [ ] Secondary accent (#8FB6FF) displays correctly
- [ ] Text hierarchy is clear (title, body, subtext)
- [ ] Input fields use correct colors
- [ ] Buttons have proper colors
- [ ] Hover states work
- [ ] Active states work
- [ ] Disabled states are visible

#### Wallpaper
- [ ] Milky Way image loads
- [ ] Image covers entire background
- [ ] Image is fixed (doesn't scroll)
- [ ] Gradient overlay is visible
- [ ] Comet is visible in lower-right
- [ ] Text remains readable over wallpaper
- [ ] Performance is acceptable

#### Effects
- [ ] Glass morphism blur is visible
- [ ] Button shadows display
- [ ] Glow effects on hover
- [ ] Transitions are smooth
- [ ] No visual glitches
- [ ] Scrollbar is styled

---

### ⚡ Performance Testing

#### Load Times
- [ ] Initial page load < 3 seconds
- [ ] Time to interactive < 5 seconds
- [ ] Images lazy load
- [ ] Code splitting works
- [ ] Bundle size is optimized

#### Runtime Performance
- [ ] Smooth scrolling (60fps)
- [ ] No lag when typing
- [ ] Smooth animations
- [ ] No memory leaks
- [ ] Efficient re-renders
- [ ] Message virtualization (for long chats)

#### Network
- [ ] Handles slow connections gracefully
- [ ] Offline detection
- [ ] Request retries on failure
- [ ] Proper loading indicators
- [ ] Error messages are clear

---

### 🌐 Browser Testing

#### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

#### Mobile Browsers
- [ ] Safari iOS (latest)
- [ ] Chrome Android (latest)
- [ ] Firefox Mobile
- [ ] Samsung Internet

#### PWA Features
- [ ] Can be installed as PWA
- [ ] App manifest correct
- [ ] Service worker registers
- [ ] Offline functionality
- [ ] Push notifications (if implemented)

---

### ♿ Accessibility Testing

#### Keyboard Navigation
- [ ] Tab navigation works
- [ ] Focus indicators visible
- [ ] Enter submits forms
- [ ] Escape closes modals
- [ ] All interactive elements reachable
- [ ] Skip links available

#### Screen Readers
- [ ] ARIA labels present
- [ ] Roles are semantic
- [ ] Alt text on images
- [ ] Form labels associated
- [ ] Error messages announced
- [ ] Status updates announced

#### Visual
- [ ] Sufficient color contrast (WCAG AA)
- [ ] Text resizing works (up to 200%)
- [ ] No color-only indicators
- [ ] Focus is visible
- [ ] Animations can be reduced

---

### 🔒 Security Testing

#### Authentication
- [ ] Passwords are not stored in plain text
- [ ] Session tokens are secure
- [ ] HTTPS enforced
- [ ] XSS prevention
- [ ] CSRF protection

#### Data Handling
- [ ] User data is encrypted
- [ ] API keys not exposed
- [ ] Environment variables secure
- [ ] Input sanitization
- [ ] SQL injection prevention

---

### 📱 Device Testing

#### iOS Devices
- [ ] iPhone 15 Pro Max
- [ ] iPhone 15
- [ ] iPhone SE (3rd gen)
- [ ] iPad Pro
- [ ] iPad Air

#### Android Devices
- [ ] Samsung Galaxy S24
- [ ] Google Pixel 8
- [ ] OnePlus 12
- [ ] Tablet (various sizes)

---

### 🐛 Edge Cases

#### Error Scenarios
- [ ] Network disconnection
- [ ] Server timeout
- [ ] Invalid API responses
- [ ] Corrupted data
- [ ] Rate limiting
- [ ] Firebase quota exceeded

#### User Scenarios
- [ ] Very long messages (10000+ chars)
- [ ] Rapid message sending
- [ ] Conversation with 1000+ messages
- [ ] Multiple tabs open
- [ ] Browser back/forward
- [ ] Page refresh during operation

---

## Automated Testing (Future)

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Visual Regression Tests
```bash
npm run test:visual
```

---

## Bug Reporting Template

When reporting bugs, include:

1. **Environment**
   - Browser and version
   - Device and OS
   - Screen size

2. **Steps to Reproduce**
   - Detailed steps
   - Expected behavior
   - Actual behavior

3. **Screenshots/Videos**
   - Visual evidence
   - Console errors
   - Network logs

4. **Severity**
   - Critical / High / Medium / Low

---

## Performance Metrics

Target metrics:
- **First Contentful Paint**: < 1.8s
- **Time to Interactive**: < 3.9s
- **Speed Index**: < 3.4s
- **Total Blocking Time**: < 200ms
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

Use Lighthouse for testing:
```bash
npm run lighthouse
```

---

**Last Updated**: 2025-12-09
**Version**: 1.0.0

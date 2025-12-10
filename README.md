# HaleyOS Frontend - Rebuilt

A pixel-perfect, production-ready frontend for HaleyOS with multi-LLM support, supreme court mode, and advanced UI features.

## ✨ Features

### 🤖 AI Modes
- **Single AI**: Fast responses from one model
- **Multi AI**: Multiple models collaborate
- **Supreme Court**: All AIs debate to reach consensus

### 🎨 UI Components
- **AI Switcher**: Top-center bubble with long-press menu
- **Magic Window**: Doctor Strange-style portal animations
- **Research Toggle**: Microscope icon for deep research
- **Logic Engine Toggle**: Puzzle piece icon for advanced reasoning
- **Supreme Court Indicator**: Shows active models during debates

### 🌌 Design
- Space-themed dark background with animated stars
- Shooting star effects
- Glass morphism panels
- Smooth 60fps animations
- Responsive design (phone, tablet, desktop)

### 💬 Chat Features
- Message actions: Copy, Read Aloud, Share
- More menu: Retry, Branch conversation
- Voice input with recording indicator
- File upload support
- Auto-scrolling messages
- Typing indicators

### 📱 Mobile Support
- Safe area insets for iOS
- Keyboard gap fixes
- Touch-optimized controls
- Collapsible sidebar
- Device detection

## 🚀 Getting Started

### Prerequisites
```bash
Node.js 18+ 
npm or yarn
```

### Installation
```bash
cd haley-rebuilt
npm install
```

### Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

### Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
npm start
```

## 📁 Project Structure

```
haley-rebuilt/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with auth
│   │   ├── page.tsx            # Landing page
│   │   └── chat/
│   │       └── page.tsx        # Main chat interface
│   ├── components/
│   │   ├── AISwitcher.tsx      # AI mode selector
│   │   ├── ChatHeader.tsx      # Header with status
│   │   ├── ChatMessages.tsx    # Message list
│   │   ├── ChatInputBar.tsx    # Input with controls
│   │   ├── LogicEngineToggle.tsx
│   │   ├── MagicWindowContainer.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ResearchToggle.tsx
│   │   ├── Sidebar.tsx
│   │   └── SupremeCourtIndicator.tsx
│   ├── hooks/
│   │   ├── useDeviceDetection.ts
│   │   └── useLongPress.ts
│   ├── lib/
│   │   ├── authContext.tsx     # Firebase auth
│   │   ├── firebaseClient.ts   # Firebase config
│   │   └── haleyApi.ts         # Backend API
│   ├── styles/
│   │   └── globals.css         # All styles
│   └── types/
│       └── index.ts            # TypeScript types
├── public/
│   └── wallpaper.png           # Space background
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## 🎨 Theme Customization

Colors are defined in `globals.css`:
```css
:root {
  --primary: #4fb4ff;
  --accent: #7fd4ff;
  --panel-dark: #111418;
  --text-primary: #e5f2ff;
  /* ... */
}
```

## 🔧 API Integration

The frontend connects to HaleyOS backend via `haleyApi.ts`:

```typescript
// Send message
await sendMessage(text);

// Get system status
await getSystemStatus();
```

Endpoints:
- `POST /logic/process` - Send chat messages
- `GET /logic/system/health` - System status

## 📱 Device Support

Automatically detects and adapts to:
- **Phone** (≤768px): Single column, collapsible sidebar
- **Tablet** (≤1024px): Optimized touch controls
- **Desktop** (>1024px): Full layout with persistent sidebar

## ✨ Animations

### Portal Animation (Magic Window)
```css
@keyframes portalOpen {
  0% { transform: scale(0) rotate(0deg); }
  50% { transform: scale(1.1) rotate(180deg); }
  100% { transform: scale(1) rotate(360deg); }
}
```

### Shooting Stars
Randomly positioned with staggered delays

### Typing Indicator
Three dots with bounce animation

## 🔐 Authentication

Firebase Authentication with Google Sign-In:
- Protected routes
- Session management
- Auto-redirect on login/logout

## 🎯 Key Implementation Details

### Long Press for AI Switcher
```typescript
const longPressHandlers = useLongPress({
  onLongPress: () => setShowMenu(true),
  onClick: () => cycleMode(),
  duration: 500,
});
```

### Magic Window Content Types
- Visualization
- Code
- Image
- Data

### Supreme Court Mode
When enabled:
- Multiple LLMs process request
- Results aggregated
- Consensus displayed
- Model badges shown

## 📊 Performance

- **60fps animations**: GPU-accelerated transforms
- **Optimized re-renders**: React memoization
- **Lazy loading**: Code splitting by route
- **Image optimization**: Next.js image component

## 🐛 Troubleshooting

### Keyboard covers input on iOS
✅ Fixed with safe area insets and sticky positioning

### Background stretches on mobile
✅ Fixed with `background-size: cover` and proper viewport

### Messages don't scroll
✅ Auto-scroll with `scrollIntoView` on new messages

## 🚢 Deployment

### Vercel (Recommended)
```bash
vercel
```

### Docker
```bash
docker build -t haleyos-frontend .
docker run -p 3000:3000 haleyos-frontend
```

### Firebase Hosting
```bash
npm run build
firebase deploy
```

## 📝 License

Proprietary - HaleyOS Project

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

## 📞 Support

- Backend API: Ensure HaleyOS backend is running
- Firebase: Configure Firebase project correctly
- Environment: Check all `.env.local` variables

---

Built with ❤️ using Next.js, React, TypeScript, and Tailwind CSS

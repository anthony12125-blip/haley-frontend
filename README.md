# HaleyOS Frontend v1.0

A beautiful, feature-rich frontend for HaleyOS AI Assistant with custom theming, voice input, and Magic Window capabilities.

## 🎨 Design Features

### Theme
- **Primary Accent**: `#6A5FA7` (Purple)
- **Secondary Accent**: `#8FB6FF` (Blue)
- **Milky Way Wallpaper**: Diagonal orientation with comet accent
- **Glass Morphism**: Backdrop blur effects throughout
- **Dark Mode Optimized**: Perfect for night usage

### Key UI Components

#### Login Screen
- Centered glass card with subtle shadow
- Email/password authentication
- Google Sign-In integration
- Beautiful wallpaper background with gradient overlay

#### Chat Interface
- **Header**: Mode display (Assistant/Regular/Developer/System)
- **Messages**: User bubbles (right) and assistant bubbles (left)
- **Input Bar**: Multi-control bar with:
  - Plus button (file/gallery upload)
  - Thinking toggle (deep reasoning mode)
  - Microphone button (tap to start, tap to send)
  - Live call button (real-time voice with Haley)
- **Magic Window**: Floating preview window for dynamic content

### Behavior Rules

#### Mic & Call Exclusivity
- Mic and Call buttons are mutually exclusive
- When mic is recording, call button is disabled
- When in call, mic button is disabled

#### Audio Response
- Haley speaks responses ONLY when mic-record-send flow is used
- Call mode always uses live audio
- Text input does not trigger audio response

## 📦 Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase credentials

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## 🔧 Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

## 🏗️ Project Structure

```
haleyos-updated/
├── public/
│   └── wallpaper.png          # Milky Way background
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with AuthProvider
│   │   ├── page.tsx           # Login page
│   │   └── chat/
│   │       └── page.tsx       # Main chat interface
│   ├── components/
│   │   ├── ChatHeader.tsx     # Header with mode display
│   │   ├── ChatMessages.tsx   # Message history display
│   │   ├── ChatInputBar.tsx   # Input controls
│   │   ├── ThinkingToggle.tsx # Deep reasoning toggle
│   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   └── MagicWindow.tsx    # Dynamic preview window
│   ├── lib/
│   │   ├── authContext.tsx    # Firebase authentication
│   │   ├── firebaseClient.ts  # Firebase configuration
│   │   └── haleyApi.ts        # Backend API integration
│   └── styles/
│       └── globals.css        # Global styles and theme
├── tailwind.config.js         # Tailwind with custom theme
├── package.json
└── README.md
```

## 🎯 Key Features

### Authentication
- Email/password sign-in and sign-up
- Google OAuth integration
- Persistent sessions with Firebase

### Chat Interface
- Real-time message streaming
- System status display
- Mode switching (Assistant/Regular/Developer/System)
- Deep reasoning toggle for complex queries

### Voice Features
- **Tap-to-record**: Two-step mic interaction (tap to start, tap to send)
- **Text-to-Speech**: Haley responds vocally when voice input is used
- **Live Call**: Real-time voice conversation mode

### File Handling
- Upload files via plus button
- Gallery image selection
- Multi-file support

### Magic Window
- Floating preview window
- Roblox integration preview
- UI component previews
- Code execution display
- Minimizable and closable

## 🎨 Theme Customization

All colors are defined in:
- `tailwind.config.js` - Tailwind theme extension
- `src/styles/globals.css` - CSS variables and utilities

### Color Palette
```css
--haley-primary: #6A5FA7
--haley-primary-hover: #7B70C0
--haley-primary-pressed: #584E8D
--haley-secondary: #8FB6FF
--haley-secondary-dim: #6A90D6
--haley-input-bg: #121218
--haley-input-border: #2A2A33
--haley-text-title: #EDE9FF
--haley-text-body: #D5D1E8
--haley-text-subtext: #A29FC0
```

## 📱 Mobile Responsiveness

- Safe area insets for notched devices
- iOS viewport-fit support
- Adaptive input bar sizing
- Touch-optimized controls
- Maximum width constraints for readability

## 🔌 Backend Integration

Connects to HaleyOS Logic Engine via REST API:
- `/logic/process` - Send messages
- `/logic/system/health` - System status
- Automatic LLM routing via Baby Haley
- Multi-model support (Claude, GPT, Gemini, etc.)

## 🚀 Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Docker
```bash
docker build -t haleyos-frontend .
docker run -p 3000:3000 haleyos-frontend
```

## 🛠️ Development

```bash
# Run with hot reload
npm run dev

# Type checking
npm run lint

# Build production
npm run build
```

## 📄 License

Proprietary - HaleyOS Project

## 🤝 Contributing

This is a private project. For access or contributions, contact the HaleyOS team.

---

**HaleyOS Frontend v1.0** - Built with Next.js 14, React 18, TypeScript, and Tailwind CSS

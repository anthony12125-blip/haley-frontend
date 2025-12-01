# HaleyOS Frontend v2.0

Complete Next.js 14 frontend for HaleyOS AI Assistant with Magic Window canvas.

## 🌟 Features

### Authentication
- ✅ Firebase Auth (Google + Email/Password)
- ✅ Local persistence
- ✅ Protected routes
- ✅ Auto-redirect

### Chat Interface
- ✅ Real-time messaging
- ✅ Enter to send / Shift+Enter for newline
- ✅ Message history
- ✅ Timestamps

### Magic Window Canvas
- ✅ Full-screen animated background
- ✅ 3-depth parallax stars
- ✅ Drifting fog layer
- ✅ Comet streaks
- ✅ Idle shimmer
- ✅ Purple/pink nebula gradients
- ✅ 60 FPS capped
- ✅ Mobile resolution scaling (0.7x)

### Conjure Animations (10 types)
1. swirl_energy
2. spark_burst
3. light_ripple
4. comet_trail
5. soft_pulse
6. portal_open
7. nebula_flash
8. glyph_spin
9. fracture_light
10. wave_expansion

### Voice & Files
- ✅ Microphone (2-tap: record → stop & send)
- ✅ File upload (images + ZIP)
- ✅ Mobile photo picker
- ✅ Desktop file explorer

### Responsive Design
- **Mobile**: Full-screen chat, Magic Window as background
- **Desktop**: Sidebar + chat + Magic Window

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Your `.env.local` should have:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA0nz3gs5iUIVYZrGjGNC-QFsBujMYB04
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=haley-front-end.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=haley-front-end
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=haley-front-end.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=415166601162
NEXT_PUBLIC_FIREBASE_APP_ID=1:415166601162:web:2964033f8f567b0e92133
NEXT_PUBLIC_HALEY_URL=https://logic-engine-core-409495160162.us-central1.run.app
```

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## 📦 Project Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout with MagicWindow
│   ├── page.tsx             # Login page
│   └── chat/
│       └── page.tsx         # Chat interface
├── components/
│   ├── ChatInput.tsx        # Input box + mic + upload
│   ├── MessageBubble.tsx    # Message display
│   ├── MicButton.tsx        # 2-tap voice recording
│   ├── PlusUploadButton.tsx # File upload
│   ├── SidebarHistory.tsx   # Conversation history
│   ├── MagicWindow.tsx      # Canvas background
│   └── ConjureAnimation.tsx # Overlay animations
├── lib/
│   ├── firebaseClient.ts    # Firebase initialization
│   ├── authContext.tsx      # Auth provider
│   └── haleyApi.ts          # Backend API client
└── styles/
    └── globals.css          # Global styles
```

## 🔌 Backend Integration

Frontend sends to: `POST /talk`

```typescript
{
  message: string,
  attachments?: File[],
  firebaseUser: {
    uid: string,
    email: string | null,
    displayName: string | null
  }
}
```

Response expected:

```typescript
{
  reply: string,
  meta?: {
    timestamp?: string,
    tokens_used?: number
  },
  magic_window?: {
    animation?: string,  // One of the 10 animations
    content?: any        // Content to display
  }
}
```

## 🎨 Theme Colors

```css
--haley-primary: #C084FC
--haley-secondary: #A78BFA
--haley-accent: #F0ABFC
```

## 🛠️ Build for Production

```bash
npm run build
npm start
```

## 🚀 Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 📱 Features by Platform

### Mobile
- Full-screen chat
- Magic Window as permanent background
- Slide-up conjure animations
- Touch-optimized controls
- Photo picker

### Desktop
- Sidebar with conversation history
- Wide chat area
- Magic Window always visible
- File explorer
- Keyboard shortcuts

## 🎯 Environment Variables

All required vars:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_HALEY_URL
```

## 📝 Notes

- Firebase config is already set for `haley-front-end` project
- Backend URL points to your Cloud Run service
- Magic Window runs at 60 FPS max
- Mobile uses 0.7x resolution scale for performance
- All animations are CSS/Canvas based (no heavy libraries)

## 🐛 Troubleshooting

**Firebase Auth not working:**
- Check Firebase Console → Authentication is enabled
- Verify Google sign-in is configured

**Magic Window not rendering:**
- Check browser console for canvas errors
- Ensure WebGL is enabled

**Backend connection fails:**
- Verify `NEXT_PUBLIC_HALEY_URL` is correct
- Check CORS is enabled on backend

## 🎉 Ready to Deploy!

Zero placeholders, zero TODOs. Everything is complete and production-ready.

---

**Built for HaleyOS** ✨

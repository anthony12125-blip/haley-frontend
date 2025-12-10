# 🚀 HaleyOS Frontend - Quick Start Guide

## Installation (2 minutes)

```bash
cd haley-frontend-rebuilt
npm install
```

## Configuration (1 minute)

Copy `.env.example` to `.env.local` and fill in:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

## Run (30 seconds)

```bash
npm run dev
```

Visit: http://localhost:3000

## Build for Production

```bash
npm run build
npm start
```

## 🎯 What You Get

### 🤖 Three AI Modes
1. **Single AI** - Tap the top bubble, select single mode
2. **Multi AI** - Multiple models collaborate
3. **Supreme Court** - All AIs debate (shows colorful indicator)

### ✨ Key Features
- **Long press** the top AI bubble for mode menu
- **Tap** the AI bubble to cycle modes quickly
- **Research mode** toggle (microscope icon)
- **Logic Engine** toggle (puzzle piece icon)
- **Voice input** - Click mic, record, auto-send
- **File upload** - Click paperclip
- **Magic Window** - Appears bottom-left with portal animation

### 💬 Message Actions
Hover over any message to see:
- Copy button
- Read aloud button
- Share button
- More menu (Retry, Branch)

### 📱 Mobile
- Swipe from left for sidebar
- Auto-adjusts for keyboard
- Touch-optimized controls
- Safe area insets work

## 🎨 Customization

### Change Colors
Edit `src/styles/globals.css`:
```css
:root {
  --primary: #4fb4ff;  /* Change this */
  --accent: #7fd4ff;   /* And this */
}
```

### Change Theme
Edit `src/styles/globals.css` background gradient

### Add New AI Models
Edit `src/components/AISwitcher.tsx`:
```typescript
const AI_MODES = [
  // Add your mode here
];
```

## 🐛 Troubleshooting

### Port 3000 in use?
```bash
npm run dev -- -p 3001
```

### Firebase errors?
- Check `.env.local` has correct values
- Verify Firebase project is set up
- Enable Google auth in Firebase console

### Backend connection failed?
- Ensure backend is running on port 8080
- Check NEXT_PUBLIC_BACKEND_URL in `.env.local`
- CORS must be enabled on backend

### Styles not loading?
```bash
rm -rf .next
npm run dev
```

## 📂 File Structure

```
haley-frontend-rebuilt/
├── src/
│   ├── app/              # Next.js pages
│   ├── components/       # React components
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Auth & API
│   ├── styles/          # CSS
│   └── types/           # TypeScript
├── public/              # Static files
├── package.json         # Dependencies
└── README.md           # Full docs
```

## 🎯 Testing Checklist

- [ ] Sign in with Google works
- [ ] Messages send and receive
- [ ] AI switcher changes modes
- [ ] Long press opens mode menu
- [ ] Research toggle works
- [ ] Logic Engine toggle works
- [ ] Voice recording works
- [ ] File upload opens picker
- [ ] Magic Window appears
- [ ] Sidebar opens/closes
- [ ] Settings menu opens
- [ ] Mobile responsive
- [ ] Animations smooth

## 🚢 Deploy

### Vercel
```bash
vercel
```

### Firebase
```bash
npm run build
firebase deploy
```

### Docker
```bash
docker build -t haleyos .
docker run -p 3000:3000 haleyos
```

## 📞 Need Help?

- Check `README.md` for full documentation
- Check `IMPLEMENTATION_SUMMARY.md` for technical details
- Review code comments in components
- Backend must be running for full functionality

---

**That's it! You're ready to use HaleyOS.** 🎉

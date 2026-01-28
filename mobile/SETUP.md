# HaleyOS Mobile App

Capacitor wrapper for the HaleyOS web app (`https://haley-front-end.web.app`).

## Quick Start

```bash
cd mobile
npm install
npx cap sync
```

### iOS (requires macOS + Xcode)
```bash
npx cap add ios      # First time only
npx cap sync ios
npx cap open ios     # Opens in Xcode
```

In Xcode:
1. Select your team under Signing & Capabilities
2. Set bundle ID to `com.haleyos.app`
3. Build & Run on device/simulator

### Android (requires Android Studio)
```bash
npx cap add android      # First time only
npx cap sync android
npx cap open android     # Opens in Android Studio
```

In Android Studio:
1. Let Gradle sync
2. Build & Run on device/emulator

## Configuration

- **App URL**: `https://haley-front-end.web.app` (set in `capacitor.config.ts`)
- **Bundle ID**: `com.haleyos.app`
- **Status bar**: Light content, transparent overlay
- **Splash**: Black background with "HaleyOS" text
- **Safe areas**: Handled via `viewport-fit=cover` + CSS `env(safe-area-inset-*)`

## Adding App Icons

Place your 1024x1024 app icon in:
- **iOS**: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- **Android**: Use Android Studio's Image Asset tool to generate all densities

## Updating

After any config changes:
```bash
npx cap sync
```

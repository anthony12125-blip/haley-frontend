/**
 * HaleyOS Native Initialization
 * Configures Capacitor plugins on app startup
 */
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

export async function initNativeApp() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Status bar: transparent overlay for full-screen experience
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#00000000' });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setOverlaysWebView({ overlay: true });
    }

    // Keyboard: resize body to avoid content being hidden
    await Keyboard.setResizeMode({ mode: KeyboardResize.Body });

    // Hide splash screen after app is ready
    await SplashScreen.hide({ fadeOutDuration: 500 });

    console.log('[HaleyOS] Native platform initialized:', Capacitor.getPlatform());
  } catch (err) {
    console.error('[HaleyOS] Native init error:', err);
  }
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initNativeApp);
}

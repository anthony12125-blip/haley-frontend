import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/authContext';
import { ThemeProvider } from '@/lib/themeContext';
import { VibePackProvider } from '@/contexts/VibePackContext';
import { AIClipboardProvider } from '@/contexts/AIClipboardContext';
import { ProcessProvider } from '@/providers/ProcessProvider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Haley OS - Multi-LLM AI Assistant',
  description: 'Haley OS: Advanced AI assistant with multi-model support and supreme court mode',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#111418" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="prevent-select">
        <ThemeProvider>
          <VibePackProvider>
            <AIClipboardProvider>
              <AuthProvider>
                <ProcessProvider>
                  {children}
                </ProcessProvider>
              </AuthProvider>
            </AIClipboardProvider>
          </VibePackProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

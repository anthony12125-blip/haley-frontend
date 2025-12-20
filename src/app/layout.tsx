import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/authContext';
import { ThemeProvider } from '@/lib/themeContext';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Haley OS - Multi-LLM AI Assistant',
  description: 'Haley OS: Advanced AI assistant with multi-model support and supreme court mode',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover',
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
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

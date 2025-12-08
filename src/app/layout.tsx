import type { Metadata } from 'next'
import '../styles/globals.css'
import MagicWindow from '@/components/MagicWindow'
import { AuthProvider } from '@/lib/authContext'

export const metadata: Metadata = {
  title: 'HaleyOS - AI Assistant',
  description: 'Your personal AI assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          <MagicWindow />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

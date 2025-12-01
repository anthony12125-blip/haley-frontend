import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import MagicWindow from '@/components/MagicWindow'
import { AuthProvider } from '@/lib/authContext'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className}>
        <AuthProvider>
          <MagicWindow />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

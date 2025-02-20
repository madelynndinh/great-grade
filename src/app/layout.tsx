import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Sidebar from '@/components/Sidebar'
import TopNav from '@/components/TopNav'

// Configure Inter font with Next.js font optimization
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  // Specify variable in case we want to use CSS variable later
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'HR Recruitment Platform',
  description: 'Resume upload and candidate assessment platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1">
            <TopNav />
            <main className="p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import { ThemeProvider } from '@/contexts/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAD2' },
    { media: '(prefers-color-scheme: dark)', color: '#2E2E2E' },
  ],
}

export const metadata: Metadata = {
  title: {
    default: 'Milestone Crowdfunding | Secure & Transparent',
    template: '%s | Milestone Crowdfunding',
  },
  description: 'A secure, milestone-based crowdfunding platform with escrow protection and community governance. Support innovative projects with confidence.',
  keywords: ['crowdfunding', 'escrow', 'blockchain', 'milestone funding', 'secure investment', 'startup funding'],
  authors: [{ name: 'Milestone Team' }],
  creator: 'Milestone Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://milestone-crowdfunding.com',
    title: 'Milestone Crowdfunding | Secure & Transparent',
    description: 'A secure, milestone-based crowdfunding platform with escrow protection and community governance.',
    siteName: 'Milestone Crowdfunding',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Milestone Crowdfunding Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Milestone Crowdfunding | Secure & Transparent',
    description: 'A secure, milestone-based crowdfunding platform with escrow protection and community governance.',
    images: ['/og-image.jpg'],
    creator: '@milestone_cf',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  metadataBase: new URL('https://milestone-crowdfunding.com'),
}

import AOSInit from '@/components/AOSInit'
import { ReduxProvider } from '@/lib/ReduxProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Milestone Crowdfunding',
    url: 'https://milestone-crowdfunding.com',
    logo: 'https://milestone-crowdfunding.com/logo.png',
    sameAs: [
      'https://twitter.com/milestone_cf',
      'https://github.com/milestone-crowdfunding',
    ],
    description: 'A secure, milestone-based crowdfunding platform with escrow protection.',
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AOSInit />
        <ReduxProvider>
          <ThemeProvider>
            <Navbar />
            <main className="min-h-screen bg-bg">
              {children}
            </main>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  )
}

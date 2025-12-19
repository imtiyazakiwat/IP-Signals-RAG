import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Copyright Detector | AI-Powered Content Analysis',
  description: 'Detect potential copyright infringement using AI-powered vector embeddings and RAG technology. Supports images (JPEG, PNG, WebP, AVIF) and videos (MP4).',
  keywords: ['copyright', 'detection', 'AI', 'RAG', 'vector embeddings', 'image analysis', 'video analysis'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

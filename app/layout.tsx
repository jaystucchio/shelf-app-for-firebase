import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Folio — Your Reading Diary',
  description: 'A personal reading diary to track your books, log sessions, and build your shelf',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}

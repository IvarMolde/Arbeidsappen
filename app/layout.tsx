import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Arbeidsnorsk – Norskopplæring på arbeidsplassen',
  description: 'Generer tilpasset norskopplæringsmateriell for din bedrift',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no">
      <body className="antialiased">{children}</body>
    </html>
  )
}

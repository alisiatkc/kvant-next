import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Педагогический технопарк | Проектная деятельность',
  description: 'Кванториум им. К. Д. Ушинского — РГПУ им. А.И. Герцена. Проектная деятельность и практики на базе технопарка.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="font-[var(--font-inter),Inter,-apple-system,BlinkMacSystemFont,sans-serif]">
        {children}
      </body>
    </html>
  )
}

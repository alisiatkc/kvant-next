import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Кванториум им. К. Д. Ушинского | Цифровая среда практики',
  description: 'Цифровая образовательная среда педагогического технопарка РГПУ им. А.И. Герцена. Разработка и апробация коробочных образовательных комплектов (КОП).',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body>
        {children}
      </body>
    </html>
  )
}

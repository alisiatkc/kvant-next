import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Проектный навигатор — платформа разработки КОП',
  description: 'Цифровое рабочее пространство педагогического технопарка Кванториум им. К.Д. Ушинского (РГПУ им. А.И. Герцена). Разработка, апробация и публикация коробочных образовательных комплектов.',
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

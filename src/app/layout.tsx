import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Проектный навигатор — ЦОС проектной деятельности',
  description: 'Цифровая образовательная среда педагогического технопарка Кванториум им. К.Д. Ушинского для сопровождения студенческих проектов: от идеи и совместной работы до апробации и адаптации результата в коробочный образовательный комплект.',
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

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Проектный навигатор — ЦОС проектной деятельности',
  description: 'Цифровая образовательная среда педагогического технопарка Кванториум им. К.Д. Ушинского для сопровождения студенческих проектов: от идеи и совместной работы до апробации и адаптации результата в коробочный образовательный комплект.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        {children}
      </body>
    </html>
  )
}

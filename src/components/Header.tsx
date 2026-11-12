'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

interface HeaderProps {
  active?: 'home' | 'cabinet' | 'catalog' | 'guide'
}

export default function Header({ active }: HeaderProps) {
  const [open, setOpen] = useState(false)

  const navClass = (isActive: boolean) =>
    `no-underline text-sm font-medium transition-colors ${isActive ? 'text-kv-blue' : 'text-kv-text hover:text-kv-dark'}`

  return (
    <header className="sticky top-0 z-40 border-b border-kv-border bg-white">
      <div className="container-kv flex h-[72px] items-center justify-between">
        <Link href="/" className="flex items-center gap-3 no-underline" onClick={() => setOpen(false)}>
          <span className="flex h-10 w-10 items-center justify-center bg-kv-blue text-sm font-semibold text-white">
            К
          </span>
          <span className="text-[1.05rem] font-semibold leading-tight text-kv-dark">
            Проектный<br />навигатор
          </span>
          <span className="hidden h-8 w-px bg-kv-border min-[900px]:block" aria-hidden />
          <span className="hidden max-w-[190px] text-xs leading-snug text-kv-muted min-[900px]:block">
            Педагогический технопарк РГПУ им. А. И. Герцена
          </span>
        </Link>

        <nav className="hidden items-center gap-6 min-[640px]:flex">
          <Link href="/" className={navClass(active === 'home')}>О платформе</Link>
          <Link href="/catalog" className={navClass(active === 'catalog')}>Проекты</Link>
          <Link href="/guide" className={navClass(active === 'guide')}>Как работать</Link>
          <Link
            href="/cabinet"
            className={`border px-5 py-2.5 text-sm font-medium no-underline transition-colors ${
              active === 'cabinet'
                ? 'border-kv-blue bg-kv-blue text-white'
                : 'border-kv-border text-kv-dark hover:border-kv-blue hover:text-kv-blue'
            }`}
          >
            Войти
          </Link>
        </nav>

        <button
          className="border-none bg-transparent p-2 text-kv-dark min-[640px]:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Меню"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="space-y-1 border-t border-kv-border bg-white px-4 py-4 min-[640px]:hidden">
          <Link href="/" onClick={() => setOpen(false)} className="flex px-4 py-3 text-sm font-medium text-kv-text no-underline hover:bg-kv-light">О платформе</Link>
          <Link href="/catalog" onClick={() => setOpen(false)} className="flex px-4 py-3 text-sm font-medium text-kv-text no-underline hover:bg-kv-light">Проекты</Link>
          <Link href="/guide" onClick={() => setOpen(false)} className="flex px-4 py-3 text-sm font-medium text-kv-text no-underline hover:bg-kv-light">Как работать</Link>
          <Link href="/cabinet" onClick={() => setOpen(false)} className="mt-2 flex items-center justify-center bg-kv-blue py-3 text-sm font-medium text-white no-underline">Войти в кабинет</Link>
        </div>
      )}
    </header>
  )
}

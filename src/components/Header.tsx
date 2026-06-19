'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

interface HeaderProps {
  active?: 'home' | 'cabinet' | 'catalog'
}

export default function Header({ active }: HeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <header className="py-4 bg-white border-b border-black/[0.05] sticky top-0 z-40">
      <div className="container-kv flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="no-underline flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="w-8 h-8 rounded-[10px] bg-kv-blue flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[11px] font-bold tracking-tight">КЛ</span>
          </span>
          <span className="text-[1.2rem] font-semibold text-kv-dark">КвантЛаб</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden min-[640px]:flex gap-6 items-center">
          <Link href="/"
            className={`no-underline text-sm font-medium transition-colors ${active === 'home' ? 'text-kv-blue' : 'text-kv-text hover:text-kv-dark'}`}>
            О платформе
          </Link>
          <Link href="/catalog"
            className={`no-underline text-sm font-medium transition-colors ${active === 'catalog' ? 'text-kv-blue' : 'text-kv-text hover:text-kv-dark'}`}>
            Проекты
          </Link>
          <Link href="/cabinet"
            className={`no-underline text-sm font-medium px-5 py-2 rounded-full transition-all ${
              active === 'cabinet'
                ? 'bg-kv-blue text-white'
                : 'border border-kv-border text-kv-dark hover:border-kv-blue hover:text-kv-blue'
            }`}>
            Войти
          </Link>
        </nav>

        {/* Mobile burger */}
        <button
          className="min-[640px]:hidden p-2 rounded-xl bg-transparent border-none cursor-pointer text-kv-dark"
          onClick={() => setOpen((v) => !v)}
          aria-label="Меню"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="min-[640px]:hidden border-t border-black/[0.05] bg-white px-4 py-4 space-y-1">
          <Link href="/" onClick={() => setOpen(false)}
            className={`flex items-center px-4 py-3 rounded-2xl text-sm font-medium no-underline transition-colors ${active === 'home' ? 'bg-kv-light text-kv-blue' : 'text-kv-text hover:bg-kv-light'}`}>
            О платформе
          </Link>
          <Link href="/catalog" onClick={() => setOpen(false)}
            className={`flex items-center px-4 py-3 rounded-2xl text-sm font-medium no-underline transition-colors ${active === 'catalog' ? 'bg-kv-light text-kv-blue' : 'text-kv-text hover:bg-kv-light'}`}>
            Проекты
          </Link>
          <Link href="/cabinet" onClick={() => setOpen(false)}
            className="flex items-center justify-center mt-2 py-3 rounded-full bg-kv-blue text-white text-sm font-medium no-underline">
            Войти в кабинет
          </Link>
        </div>
      )}
    </header>
  )
}

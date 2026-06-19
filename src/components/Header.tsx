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
        <Link href="/" className="no-underline flex items-center gap-3" onClick={() => setOpen(false)}>
          <div className="w-9 h-9 flex-shrink-0 relative rounded-[10px] overflow-hidden">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9">
              <defs>
                <linearGradient id="logo-g" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#1a2d5a"/>
                  <stop offset="0.55" stopColor="#2b3b6b"/>
                  <stop offset="1" stopColor="#4f6ad0"/>
                </linearGradient>
              </defs>
              <rect width="36" height="36" rx="10" fill="url(#logo-g)"/>
              <circle cx="18" cy="18" r="13.5" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2"/>
              <circle cx="18" cy="4.5"  r="1.8" fill="rgba(255,255,255,0.55)"/>
              <circle cx="30"  cy="25"  r="1.8" fill="rgba(255,255,255,0.55)"/>
              <circle cx="6"   cy="25"  r="1.8" fill="rgba(255,255,255,0.55)"/>
              <circle cx="18" cy="18"   r="3.5" fill="rgba(255,255,255,0.15)"/>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-white text-[12px] font-bold z-10 tracking-tight">К</span>
          </div>
          <span className="text-[1.2rem] font-semibold text-kv-dark tracking-tight">КвантЛаб</span>
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

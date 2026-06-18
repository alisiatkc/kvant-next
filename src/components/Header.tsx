import Link from 'next/link'

interface HeaderProps {
  active?: 'home' | 'cabinet' | 'catalog'
}

export default function Header({ active }: HeaderProps) {
  return (
    <header className="py-4 bg-white border-b border-black/[0.05] sticky top-0 z-40">
      <div className="container-kv flex items-center justify-between">
        <Link href="/" className="no-underline flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[10px] bg-kv-blue flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[11px] font-bold tracking-tight">КЛ</span>
          </span>
          <span className="text-[1.2rem] font-semibold text-kv-dark">КвантЛаб</span>
        </Link>

        <nav className="flex gap-6 items-center">
          <Link
            href="/"
            className={`no-underline text-sm font-medium transition-colors ${active === 'home' ? 'text-kv-blue' : 'text-kv-text hover:text-kv-dark'}`}
          >
            О платформе
          </Link>
          <Link
            href="/catalog"
            className={`no-underline text-sm font-medium transition-colors ${active === 'catalog' ? 'text-kv-blue' : 'text-kv-text hover:text-kv-dark'}`}
          >
            Проекты
          </Link>
          <Link
            href="/cabinet"
            className={`no-underline text-sm font-medium px-5 py-2 rounded-full transition-all ${
              active === 'cabinet'
                ? 'bg-kv-blue text-white'
                : 'border border-kv-border text-kv-dark hover:border-kv-blue hover:text-kv-blue'
            }`}
          >
            Войти
          </Link>
        </nav>
      </div>
    </header>
  )
}

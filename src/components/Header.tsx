import Link from 'next/link'

interface HeaderProps {
  active?: 'home' | 'cabinet' | 'catalog'
}

export default function Header({ active }: HeaderProps) {
  return (
    <header className="py-5 bg-white border-b border-black/[0.03]">
      <div className="container-kv flex items-center justify-between">
        <div>
          <Link href="/" className="text-2xl font-semibold text-kv-dark no-underline">
            Педагогический технопарк
          </Link>
        </div>
        <nav className="flex gap-8">
          <Link
            href="/"
            className={`no-underline font-medium transition-colors ${active === 'home' ? 'text-kv-blue' : 'text-kv-text hover:text-kv-blue'}`}
          >
            Главная
          </Link>
          <Link
            href="/cabinet"
            className={`no-underline font-medium transition-colors ${active === 'cabinet' ? 'text-kv-blue' : 'text-kv-text hover:text-kv-blue'}`}
          >
            Личный кабинет
          </Link>
          <Link
            href="/catalog"
            className={`no-underline font-medium transition-colors ${active === 'catalog' ? 'text-kv-blue' : 'text-kv-text hover:text-kv-blue'}`}
          >
            Проекты
          </Link>
        </nav>
      </div>
    </header>
  )
}

import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  Box, Calendar, Zap, MapPin, Globe, Mail, MessageCircle,
  Hash, MessageSquare, ArrowRight, CheckCircle2, Users,
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { contacts } from '@/data'

const WorkshopsSection = dynamic(() => import('@/components/WorkshopsSection'), { ssr: false })
const DocsSection      = dynamic(() => import('@/components/DocsSection'),      { ssr: false })
const AIAssistant      = dynamic(() => import('@/components/AIAssistant'),      { ssr: false })
const AgileSection     = dynamic(() => import('@/components/AgileSection'),     { ssr: false })

const contactIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MapPin, Globe, Mail, MessageCircle, Hash, MessageSquare,
}

const statItems = [
  { value: '3',    label: 'Трека практики',              color: '#2B3B6B', bg: '#EEF3FF' },
  { value: '12+',  label: 'Команд ежегодно',             color: '#4C1D95', bg: '#F3EEFF' },
  { value: '6',    label: 'Этапов по Agile',             color: '#2B3B6B', bg: '#EEF3FF' },
  { value: '100%', label: 'Апробация в учреждениях СПб', color: '#4C1D95', bg: '#F3EEFF' },
]

export default function HomePage() {
  return (
    <>
      <Header active="home" />
      <main>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#f5f7fb]">

          {/* Animated background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
            {/* Large soft orbs */}
            <div className="float-slow absolute w-[600px] h-[600px] -top-[180px] -right-[120px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(43,59,107,0.08) 0%, transparent 70%)' }} />
            <div className="float-med absolute w-[400px] h-[400px] top-[30%] -left-[100px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(76,29,149,0.06) 0%, transparent 70%)' }} />
            <div className="float-x absolute w-[350px] h-[350px] bottom-[5%] right-[10%] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(43,59,107,0.05) 0%, transparent 70%)' }} />

            {/* Floating bubbles */}
            <div className="bubble-a absolute w-24 h-24 rounded-full"
              style={{ top: '12%', right: '22%',
                background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.55), rgba(43,59,107,0.06))',
                border: '1.5px solid rgba(43,59,107,0.12)' }} />
            <div className="bubble-b absolute w-14 h-14 rounded-full"
              style={{ top: '40%', left: '7%',
                background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5), rgba(76,29,149,0.07))',
                border: '1.5px solid rgba(76,29,149,0.13)' }} />
            <div className="bubble-c absolute w-9 h-9 rounded-full"
              style={{ top: '68%', left: '42%',
                background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.6), rgba(43,59,107,0.05))',
                border: '1px solid rgba(43,59,107,0.11)' }} />
            <div className="bubble-d absolute w-16 h-16 rounded-full"
              style={{ top: '18%', left: '38%',
                background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.45), rgba(76,29,149,0.05))',
                border: '1.5px solid rgba(76,29,149,0.1)' }} />
            <div className="bubble-e absolute w-20 h-20 rounded-full"
              style={{ bottom: '20%', right: '18%',
                background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5), rgba(43,59,107,0.06))',
                border: '1.5px solid rgba(43,59,107,0.13)' }} />
            <div className="bubble-f absolute w-6 h-6 rounded-full"
              style={{ top: '55%', right: '32%',
                background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.7), rgba(76,29,149,0.08))',
                border: '1px solid rgba(76,29,149,0.14)' }} />
            <div className="bubble-g absolute w-11 h-11 rounded-full"
              style={{ bottom: '32%', left: '22%',
                background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5), rgba(43,59,107,0.05))',
                border: '1.5px solid rgba(43,59,107,0.1)' }} />

            {/* Grid texture */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2b3b6b" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="container-kv relative z-10 py-20 min-[640px]:py-32">
            {/* Badge */}
            <div className="anim-fade-down mb-5 min-[640px]:mb-7">
              <span className="inline-flex items-center gap-2 bg-white border border-kv-border rounded-full px-4 min-[640px]:px-5 py-2 text-[0.7rem] min-[640px]:text-xs font-medium text-kv-blue shadow-card">
                <span className="w-1.5 h-1.5 rounded-full bg-kv-blue inline-block flex-shrink-0" />
                Педагогический технопарк «Кванториум им. К.Д. Ушинского» · РГПУ им. А.И. Герцена
              </span>
            </div>

            {/* Headline */}
            <h1 className="anim-fade-up anim-d1 text-[clamp(2.4rem,8vw,6rem)] font-semibold tracking-tight leading-[1.05] mb-5 min-[640px]:mb-6">
              Создавайте КОП<br />
              <span className="text-kv-blue">От идеи — до каталога</span>
            </h1>

            <p className="anim-fade-up anim-d2 text-base min-[640px]:text-[1.2rem] font-light text-kv-text mb-8 min-[640px]:mb-10 max-w-[600px] leading-relaxed">
              Цифровая среда для практики студентов. Управляйте проектом по Agile, работайте с оборудованием технопарка и апробируйте результаты в образовательных учреждениях.
            </p>

            <div className="anim-fade-up anim-d3 flex flex-col min-[480px]:flex-row gap-3">
              <Link href="/cabinet" className="btn-primary inline-flex items-center justify-center gap-2">
                Войти в кабинет <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#cycle" className="btn-outline inline-flex items-center justify-center gap-2">
                Как это работает
              </a>
            </div>

            {/* Stats strip */}
            <div className="anim-fade-up anim-d4 grid grid-cols-2 min-[600px]:grid-cols-4 gap-3 mt-10 min-[640px]:mt-16">
              {statItems.map(({ value, label, color, bg }) => (
                <div key={label} className="rounded-[1.25rem] min-[640px]:rounded-[1.5rem] px-4 min-[640px]:px-5 py-3 min-[640px]:py-4 border"
                  style={{ background: bg, borderColor: `${color}22` }}>
                  <span className="block text-[1.5rem] min-[640px]:text-[1.8rem] font-bold leading-none mb-1"
                    style={{ color }}>{value}</span>
                  <p className="text-kv-muted text-[0.65rem] min-[640px]:text-xs leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ФОРМАТЫ ──────────────────────────────────────────────────────── */}
        <section className="section-kv" id="formats">
          <div className="container-kv">
            <div className="mb-12">
              <span className="text-kv-blue text-xs font-semibold uppercase tracking-widest">Форматы практики</span>
              <h2 className="text-[clamp(2rem,5vw,3rem)] font-semibold tracking-tight mt-2 mb-3">Практика в вашем темпе</h2>
              <p className="text-kv-text font-light text-lg max-w-[560px] leading-relaxed">
                Мы работаем с двумя форматами практики — оба завершаются разработанным и апробированным КОП в образовательных учреждениях.
              </p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
              <div className="relative bg-white rounded-[2.5rem] p-10 border border-kv-border shadow-card group hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-[#eff3ff] flex items-center justify-center mb-7">
                  <Calendar className="w-7 h-7 text-kv-blue stroke-[1.5]" />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-[1.6rem] font-semibold">А1 · Семестровая</h3>
                  <span className="tag-kv text-xs">16 недель</span>
                </div>
                <p className="text-kv-text leading-relaxed mb-4">
                  Рассредоточенная практика в течение всего семестра — параллельно с учебными занятиями. Больше времени на проработку каждого спринта и более глубокую итерацию продукта.
                </p>
                <ul className="space-y-2 text-sm text-kv-muted">
                  {['Гибкий темп работы', '6 итераций Agile', 'Полный проектный цикл'].map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-kv-blue flex-shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative bg-white rounded-[2.5rem] p-10 border border-kv-border shadow-card group hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-[#f5f0ff] flex items-center justify-center mb-7">
                  <Zap className="w-7 h-7 text-[#7c3aed] stroke-[1.5]" />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-[1.6rem] font-semibold">А2 · Интенсив</h3>
                  <span className="bg-[#f5f0ff] text-[#7c3aed] px-4 py-1.5 rounded-full text-xs font-medium inline-block">5 дней</span>
                </div>
                <p className="text-kv-text leading-relaxed mb-4">
                  Проектно-технологическая практика в формате недельного интенсива. Полное погружение в разработку — от идеи до готового КОП и его апробации в сжатые сроки.
                </p>
                <ul className="space-y-2 text-sm text-kv-muted">
                  {['Полное погружение', 'Быстрые спринты', 'Результат за 5 дней'].map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#7c3aed] flex-shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── AGILE ЦИКЛ ───────────────────────────────────────────────────── */}
        <AgileSection />

        {/* ── КОП ──────────────────────────────────────────────────────────── */}
        <section className="section-kv">
          <div className="container-kv">
            <div className="bg-white rounded-[2rem] min-[640px]:rounded-[3rem] px-6 py-8 min-[640px]:px-[60px] min-[640px]:py-[70px] flex flex-wrap gap-8 min-[640px]:gap-[60px] items-center border border-kv-border shadow-card">
              <div className="flex-[2] min-w-[300px]">
                <span className="text-kv-blue text-xs font-semibold uppercase tracking-widest block mb-4">Результат практики</span>
                <h3 className="text-[clamp(1.7rem,4vw,2.5rem)] font-semibold mb-5 leading-tight">
                  Коробочный образовательный<br />комплект (КОП)
                </h3>
                <p className="text-kv-text leading-relaxed mb-4 text-[1.05rem]">
                  Готовое образовательное решение, которое любой учитель может взять и применить на уроке без дополнительной подготовки. В состав входят продукт, инструкция и методические материалы.
                </p>
                <p className="text-kv-muted text-sm leading-relaxed mb-8">
                  Каждый КОП проходит апробацию в образовательных учреждениях Санкт-Петербурга и публикуется в открытом каталоге технопарка.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Link href="/catalog" className="btn-primary inline-flex items-center gap-2">
                    Каталог КОП <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/cabinet" className="btn-outline inline-flex items-center gap-2">
                    Начать разработку
                  </Link>
                </div>
              </div>
              <div className="flex-1 min-w-[180px] flex flex-col items-center gap-5">
                <div className="w-36 h-36 rounded-[2.5rem] bg-kv-light flex items-center justify-center">
                  <Box className="w-20 h-20 text-kv-blue stroke-[1.2]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── МАСТЕР-КЛАССЫ ────────────────────────────────────────────────── */}
        <WorkshopsSection />

        {/* ── ДОКУМЕНТЫ ────────────────────────────────────────────────────── */}
        <DocsSection />

        {/* ── КОНТАКТЫ ─────────────────────────────────────────────────────── */}
        <section className="section-kv">
          <div className="container-kv">
            <div className="mb-10">
              <span className="text-kv-blue text-xs font-semibold uppercase tracking-widest">Связь</span>
              <h2 className="text-[clamp(2rem,5vw,3rem)] font-semibold tracking-tight mt-2 mb-3">Контакты</h2>
              <p className="text-kv-text font-light text-lg">
                Связаться с куратором, задать вопрос или договориться о сотрудничестве.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {contacts.map((c) => {
                const Icon = contactIconMap[c.icon] ?? MapPin
                return (
                  <a key={c.text} href={c.link} target="_blank" rel="noopener noreferrer"
                    className="bg-white rounded-full py-3.5 px-6 flex items-center gap-2.5 border border-kv-border text-kv-dark no-underline text-[0.95rem] transition-all hover:bg-kv-light hover:-translate-y-0.5 hover:shadow-card">
                    <Icon className="w-[18px] h-[18px] text-kv-blue stroke-[1.5] flex-shrink-0" />
                    <span>{c.text}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── КАТАЛОГ CTA ──────────────────────────────────────────────────── */}
        <section className="section-kv">
          <div className="container-kv">
            <div className="relative bg-kv-dark rounded-[2rem] min-[640px]:rounded-[3rem] px-6 py-8 min-[640px]:px-[60px] min-[640px]:py-[70px] overflow-hidden">
              {/* Decorative blob */}
              <div className="absolute -right-24 -top-24 w-64 h-64 rounded-full opacity-10"
                style={{ background: 'radial-gradient(circle, #4f6ad0, transparent 70%)' }} />
              <div className="absolute -left-12 -bottom-16 w-48 h-48 rounded-full opacity-10"
                style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-8">
                <div>
                  <h4 className="text-[clamp(1.6rem,4vw,2.2rem)] font-semibold text-white mb-3">
                    Каталог коробочных комплектов
                  </h4>
                  <p className="text-white/60 text-lg max-w-[520px] leading-relaxed">
                    Посмотрите КОП, созданные студентами и прошедшие апробацию в образовательных учреждениях Санкт-Петербурга.
                  </p>
                </div>
                <Link href="/catalog"
                  className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-kv-dark px-8 py-4 rounded-full font-medium text-[1rem] hover:bg-kv-light transition-colors no-underline">
                  Открыть каталог <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── ПАРТНЁРСТВО ──────────────────────────────────────────────────── */}
        <section className="py-24 pt-0">
          <div className="container-kv">
            <div className="bg-white rounded-[2rem] min-[640px]:rounded-[3rem] p-7 min-[640px]:p-[60px] text-center border border-kv-border">
              <div className="w-14 h-14 rounded-2xl bg-kv-light flex items-center justify-center mx-auto mb-6">
                <Users className="w-7 h-7 text-kv-blue" />
              </div>
              <h4 className="text-[clamp(1.6rem,4vw,2.2rem)] font-semibold mb-4">
                Хотите сотрудничать с технопарком?
              </h4>
              <p className="text-kv-text text-lg mb-3 max-w-[580px] mx-auto leading-relaxed">
                Образовательные учреждения могут просматривать каталог КОП, запрашивать апробацию и оставлять обратную связь по итогам занятий.
              </p>
              <p className="text-kv-muted mb-10">
                Заявки на практику подаёт администрация технопарка РГПУ им. А.И. Герцена — место практики согласовывается заранее.
              </p>
              <a href="https://technopark.herzen.spb.ru" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-kv-blue text-white px-12 py-4 rounded-full text-[1.05rem] font-medium no-underline hover:bg-kv-dark transition-colors">
                Написать нам <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
      <AIAssistant />
    </>
  )
}

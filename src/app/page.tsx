import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  Box, Calendar, Zap, MapPin, Globe, Mail, MessageCircle,
  Hash, MessageSquare, Layers, Pencil, Hammer, Eye,
  School, BarChart3, ArrowRight, Cpu, CheckCircle2, Users,
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { contacts } from '@/data'

const WorkshopsSection = dynamic(() => import('@/components/WorkshopsSection'), { ssr: false })
const DocsSection      = dynamic(() => import('@/components/DocsSection'),      { ssr: false })
const AIAssistant      = dynamic(() => import('@/components/AIAssistant'),      { ssr: false })

const contactIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MapPin, Globe, Mail, MessageCircle, Hash, MessageSquare,
}

const agileCycle = [
  {
    icon: Layers,
    sprint: 'Старт',
    accent: '#2b3b6b',
    title: 'Бэклог и планирование',
    desc: 'Формулируем цель КОП, определяем целевую аудиторию и предмет. Создаём бэклог задач и расставляем приоритеты в команде.',
  },
  {
    icon: Pencil,
    sprint: 'Спринт 1',
    accent: '#7c3aed',
    title: 'Концепция и проектирование',
    desc: 'Прорабатываем структуру комплекта, выбираем технологию производства — лазерную резку, 3D-печать или полиграфию.',
  },
  {
    icon: Hammer,
    sprint: 'Спринт 2',
    accent: '#0ea5e9',
    title: 'Прототип',
    desc: 'Изготавливаем первый рабочий прототип на оборудовании технопарка. Проверяем гипотезы на практике, не боясь ошибиться.',
  },
  {
    icon: Eye,
    sprint: 'Ревью',
    accent: '#f59e0b',
    title: 'Обратная связь и итерация',
    desc: 'Демонстрируем прототип куратору через КвантЛаб, получаем комментарии и вносим правки до следующего спринта.',
  },
  {
    icon: School,
    sprint: 'Спринт 3',
    accent: '#10b981',
    title: 'Апробация в школе',
    desc: 'Тестируем готовый КОП в реальных классах. Собираем анкеты от учителей и учеников, фиксируем вовлечённость.',
  },
  {
    icon: BarChart3,
    sprint: 'Ретро',
    accent: '#ef4444',
    title: 'Ретроспектива и публикация',
    desc: 'Анализируем результаты апробации, оформляем каталожную карточку и публикуем КОП в открытом каталоге технопарка.',
  },
]

const statItems = [
  { value: '3',    label: 'Трека практики',    Icon: Calendar },
  { value: '12+',  label: 'Команд ежегодно',   Icon: Users },
  { value: '6',    label: 'Этапов по Agile',   Icon: CheckCircle2 },
  { value: '100%', label: 'С апробацией в школе', Icon: School },
]

export default function HomePage() {
  return (
    <>
      <Header active="home" />
      <main>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#f5f7fb]">

          {/* Animated background orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
            <div className="float-slow absolute w-[600px] h-[600px] -top-[180px] -right-[120px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(43,59,107,0.07) 0%, transparent 70%)' }} />
            <div className="float-med absolute w-[400px] h-[400px] top-[30%] -left-[100px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)' }} />
            <div className="float-x absolute w-[300px] h-[300px] bottom-[5%] right-[10%] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)' }} />
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

          <div className="container-kv relative z-10 py-32">
            {/* Badge */}
            <div className="anim-fade-down mb-7">
              <span className="inline-flex items-center gap-2 bg-white border border-kv-border rounded-full px-5 py-2 text-xs font-medium text-kv-blue shadow-card">
                <span className="w-1.5 h-1.5 rounded-full bg-kv-blue inline-block" />
                Педагогический технопарк «Кванториум им. К.Д. Ушинского» · РГПУ им. А.И. Герцена
              </span>
            </div>

            {/* Headline */}
            <h1 className="anim-fade-up anim-d1 text-[clamp(3.2rem,9vw,6rem)] font-semibold tracking-tight leading-[1.05] mb-6 max-w-[900px]">
              Создавайте КОП.<br />
              <span className="text-kv-blue">От идеи — до каталога.</span>
            </h1>

            <p className="anim-fade-up anim-d2 text-[1.2rem] font-light text-kv-text mb-10 max-w-[600px] leading-relaxed">
              Цифровая среда для практики студентов. Управляйте проектом по Agile, работайте с оборудованием технопарка и апробируйте результаты в реальных школах.
            </p>

            <div className="anim-fade-up anim-d3 flex flex-wrap gap-3">
              <Link href="/cabinet" className="btn-primary inline-flex items-center gap-2 text-[1rem]">
                Войти в кабинет <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#cycle" className="btn-outline inline-flex items-center gap-2 text-[1rem]">
                Как это работает
              </a>
            </div>

            {/* Stats strip */}
            <div className="anim-fade-up anim-d4 grid grid-cols-2 min-[600px]:grid-cols-4 gap-4 mt-16 max-w-[700px]">
              {statItems.map(({ value, label, Icon }) => (
                <div key={label} className="bg-white/80 backdrop-blur-sm rounded-[1.5rem] px-5 py-4 border border-kv-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-3.5 h-3.5 text-kv-blue" />
                    <span className="text-[1.5rem] font-bold text-kv-dark">{value}</span>
                  </div>
                  <p className="text-kv-muted text-xs leading-tight">{label}</p>
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
              <h2 className="text-[clamp(2rem,5vw,3rem)] font-semibold tracking-tight mt-2 mb-3">Два пути — один результат</h2>
              <p className="text-kv-text font-light text-lg max-w-[560px] leading-relaxed">
                Выберите формат, подходящий вашему расписанию. Оба трека заканчиваются разработанным и апробированным КОП.
              </p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
              <div className="relative bg-white rounded-[2.5rem] p-10 border border-kv-border shadow-card overflow-hidden group hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-kv-blue to-[#4f6ad0] rounded-t-[2.5rem]" />
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

              <div className="relative bg-white rounded-[2.5rem] p-10 border border-kv-border shadow-card overflow-hidden group hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] rounded-t-[2.5rem]" />
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
        <section className="section-kv" id="cycle">
          <div className="container-kv">
            <div className="mb-12">
              <span className="text-kv-blue text-xs font-semibold uppercase tracking-widest">Методология</span>
              <h2 className="text-[clamp(2rem,5vw,3rem)] font-semibold tracking-tight mt-2 mb-3">Проектный цикл по Agile</h2>
              <p className="text-kv-text font-light text-lg max-w-[620px] leading-relaxed">
                Работаем короткими итерациями — спринтами. После каждого спринта получаем обратную связь от куратора и улучшаем продукт.
              </p>
            </div>

            <div className="grid grid-cols-1 min-[640px]:grid-cols-2 min-[960px]:grid-cols-3 gap-5">
              {agileCycle.map(({ icon: Icon, sprint, accent, title, desc }, i) => (
                <div key={sprint} className="relative bg-white rounded-[2rem] p-7 border border-kv-border shadow-card group hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300 overflow-hidden">
                  {/* Left accent bar */}
                  <div className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full transition-all duration-300 group-hover:top-4 group-hover:bottom-4"
                    style={{ background: accent }} />
                  <div className="pl-2">
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${accent}18` }}>
                        <Icon className="w-5 h-5" style={{ color: accent }} />
                      </div>
                      <span className="text-[0.72rem] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                        style={{ background: `${accent}14`, color: accent }}>
                        {sprint}
                      </span>
                    </div>
                    <div className="text-[0.72rem] text-kv-muted font-semibold uppercase tracking-widest mb-1.5">
                      0{i + 1}
                    </div>
                    <h3 className="text-[1.1rem] font-semibold mb-3 leading-snug">{title}</h3>
                    <p className="text-kv-text text-[0.9rem] leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Agile principles callout */}
            <div className="mt-8 bg-kv-dark rounded-[2rem] p-8 flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Agile в КвантЛаб</h4>
                  <p className="text-white/60 text-sm leading-relaxed max-w-[500px]">
                    Канбан-доска, WIP-лимиты, спринты и ретроспективы — инструменты Agile встроены прямо в рабочее пространство команды.
                  </p>
                </div>
              </div>
              <Link href="/cabinet" className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-kv-dark px-6 py-3 rounded-full font-medium text-sm hover:bg-kv-light transition-colors no-underline">
                Открыть трекер <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── КОП ──────────────────────────────────────────────────────────── */}
        <section className="section-kv">
          <div className="container-kv">
            <div className="bg-white rounded-[3rem] px-[60px] py-[70px] flex flex-wrap gap-[60px] items-center border border-kv-border shadow-card">
              <div className="flex-[2] min-w-[300px]">
                <span className="text-kv-blue text-xs font-semibold uppercase tracking-widest block mb-4">Результат практики</span>
                <h3 className="text-[clamp(1.7rem,4vw,2.5rem)] font-semibold mb-5 leading-tight">
                  Коробочный образовательный<br />комплект (КОП)
                </h3>
                <p className="text-kv-text leading-relaxed mb-4 text-[1.05rem]">
                  Готовое образовательное решение, которое любой учитель может взять и применить на уроке без дополнительной подготовки. В состав входят продукт, инструкция и методические материалы.
                </p>
                <p className="text-kv-muted text-sm leading-relaxed mb-8">
                  Каждый КОП проходит апробацию в образовательных учреждениях Санкт-Петербурга — школах и детских садах — и публикуется в открытом каталоге технопарка.
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
                <div className="w-28 h-28 rounded-[2rem] bg-kv-light flex items-center justify-center">
                  <Box className="w-16 h-16 text-kv-blue stroke-[1.2]" />
                </div>
                <div className="grid grid-cols-2 gap-3 w-full max-w-[220px]">
                  {[
                    { label: 'Лазерная резка',    color: '#eff3ff' },
                    { label: '3D-печать',          color: '#f5f0ff' },
                    { label: 'Электроника',        color: '#ecfdf5' },
                    { label: 'Полиграфия',         color: '#fff7ed' },
                  ].map(({ label, color }) => (
                    <div key={label} className="rounded-xl px-3 py-2 text-center text-xs font-medium text-kv-dark"
                      style={{ background: color }}>
                      {label}
                    </div>
                  ))}
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
            <div className="relative bg-kv-dark rounded-[3rem] px-[60px] py-[70px] overflow-hidden">
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
                    Посмотрите КОП, созданные студентами и прошедшие апробацию в школах Санкт-Петербурга.
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
            <div className="bg-white rounded-[3rem] p-[60px] text-center border border-kv-border">
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
                Студенты — подать заявку на практику и начать работу в технопарке.
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

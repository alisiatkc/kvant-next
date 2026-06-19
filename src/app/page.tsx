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
    num: '01',
    accent: '#2b3b6b',
    accentBg: '#eff3ff',
    title: 'Бэклог и планирование',
    desc: 'Первый шаг любого Agile-проекта — сформировать бэклог: список всех задач, упорядоченных по важности. Команда договаривается о теме, аудитории и ожидаемом результате КОП.',
    tasks: [
      'Выбор темы и предмета КОП',
      'Определение целевой аудитории',
      'Создание бэклога задач в КвантЛаб',
      'Распределение ролей в команде',
    ],
    result: 'Бэклог + паспорт проекта',
  },
  {
    icon: Pencil,
    sprint: 'Спринт 1',
    num: '02',
    accent: '#7c3aed',
    accentBg: '#f5f0ff',
    title: 'Концепция и проектирование',
    desc: 'В первом спринте команда создаёт концепцию комплекта: прорабатывает методику, определяет, какое оборудование технопарка использовать, и набрасывает эскиз.',
    tasks: [
      'Разработка структуры КОП',
      'Выбор технологии: лазерная резка / 3D-печать / полиграфия',
      'Создание методических задач',
      'Эскиз и первичный дизайн',
    ],
    result: 'Концепция + технологическая карта',
  },
  {
    icon: Hammer,
    sprint: 'Спринт 2',
    num: '03',
    accent: '#0ea5e9',
    accentBg: '#f0f9ff',
    title: 'Создание прототипа',
    desc: 'Команда работает с оборудованием технопарка и создаёт первый рабочий прототип. Главное правило Agile — сделать что-то работающее как можно быстрее и проверить гипотезы.',
    tasks: [
      'Работа на оборудовании технопарка',
      'Изготовление составляющих КОП',
      'Сборка первого рабочего прототипа',
      'Самостоятельная проверка и доработка',
    ],
    result: 'Рабочий прототип КОП',
  },
  {
    icon: Eye,
    sprint: 'Ревью',
    num: '04',
    accent: '#f59e0b',
    accentBg: '#fffbeb',
    title: 'Демо и обратная связь',
    desc: 'Спринт-ревью — сердце Agile. Команда демонстрирует прототип куратору через КвантЛаб и получает детальные комментарии. Правки вносятся до следующей итерации.',
    tasks: [
      'Публикация прототипа в КвантЛаб',
      'Получение обратной связи от куратора',
      'Анализ замечаний и приоритизация правок',
      'Итерация — улучшение продукта',
    ],
    result: 'Список правок + улучшенный прототип',
  },
  {
    icon: School,
    sprint: 'Спринт 3',
    num: '05',
    accent: '#10b981',
    accentBg: '#f0fdf4',
    title: 'Апробация в школе',
    desc: 'Готовый КОП тестируется в реальных образовательных условиях. Команда посещает школу, проводит занятие и фиксирует реакцию учеников и педагогов по специальной анкете.',
    tasks: [
      'Организация занятия в образовательном учреждении',
      'Проведение урока / мастер-класса с КОП',
      'Сбор анкет учеников (вовлечённость 1–5)',
      'Запись наблюдений и замечаний педагога',
    ],
    result: 'Протокол апробации + анкеты',
  },
  {
    icon: BarChart3,
    sprint: 'Ретроспектива',
    num: '06',
    accent: '#ef4444',
    accentBg: '#fff1f2',
    title: 'Анализ и публикация',
    desc: 'Финальный этап — ретроспектива: что сработало, что нет и что изменить в следующий раз. По итогам анализа КОП дорабатывается и публикуется в открытом каталоге технопарка.',
    tasks: [
      'Анализ результатов апробации',
      'Финальная доработка КОП по итогам обратной связи',
      'Оформление каталожной карточки',
      'Публикация в открытом каталоге КвантЛаб',
    ],
    result: 'КОП в каталоге технопарка',
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
            <div className="flex flex-wrap items-end justify-between gap-6 mb-14">
              <div>
                <span className="text-kv-blue text-xs font-semibold uppercase tracking-widest">Методология Agile</span>
                <h2 className="text-[clamp(2rem,5vw,3rem)] font-semibold tracking-tight mt-2 mb-3">Проектный цикл</h2>
                <p className="text-kv-text font-light text-lg max-w-[540px] leading-relaxed">
                  Шесть итераций от идеи до публикации. После каждого спринта — обратная связь куратора и улучшение продукта.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-kv-dark text-white px-5 py-3 rounded-full text-sm font-medium flex-shrink-0">
                <Cpu className="w-4 h-4 opacity-70" />
                Agile · Kanban · Scrum
              </div>
            </div>

            <div className="grid grid-cols-1 min-[760px]:grid-cols-2 gap-6">
              {agileCycle.map(({ icon: Icon, sprint, num, accent, accentBg, title, desc, tasks, result }) => (
                <div key={sprint}
                  className="relative bg-white rounded-[2rem] p-8 border border-kv-border shadow-card group hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300 overflow-hidden flex flex-col">

                  {/* Top accent strip */}
                  <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[2rem]"
                    style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />

                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: accentBg }}>
                        <Icon className="w-6 h-6" style={{ color: accent }} />
                      </div>
                      <div>
                        <div className="text-[0.68rem] text-kv-muted font-bold uppercase tracking-widest mb-0.5">{num}</div>
                        <h3 className="text-[1.1rem] font-semibold leading-tight">{title}</h3>
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-[0.7rem] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
                      style={{ background: accentBg, color: accent }}>
                      {sprint}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-kv-text text-[0.92rem] leading-relaxed mb-5">{desc}</p>

                  {/* Task checklist */}
                  <ul className="space-y-2 mb-6 flex-1">
                    {tasks.map((t) => (
                      <li key={t} className="flex items-start gap-2.5 text-[0.87rem] text-kv-dark">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accent }} />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Result badge */}
                  <div className="flex items-center gap-2 pt-4 border-t border-kv-border">
                    <span className="text-[0.72rem] text-kv-muted font-semibold uppercase tracking-widest">Результат:</span>
                    <span className="text-[0.82rem] font-semibold px-3 py-1 rounded-full"
                      style={{ background: accentBg, color: accent }}>
                      {result}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Agile callout */}
            <div className="mt-8 bg-kv-dark rounded-[2rem] p-8 flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Инструменты Agile — прямо в КвантЛаб</h4>
                  <p className="text-white/60 text-sm leading-relaxed max-w-[500px]">
                    Канбан-доска с WIP-лимитами, трекер задач с возрастом и флагом блокировки, заметки команды и ИИ-ассистент — всё встроено в рабочее пространство.
                  </p>
                </div>
              </div>
              <Link href="/cabinet"
                className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-kv-dark px-6 py-3 rounded-full font-medium text-sm hover:bg-kv-light transition-colors no-underline">
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

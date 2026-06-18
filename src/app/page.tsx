import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  Box, Calendar, Zap, MapPin, Globe, Mail, MessageCircle,
  Hash, MessageSquare, Lightbulb, Hammer, School, BarChart3,
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { contacts } from '@/data'

const WorkshopsSection = dynamic(() => import('@/components/WorkshopsSection'), { ssr: false })
const DocsSection = dynamic(() => import('@/components/DocsSection'), { ssr: false })
const AIAssistant = dynamic(() => import('@/components/AIAssistant'), { ssr: false })

const contactIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MapPin, Globe, Mail, MessageCircle, Hash, MessageSquare,
}

const projectCycle = [
  {
    icon: Lightbulb,
    step: '01',
    title: 'Идея и планирование',
    desc: 'Формулировка темы и цели КОП, определение целевой аудитории, состав команды и распределение ролей.',
  },
  {
    icon: Hammer,
    step: '02',
    title: 'Разработка',
    desc: 'Создание образовательного продукта с использованием оборудования технопарка — лазерной резки, 3D-печати, электроники.',
  },
  {
    icon: School,
    step: '03',
    title: 'Апробация',
    desc: 'Тестирование готового КОП в реальных образовательных учреждениях: школах, детских садах, центрах доп. образования.',
  },
  {
    icon: BarChart3,
    step: '04',
    title: 'Рефлексия',
    desc: 'Анализ обратной связи от педагогов и учеников, доработка комплекта и публикация в каталоге технопарка.',
  },
]

export default function HomePage() {
  return (
    <>
      <Header active="home" />
      <main>
        {/* Hero */}
        <section className="min-h-[85vh] flex items-center bg-hero-gradient relative overflow-hidden py-24">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute w-[550px] h-[550px] -top-[200px] -right-[50px] bg-kv-blue opacity-[0.03] rounded-full" />
            <div
              className="absolute w-[350px] h-[350px] -bottom-[120px] -left-[30px] border-2 border-kv-blue opacity-10"
              style={{ borderRadius: '40% 60% 60% 40% / 40% 40% 60% 60%' }}
            />
          </div>
          <div className="container-kv relative z-10 max-w-[860px]">
            <p className="text-[0.9rem] uppercase tracking-[0.2em] text-kv-blue font-medium mb-6">
              Педагогический технопарк «Кванториум им. К. Д. Ушинского» · РГПУ им. А.И. Герцена
            </p>
            <h1 className="text-[clamp(2.8rem,8vw,4.8rem)] font-semibold tracking-tight leading-[1.1] mb-8">
              Цифровая среда для практики студентов педагогического технопарка
            </h1>
            <p className="text-xl font-light text-[#252e44] mb-12 max-w-[680px] leading-relaxed">
              Разрабатывайте коробочные образовательные комплекты, осваивайте современное оборудование и апробируйте результаты в реальных школах.
            </p>
            <div className="flex flex-wrap gap-3 max-[600px]:flex-col max-[600px]:items-start">
              <Link href="/cabinet" className="btn-primary">Войти в кабинет</Link>
              <a href="#formats" className="btn-outline">О форматах практики</a>
            </div>
          </div>
        </section>

        {/* Форматы практики */}
        <section className="section-kv" id="formats">
          <div className="container-kv">
            <h2 className="text-[2.8rem] font-medium tracking-tight mb-4">Два формата практики</h2>
            <p className="text-xl font-light text-kv-text max-w-[680px] mb-12">
              Практика проходит в двух форматах — выберите тот, что подходит вашему расписанию и целям.
            </p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8">
              <div className="card-kv">
                <Calendar className="w-12 h-12 text-kv-blue mb-7 stroke-[1.5]" />
                <h3 className="text-[2rem] font-medium mb-4">А1 · Семестровая</h3>
                <p className="text-kv-text font-light mb-6 text-lg leading-relaxed">
                  Рассредоточенная практика в течение всего семестра — параллельно с учебными занятиями. Больше времени на проработку каждого этапа проекта.
                </p>
                <span className="tag-kv">16 недель</span>
              </div>
              <div className="card-kv">
                <Zap className="w-12 h-12 text-kv-blue mb-7 stroke-[1.5]" />
                <h3 className="text-[2rem] font-medium mb-4">А2 · Интенсив</h3>
                <p className="text-kv-text font-light mb-6 text-lg leading-relaxed">
                  Проектно-технологическая практика в формате недельного интенсива. Полное погружение в разработку — от идеи до готового КОП и его апробации.
                </p>
                <span className="tag-kv">5 дней</span>
              </div>
            </div>
          </div>
        </section>

        {/* Проектный цикл */}
        <section className="section-kv">
          <div className="container-kv">
            <h2 className="text-[2.8rem] font-medium tracking-tight mb-4">Проектный цикл</h2>
            <p className="text-xl font-light text-kv-text max-w-[680px] mb-12">
              Каждый проект проходит четыре этапа — от первоначальной идеи до публикации готового комплекта в общем каталоге.
            </p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
              {projectCycle.map(({ icon: Icon, step, title, desc }) => (
                <div key={step} className="relative bg-white rounded-[2.5rem] p-9 border border-kv-border shadow-card group hover:-translate-y-1 hover:shadow-card-hover transition-all duration-200">
                  <span className="absolute top-7 right-8 text-[0.8rem] font-semibold text-kv-muted tracking-widest">{step}</span>
                  <Icon className="w-10 h-10 text-kv-blue mb-6 stroke-[1.5]" />
                  <h3 className="text-[1.35rem] font-medium mb-3">{title}</h3>
                  <p className="text-kv-text font-light leading-relaxed text-[0.95rem]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Коробочные комплекты */}
        <section className="section-kv">
          <div className="container-kv">
            <div className="bg-white rounded-[3.75rem] px-[60px] py-[70px] flex flex-wrap gap-[60px] items-center border border-kv-border">
              <div className="flex-[2] min-w-[320px]">
                <h3 className="text-[2.5rem] font-medium mb-6">Коробочный образовательный комплект (КОП)</h3>
                <p className="text-xl font-light text-[#383f5a] mb-5 max-w-[550px] leading-[1.7]">
                  Готовое образовательное решение, созданное студентами с использованием оборудования технопарка. В состав КОП входят продукт, инструкция и методические материалы.
                </p>
                <p className="text-kv-text font-light mb-10 leading-relaxed">
                  После разработки каждый комплект проходит апробацию в образовательных учреждениях — школах и детских садах Санкт-Петербурга.
                </p>
                <Link href="/catalog" className="btn-primary">Каталог КОП</Link>
              </div>
              <div className="flex-1 min-w-[140px] text-center text-kv-blue">
                <Box className="w-36 h-36 mx-auto stroke-[1.2]" />
              </div>
            </div>
          </div>
        </section>

        {/* Мастер-классы */}
        <WorkshopsSection />

        {/* Документы */}
        <DocsSection />

        {/* Контакты */}
        <section className="section-kv">
          <div className="container-kv">
            <h2 className="text-[2.8rem] font-medium tracking-tight mb-4">Контакты</h2>
            <p className="text-xl font-light text-kv-text mb-12">
              Связаться с куратором, задать вопрос или договориться о сотрудничестве.
            </p>
            <div className="flex flex-wrap gap-3">
              {contacts.map((c) => {
                const Icon = contactIconMap[c.icon] ?? MapPin
                return (
                  <a
                    key={c.text}
                    href={c.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white rounded-full py-3.5 px-6 flex items-center gap-2.5 border border-kv-border text-kv-dark no-underline text-[0.95rem] transition-all hover:bg-kv-light hover:-translate-y-0.5 hover:shadow-card"
                  >
                    <Icon className="w-[18px] h-[18px] text-kv-blue stroke-[1.5] flex-shrink-0" />
                    <span>{c.text}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </section>

        {/* Каталог КОП */}
        <section className="section-kv">
          <div className="container-kv">
            <div className="bg-kv-light rounded-[4.375rem] px-[50px] py-[60px] flex items-center justify-between flex-wrap gap-8">
              <div>
                <h4 className="text-[2rem] font-medium mb-3">Каталог коробочных комплектов</h4>
                <p className="text-[#384362] text-lg max-w-[550px]">
                  Посмотрите КОП, созданные студентами на базе технопарка и прошедшие апробацию в школах.
                </p>
              </div>
              <Link href="/catalog" className="btn-outline border-kv-blue">
                Перейти в каталог →
              </Link>
            </div>
          </div>
        </section>

        {/* Партнёрство */}
        <section className="py-24 pt-0">
          <div className="container-kv">
            <div className="bg-white rounded-[4.375rem] p-[60px] text-center">
              <h4 className="text-[2.2rem] font-medium mb-5">Хотите сотрудничать с технопарком?</h4>
              <p className="text-kv-text text-xl mb-3 max-w-[680px] mx-auto">
                Образовательные учреждения могут просматривать каталог КОП, запрашивать апробацию и оставлять обратную связь.
              </p>
              <p className="text-kv-muted mb-10">Студенты — подать заявку на практику и начать работу в технопарке.</p>
              <a
                href="https://technopark.herzen.spb.ru"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-kv-blue text-white px-[50px] py-4 rounded-full text-[1.1rem] font-medium no-underline hover:bg-kv-dark transition-colors"
              >
                Написать нам
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

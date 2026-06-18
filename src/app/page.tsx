import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Box, Calendar, Zap, MapPin, Globe, Mail, MessageCircle, Hash, MessageSquare } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { contacts } from '@/data'

const WorkshopsSection = dynamic(() => import('@/components/WorkshopsSection'), { ssr: false })
const DocsSection = dynamic(() => import('@/components/DocsSection'), { ssr: false })
const AIAssistant = dynamic(() => import('@/components/AIAssistant'), { ssr: false })

const contactIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MapPin, Globe, Mail, MessageCircle, Hash, MessageSquare,
}

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
          <div className="container-kv relative z-10 max-w-[800px]">
            <p className="text-[0.9rem] uppercase tracking-[0.2em] text-kv-blue font-medium mb-6">
              ПЕДАГОГИЧЕСКИЙ ТЕХНОПАРК «Кванториум им. К. Д. Ушинского»
            </p>
            <h1 className="text-[clamp(3rem,10vw,5.2rem)] font-semibold tracking-tight leading-[1.1] mb-8">
              Проектная деятельность<br />практики на базе технопарка
            </h1>
            <p className="text-2xl font-light text-[#252e44] mb-12">· РГПУ им. А.И. Герцена</p>
            <div className="flex flex-wrap gap-3 max-[600px]:flex-col max-[600px]:items-start">
              <Link href="/cabinet" className="btn-primary">Войти в кабинет</Link>
              <a href="#formats" className="btn-outline">О практиках</a>
            </div>
          </div>
        </section>

        {/* Форматы практики */}
        <section className="section-kv" id="formats">
          <div className="container-kv">
            <h2 className="text-[2.8rem] font-medium tracking-tight mb-8">Два формата практики</h2>
            <p className="text-xl font-light text-kv-text max-w-[700px] mb-10">Практики реализовываются в двух форматах</p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8 mt-10">
              <div className="card-kv">
                <Calendar className="w-12 h-12 text-kv-blue mb-7 stroke-[1.5]" />
                <h3 className="text-[2rem] font-medium mb-5">А1 · Семестр</h3>
                <p className="text-kv-text font-light mb-7 text-lg leading-relaxed">
                  Практика в течение семестра, гибкое расписание, больше времени на разработку и тестирование.
                </p>
                <span className="tag-kv">длительный трек</span>
              </div>
              <div className="card-kv">
                <Zap className="w-12 h-12 text-kv-blue mb-7 stroke-[1.5]" />
                <h3 className="text-[2rem] font-medium mb-5">А2 · Интенсив</h3>
                <p className="text-kv-text font-light mb-7 text-lg leading-relaxed">
                  Неделя плотной работы. Каждый день — новый этап. Для тех, кто любит быстрый результат и готов к погружению.
                </p>
                <span className="tag-kv">короткий трек</span>
              </div>
            </div>
          </div>
        </section>

        {/* Коробочные комплекты */}
        <section className="section-kv">
          <div className="container-kv">
            <div className="bg-white rounded-[3.75rem] px-[60px] py-[70px] flex flex-wrap gap-[60px] items-center border border-kv-border">
              <div className="flex-[2] min-w-[320px]">
                <h3 className="text-[2.5rem] font-medium mb-7">Коробочные образовательные комплекты</h3>
                <p className="text-xl font-light text-[#383f5a] mb-10 max-w-[550px] leading-[1.7]">
                  Готовые образовательные решения. Студенты разрабатывают уникальные комплекты, дополняя их инструкциями и методикой.
                </p>
                <Link href="/catalog" className="btn-primary">Все комплекты</Link>
              </div>
              <div className="flex-1 text-center text-kv-blue">
                <Box className="w-40 h-40 mx-auto stroke-[1.2]" />
              </div>
            </div>
          </div>
        </section>

        {/* Мастер-классы (client) */}
        <WorkshopsSection />

        {/* Документы (client) */}
        <DocsSection />

        {/* Контакты */}
        <section className="section-kv">
          <div className="container-kv">
            <h2 className="text-[2.8rem] font-medium tracking-tight mb-12">Контакты</h2>
            <div className="flex flex-wrap justify-center gap-4 my-[50px]">
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
                    <Icon className="w-[18px] h-[18px] text-kv-blue stroke-[1.5]" />
                    <span>{c.text}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </section>

        {/* Студенческие проекты */}
        <section className="section-kv">
          <div className="container-kv">
            <div className="bg-kv-light rounded-[4.375rem] px-[50px] py-[60px] flex items-center justify-between flex-wrap gap-8 mt-10">
              <div>
                <h4 className="text-[2rem] font-medium mb-3">Коробочные образовательные комплекты</h4>
                <p className="text-[#384362] text-lg max-w-[550px]">
                  Посмотрите комплекты, реализованные студентами на базе технопарка
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
              <h4 className="text-[2.2rem] font-medium mb-5">Хотите пройти практику на базе технопарка?</h4>
              <p className="text-kv-text text-xl mb-10 max-w-[600px] mx-auto">
                Напишите нам, и мы договоримся о сотрудничестве
              </p>
              <a
                href="https://technopark.herzen.spb.ru"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-kv-blue text-white px-[50px] py-4 rounded-full text-[1.1rem] font-medium no-underline hover:bg-kv-dark transition-colors"
              >
                Связаться
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

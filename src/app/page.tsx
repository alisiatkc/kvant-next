import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowRight, Box, Calendar, CheckCircle2, FileCheck2, Globe2,
  Hash, Mail, MapPin, MessageCircle, MessageSquare, Users, Zap,
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { contacts } from '@/data'

const WorkshopsSection = dynamic(() => import('@/components/WorkshopsSection'), { ssr: false })
const DocsSection = dynamic(() => import('@/components/DocsSection'), { ssr: false })
const AIAssistant = dynamic(() => import('@/components/AIAssistant'), { ssr: false })
const AgileSection = dynamic(() => import('@/components/AgileSection'), { ssr: false })

const contactIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MapPin, Globe: Globe2, Mail, MessageCircle, Hash, MessageSquare,
}

const route = [
  { number: '01', title: 'Замысел', text: 'Проблема, пользователи и ожидаемый результат' },
  { number: '02', title: 'Проект', text: 'Спринты, задачи и работа команды' },
  { number: '03', title: 'Апробация', text: 'Проверка решения и обратная связь' },
  { number: '04', title: 'Передача опыта', text: 'Архив проекта или публикация КОП' },
]

export default function HomePage() {
  return (
    <>
      <Header active="home" />
      <main>
        <section className="border-b border-kv-border bg-kv-bg">
          <div className="container-kv grid min-h-[680px] items-center gap-12 py-16 min-[900px]:grid-cols-[1.08fr_.92fr] min-[900px]:py-24">
            <div>
              <p className="mb-7 max-w-[580px] text-sm leading-relaxed text-kv-muted">
                Педагогический технопарк «Кванториум им. К. Д. Ушинского» · РГПУ им. А. И. Герцена
              </p>
              <h1 className="mb-7 max-w-[760px] text-[clamp(2.7rem,7vw,5.5rem)] font-semibold leading-[.98] tracking-[-0.045em]">
                Рабочая среда студенческих проектов
              </h1>
              <p className="mb-9 max-w-[640px] text-lg leading-relaxed text-kv-text min-[640px]:text-xl">
                Здесь команда планирует работу, сохраняет ход проекта, получает обратную связь
                и готовит результат к апробации.
              </p>
              <div className="flex flex-col gap-3 min-[480px]:flex-row">
                <Link href="/cabinet" className="btn-primary inline-flex items-center justify-center gap-2">
                  Перейти в рабочую среду <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#cycle" className="btn-outline inline-flex items-center justify-center">
                  Посмотреть проектный цикл
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="border border-kv-border border-t-4 border-t-kv-cyan bg-[#FAF8F3] p-6 shadow-card min-[640px]:p-9">
                <div className="mb-8 flex items-start justify-between gap-5 border-b border-kv-border pb-6">
                  <div>
                    <p className="mb-2 text-sm text-kv-muted">Маршрут команды</p>
                    <h2 className="text-2xl font-semibold tracking-tight">От замысла к проверенному решению</h2>
                  </div>
                  <FileCheck2 className="h-7 w-7 flex-shrink-0 text-kv-blue" strokeWidth={1.5} />
                </div>
                <ol className="space-y-0">
                  {route.map((step, index) => (
                    <li key={step.number} className="grid grid-cols-[36px_1fr] gap-4">
                      <div className="flex flex-col items-center">
                        <span className="flex h-9 w-9 items-center justify-center border border-kv-blue bg-[#FAF8F3] text-xs font-semibold text-kv-blue">
                          {step.number}
                        </span>
                        {index < route.length - 1 && <span className="h-full w-px bg-kv-border" />}
                      </div>
                      <div className={index < route.length - 1 ? 'pb-7' : ''}>
                        <h3 className="mb-1 font-semibold">{step.title}</h3>
                        <p className="text-sm leading-relaxed text-kv-muted">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="absolute -bottom-3 -right-3 -z-10 h-full w-full border border-kv-border bg-[#DED6CA]" aria-hidden />
            </div>
          </div>
        </section>

        <section className="section-kv" id="formats">
          <div className="container-kv">
            <div className="mb-12 max-w-[720px]">
              <h2 className="mb-4 text-[clamp(2rem,5vw,3.2rem)] font-semibold tracking-tight">Два формата практики</h2>
              <p className="text-lg leading-relaxed text-kv-text">
                Семестровая практика и интенсив проходят по одному проектному циклу.
                Меняется темп, но сохраняются этапы, фиксация решений и работа с обратной связью.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden border border-kv-border bg-kv-border min-[760px]:grid-cols-2">
              <article className="bg-[#FAF8F3] p-7 min-[640px]:p-10">
                <div className="mb-8 flex items-center justify-between gap-4">
                  <Calendar className="h-8 w-8 text-kv-blue" strokeWidth={1.5} />
                  <span className="text-sm text-kv-muted">16 недель</span>
                </div>
                <h3 className="mb-4 text-2xl font-semibold">Семестровая практика</h3>
                <p className="mb-6 leading-relaxed text-kv-text">
                  Команда последовательно проходит спринты параллельно с учебными занятиями,
                  возвращается к решениям и дорабатывает проект по результатам обсуждений.
                </p>
                <ul className="space-y-3 text-sm text-kv-muted">
                  {['Шесть проектных итераций', 'Регулярные контрольные точки', 'Время на апробацию и доработку'].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-kv-blue" /> {item}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="bg-[#EDE5DA] p-7 min-[640px]:p-10">
                <div className="mb-8 flex items-center justify-between gap-4">
                  <Zap className="h-8 w-8 text-kv-blue" strokeWidth={1.5} />
                  <span className="text-sm text-kv-muted">5 дней</span>
                </div>
                <h3 className="mb-4 text-2xl font-semibold">Проектный интенсив</h3>
                <p className="mb-6 leading-relaxed text-kv-text">
                  Команда сосредоточенно проходит путь от постановки задачи до прототипа
                  и составляет план дальнейшей проверки результата.
                </p>
                <ul className="space-y-3 text-sm text-kv-muted">
                  {['Короткие рабочие циклы', 'Ежедневная фиксация результата', 'Прототип и план апробации'].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-kv-blue" /> {item}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <AgileSection />

        <section className="section-kv">
          <div className="container-kv">
            <div className="grid gap-10 border-y border-kv-border py-12 min-[840px]:grid-cols-[.75fr_1.25fr] min-[840px]:items-start min-[840px]:py-16">
              <div>
                <Box className="mb-6 h-12 w-12 text-kv-blue" strokeWidth={1.25} />
                <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-tight">
                  Проект не обязан становиться КОП
                </h2>
              </div>
              <div>
                <p className="mb-5 text-lg leading-relaxed text-kv-text">
                  Внутренний проект сохраняется в архиве как история работы команды.
                  Для публичной витрины команда отдельно готовит понятную и проверенную версию,
                  которой сможет воспользоваться другой педагог.
                </p>
                <p className="mb-8 leading-relaxed text-kv-muted">
                  Исследовательский, конструкторский, методический или цифровой результат
                  можно адаптировать в коробочный образовательный комплект: добавить сценарий,
                  инструкцию, материалы и описание условий применения.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/catalog" className="btn-primary inline-flex items-center gap-2">
                    Открыть каталог <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/cabinet" className="btn-outline">Начать проект</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <WorkshopsSection />
        <DocsSection />

        <section className="section-kv">
          <div className="container-kv grid gap-10 min-[840px]:grid-cols-[.8fr_1.2fr]">
            <div>
              <h2 className="mb-4 text-[clamp(2rem,5vw,3rem)] font-semibold tracking-tight">Контакты</h2>
              <p className="max-w-[420px] text-lg leading-relaxed text-kv-text">
                Вопросы о практике, апробации проектов и сотрудничестве с технопарком.
              </p>
            </div>
            <div className="divide-y divide-kv-border border-y border-kv-border">
              {contacts.map((contact) => {
                const Icon = contactIconMap[contact.icon] ?? MapPin
                return (
                  <a
                    key={contact.text}
                    href={contact.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-5 py-4 text-kv-dark no-underline transition-colors hover:text-kv-blue"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
                      {contact.text}
                    </span>
                    <ArrowRight className="h-4 w-4 flex-shrink-0" />
                  </a>
                )
              })}
            </div>
          </div>
        </section>

        <section className="pb-16 pt-4 min-[640px]:pb-24">
          <div className="container-kv">
            <div className="grid gap-8 bg-kv-dark p-7 text-white min-[760px]:grid-cols-[1fr_auto] min-[760px]:items-center min-[640px]:p-12">
              <div>
                <Users className="mb-5 h-7 w-7 text-white/70" strokeWidth={1.5} />
                <h2 className="mb-3 text-2xl font-semibold">Сотрудничество и площадки для апробации</h2>
                <p className="max-w-[720px] leading-relaxed text-white/65">
                  Образовательные учреждения могут изучать опубликованные решения,
                  предлагать площадки для проверки и оставлять содержательную обратную связь.
                </p>
              </div>
              <a
                href="https://technopark.herzen.spb.ru"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-white/30 px-7 py-3.5 text-white no-underline transition-colors hover:bg-[#FAF8F3] hover:text-kv-dark"
              >
                Связаться <ArrowRight className="h-4 w-4" />
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

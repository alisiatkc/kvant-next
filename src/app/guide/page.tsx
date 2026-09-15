import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FolderKanban,
  Lightbulb,
  MessageSquareText,
  ShieldCheck,
  Users,
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const steps = [
  {
    icon: Users,
    title: 'Соберите команду',
    text: 'Войдите по коду команды, укажите участников, роли и сроки работы.',
  },
  {
    icon: Lightbulb,
    title: 'Заполните паспорт проекта',
    text: 'Зафиксируйте проблему, цель, целевую аудиторию и ожидаемый результат.',
  },
  {
    icon: FolderKanban,
    title: 'Спланируйте работу',
    text: 'Разделите проект на спринты и задачи, назначьте ответственных и меняйте статусы на доске.',
  },
  {
    icon: MessageSquareText,
    title: 'Получайте обратную связь',
    text: 'Сохраняйте заметки и материалы, показывайте промежуточный результат куратору и учитывайте комментарии.',
  },
  {
    icon: ClipboardList,
    title: 'Проведите апробацию',
    text: 'Опишите участников, условия, инструменты и результаты проверки созданного решения.',
  },
  {
    icon: FileCheck2,
    title: 'Адаптируйте результат в КОП',
    text: 'Любой внутренний проект — исследовательский, методический или цифровой — можно оформить как комплект для повторного применения.',
  },
]

export default function GuidePage() {
  return (
    <>
      <Header active="guide" />
      <main>
        <section className="section-kv bg-[#f5f7fb]">
          <div className="container-kv max-w-[960px]">
            <span className="text-kv-blue text-xs font-semibold uppercase tracking-widest">Памятка участника</span>
            <h1 className="text-[clamp(2.4rem,7vw,4.5rem)] font-semibold tracking-tight leading-[1.05] mt-3 mb-5">
              Как работать с проектом
            </h1>
            <p className="text-lg min-[640px]:text-xl font-light text-kv-text leading-relaxed max-w-[760px]">
              Проектный навигатор помогает команде пройти единый цикл: от замысла и распределения задач до апробации результата и его оформления в КОП.
            </p>
          </div>
        </section>

        <section className="section-kv">
          <div className="container-kv max-w-[960px]">
            <div className="grid min-[700px]:grid-cols-2 gap-5">
              {steps.map(({ icon: Icon, title, text }, index) => (
                <article key={title} className="card-kv relative">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-kv-light text-kv-blue flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 stroke-[1.7]" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-kv-muted uppercase tracking-widest">Шаг {index + 1}</span>
                      <h2 className="text-xl font-semibold mt-1 mb-2">{title}</h2>
                      <p className="text-kv-text font-light leading-relaxed">{text}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 rounded-[2rem] bg-[#f3eeff] border border-[#4c1d9520] p-6 min-[640px]:p-8 flex gap-4">
              <ShieldCheck className="w-7 h-7 text-[#4C1D95] flex-shrink-0" />
              <div>
                <h2 className="text-lg font-semibold mb-2">Во время пилотной апробации</h2>
                <p className="text-kv-text leading-relaxed">
                  Используйте обезличенные учебные данные. Не размещайте персональные сведения и конфиденциальные файлы, пока не завершены серверная авторизация и защищённое хранение материалов.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col min-[480px]:flex-row gap-3">
              <Link href="/cabinet" className="btn-primary inline-flex items-center justify-center gap-2">
                Перейти в кабинет <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/catalog" className="btn-outline inline-flex items-center justify-center gap-2">
                Посмотреть проекты
              </Link>
            </div>

            <div className="mt-12 border-t border-kv-border pt-8">
              <h2 className="text-2xl font-semibold mb-5">Перед завершением работы проверьте</h2>
              <ul className="grid min-[640px]:grid-cols-2 gap-3 text-kv-text">
                {[
                  'У проекта сформулированы проблема, цель и результат',
                  'Участники понимают роли и ближайшие задачи',
                  'Решения и изменения зафиксированы в заметках',
                  'Получена и учтена обратная связь куратора',
                  'Описаны условия и результаты апробации',
                  'Подготовлены материалы для повторного применения',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-kv-blue flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

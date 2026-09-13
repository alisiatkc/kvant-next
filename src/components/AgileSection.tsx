'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  Zap, Layers, Hammer, Eye, Pencil, BarChart3,
  CheckCircle2, Cpu, ArrowRight,
} from 'lucide-react'

type Step = {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  tag: string
  num: string
  title: string
  desc: string
  tasks: string[]
  result: string
}

// Two alternating accents — navy and violet, both in the blue-purple family
const ACCENT = ['#2B3B6B', '#4C1D95', '#2B3B6B', '#4C1D95', '#2B3B6B', '#4C1D95']
const ACCENT_BG = ['#EEF3FF', '#F3EEFF', '#EEF3FF', '#F3EEFF', '#EEF3FF', '#F3EEFF']

const steps: Step[] = [
  {
    icon: Zap,
    tag: 'Старт', num: '01',
    title: 'Идея и целеполагание',
    desc: 'Команда определяет проблему и замысел внутреннего проекта, изучает существующие решения и возможности технопарка. Проект может быть исследовательским, конструкторским, методическим или цифровым. Ключевой вопрос этапа: «Какой результат мы создаём и для кого?»',
    tasks: [
      'Формулировка темы, проблемы и ожидаемого результата',
      'Изучение аналогов и методических материалов',
      'Определение пользователей и образовательного контекста',
      'Выбор оборудования и технологий технопарка',
    ],
    result: 'Концепция внутреннего проекта',
  },
  {
    icon: Layers,
    tag: 'Планирование', num: '02',
    title: 'Структурирование проекта',
    desc: 'Команда переводит идею в конкретный план: составляется перечень задач, распределяются роли участников, устанавливаются контрольные точки. Основной документ этапа — паспорт проекта, который фиксируется в Проектном навигаторе.',
    tasks: [
      'Составление и расстановка приоритетов задач',
      'Распределение ролей и ответственности в команде',
      'Заполнение паспорта проекта в Проектном навигаторе',
      'Определение контрольных точек и сроков работы',
    ],
    result: 'Паспорт проекта и план работы',
  },
  {
    icon: Hammer,
    tag: 'Создание', num: '03',
    title: 'Разработка прототипа',
    desc: 'Команда создаёт первый проверяемый результат: прототип, исследовательскую модель, методику, цифровой продукт или комплект материалов. Цель — как можно раньше получить основу для обсуждения и проверки.',
    tasks: [
      'Работа на оборудовании технопарка',
      'Создание компонентов, данных или материалов проекта',
      'Сборка и первичная проверка прототипа',
      'Самооценка и устранение выявленных недостатков',
    ],
    result: 'Проверяемый результат проекта',
  },
  {
    icon: Eye,
    tag: 'Оценка', num: '04',
    title: 'Экспертная оценка',
    desc: 'Готовый прототип направляется куратору через Проектный навигатор. Куратор изучает материалы, формулирует замечания и предложения по доработке. На основе полученной обратной связи команда корректирует план задач.',
    tasks: [
      'Загрузка материалов в Проектный навигатор',
      'Получение и разбор замечаний куратора',
      'Оценка трудоёмкости необходимых доработок',
      'Обновление плана задач с учётом рекомендаций',
    ],
    result: 'Заключение куратора с рекомендациями',
  },
  {
    icon: Pencil,
    tag: 'Апробация', num: '05',
    title: 'Апробация в учреждении',
    desc: 'Доработанное решение проверяется в условиях, соответствующих замыслу проекта. Команда проводит занятие, исследование или демонстрацию, собирает данные и фиксирует результаты апробации.',
    tasks: [
      'Проведение занятия, исследования или демонстрации',
      'Наблюдение за работой целевой аудитории',
      'Сбор обратной связи и исследовательских данных',
      'Анализ результатов и внесение итоговых корректив',
    ],
    result: 'Протокол апробации',
  },
  {
    icon: BarChart3,
    tag: 'Итог', num: '06',
    title: 'Рефлексия и публикация',
    desc: 'Команда фиксирует достижения и точки роста, оформляет итог проекта и решает, как адаптировать его в воспроизводимое образовательное решение. Подготовленный КОП может быть опубликован в каталоге технопарка.',
    tasks: [
      'Командная рефлексия: достижения и точки роста',
      'Оформление итогового результата проекта',
      'Адаптация результата в формат КОП',
      'Представление результатов руководителю практики',
    ],
    result: 'Итог проекта и версия КОП',
  },
]

export default function AgileSection() {
  const [active, setActive] = useState(0)
  const step = steps[active]
  const accent = ACCENT[active]
  const bg = ACCENT_BG[active]
  const Icon = step.icon

  return (
    <section className="section-kv" id="cycle">
      <div className="container-kv">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-kv-blue text-xs font-semibold uppercase tracking-widest">Методология Agile</span>
            <h2 className="text-[clamp(2rem,5vw,3rem)] font-semibold tracking-tight mt-2 mb-3">Проектный цикл</h2>
            <p className="text-kv-text font-light text-lg max-w-[540px] leading-relaxed">
              Шесть этапов от замысла до апробации, упаковки результата и передачи опыта. После каждого — обратная связь куратора.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-kv-dark text-white px-5 py-3 rounded-full text-sm font-medium flex-shrink-0">
            <Cpu className="w-4 h-4 opacity-70" />
            Agile · Kanban · Scrum
          </div>
        </div>

        {/* Tab numbers — left to right */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="flex-shrink-0 w-14 h-14 rounded-2xl text-[0.95rem] font-bold transition-all duration-200 border cursor-pointer"
              style={
                active === i
                  ? {
                      background: ACCENT[i],
                      color: 'white',
                      borderColor: ACCENT[i],
                      boxShadow: `0 4px 14px ${ACCENT[i]}50`,
                    }
                  : {
                      background: 'white',
                      color: '#94a3b8',
                      borderColor: '#e2e8f0',
                    }
              }
            >
              {s.num}
            </button>
          ))}
        </div>

        {/* Single card — switches on tab click */}
        <div
          className="rounded-[2rem] p-7 min-[640px]:p-10 border"
          style={{ background: bg, borderColor: `${accent}20` }}
        >
          {/* Card header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                <Icon className="w-7 h-7" style={{ color: accent }} />
              </div>
              <div>
                <div className="text-[0.68rem] font-bold uppercase tracking-widest mb-1"
                  style={{ color: accent }}>
                  Этап {step.num}
                </div>
                <h3 className="text-[1.2rem] min-[640px]:text-[1.5rem] font-semibold text-kv-dark leading-tight">
                  {step.title}
                </h3>
              </div>
            </div>
            <span
              className="flex-shrink-0 text-[0.72rem] font-bold uppercase tracking-widest px-4 py-2 rounded-full text-white"
              style={{ background: accent }}
            >
              {step.tag}
            </span>
          </div>

          {/* Description */}
          <p className="text-kv-text text-[0.97rem] leading-relaxed mb-6 max-w-[680px]">
            {step.desc}
          </p>

          {/* Task grid */}
          <div className="grid grid-cols-1 min-[540px]:grid-cols-2 gap-2.5 mb-6">
            {step.tasks.map((t) => (
              <div key={t} className="flex items-start gap-2.5 bg-white/70 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accent }} />
                <span className="text-[0.87rem] text-kv-dark leading-snug">{t}</span>
              </div>
            ))}
          </div>

          {/* Result */}
          <div className="flex items-center gap-3 pt-5 border-t border-white/60">
            <span className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: accent }}>
              Результат:
            </span>
            <span className="text-[0.85rem] font-semibold px-4 py-1.5 rounded-full bg-white"
              style={{ color: accent }}>
              {step.result}
            </span>
          </div>
        </div>

        {/* Callout */}
        <div className="mt-6 bg-kv-dark rounded-[2rem] p-7 min-[640px]:p-8 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Инструменты Agile — прямо в Проектном навигаторе</h4>
              <p className="text-white/60 text-sm leading-relaxed max-w-[500px]">
                Канбан-доска с WIP-лимитами, трекер задач с флагом блокировки, заметки команды и ИИ-ассистент — всё встроено в рабочее пространство.
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
  )
}

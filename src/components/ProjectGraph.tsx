'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Eye, Filter, Move, Network, Search } from 'lucide-react'
import type { SubmittedProject } from '@/lib/storage'

type Point = { x: number; y: number }

type Props = {
  projects: SubmittedProject[]
  onOpen: (project: SubmittedProject) => void
}

const WIDTH = 920
const HEIGHT = 520
const TRACK_CENTERS: Record<string, Point> = {
  'А1': { x: 230, y: 255 },
  'А2': { x: 465, y: 255 },
  'А3': { x: 700, y: 255 },
}

const STATUS_COLORS: Record<SubmittedProject['status'], string> = {
  feedback_requested: '#2563eb',
  review: '#d97706',
  approved: '#16a34a',
  rejected: '#dc2626',
}

const STATUS_LABELS: Record<SubmittedProject['status'], string> = {
  feedback_requested: 'Ждёт обратной связи',
  review: 'На рассмотрении',
  approved: 'Одобрено',
  rejected: 'Требует доработки',
}

function subjectKey(project: SubmittedProject): string {
  const value = `${project.projectBlock} ${project.projectName}`.toLowerCase()
  if (/математ|алгебр|геометр/.test(value)) return 'Математика'
  if (/биолог|экол|природ/.test(value)) return 'Естественные науки'
  if (/физик|робот|технич|конструкт/.test(value)) return 'Технологии'
  if (/информат|програм|цифров|код/.test(value)) return 'Цифровые решения'
  if (/педагог|метод|образован|обучен/.test(value)) return 'Методика'
  return project.projectBlock.trim() || 'Другое'
}

function progressOf(project: SubmittedProject): number {
  const tasks = project.workspaceSnapshot?.tasks ?? []
  if (tasks.length > 0) return Math.round((tasks.filter((task) => task.status === 'done').length / tasks.length) * 100)
  if (project.status === 'approved') return 100
  if (project.status === 'review') return 75
  if (project.status === 'feedback_requested') return 50
  return 35
}

function shortLabel(value: string, max = 22): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

export default function ProjectGraph({ projects, onOpen }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [track, setTrack] = useState('all')
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [positions, setPositions] = useState<Record<string, Point>>({})
  const [dragging, setDragging] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return projects.filter((project) => {
      const matchesTrack = track === 'all' || project.track === track
      const matchesStatus = status === 'all' || project.status === status
      const haystack = `${project.projectName} ${project.teamName} ${project.projectBlock}`.toLowerCase()
      return matchesTrack && matchesStatus && (!normalizedQuery || haystack.includes(normalizedQuery))
    })
  }, [projects, query, status, track])

  useEffect(() => {
    setPositions((current) => {
      const next = { ...current }
      const grouped: Record<string, SubmittedProject[]> = {}
      filtered.forEach((project) => {
        const key = TRACK_CENTERS[project.track] ? project.track : 'А2'
        grouped[key] = [...(grouped[key] ?? []), project]
      })
      Object.entries(grouped).forEach(([key, group]) => {
        const center = TRACK_CENTERS[key]
        group.forEach((project, index) => {
          if (next[project.id]) return
          const angle = (Math.PI * 2 * index) / Math.max(group.length, 1) - Math.PI / 2
          const ring = 78 + Math.floor(index / 8) * 46
          next[project.id] = {
            x: center.x + Math.cos(angle) * ring,
            y: center.y + Math.sin(angle) * ring,
          }
        })
      })
      return next
    })
  }, [filtered])

  const relatedLinks = useMemo(() => {
    const groups = new Map<string, SubmittedProject[]>()
    filtered.forEach((project) => {
      const key = subjectKey(project)
      groups.set(key, [...(groups.get(key) ?? []), project])
    })
    return Array.from(groups.entries()).flatMap(([subject, group]) =>
      group.slice(1).map((project, index) => ({
        id: `${subject}-${project.id}`,
        from: group[index].id,
        to: project.id,
      })),
    )
  }, [filtered])

  const selected = filtered.find((project) => project.id === selectedId) ?? null
  const subjects = new Set(filtered.map(subjectKey)).size

  const pointerToSvg = (event: React.PointerEvent<SVGSVGElement>): Point | null => {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
    }
  }

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-[3rem] p-7 min-[700px]:p-10">
        <div className="flex items-start justify-between gap-5 flex-wrap mb-6">
          <div>
            <span className="text-kv-blue text-xs font-semibold uppercase tracking-widest">Обзор проектной среды</span>
            <h2 className="text-[1.4rem] font-semibold mt-1 mb-2 flex items-center gap-2">
              <Network className="w-5 h-5 text-kv-blue" /> Карта проектов
            </h2>
            <p className="text-kv-muted text-sm max-w-[690px] leading-relaxed">
              Узлы — студенческие проекты, крупные центры — форматы команд. Пунктир связывает проекты близкой предметной области. Перетаскивайте узлы и нажимайте на них, чтобы открыть рабочее пространство.
            </p>
          </div>
          <div className="flex gap-2 text-center">
            <div className="bg-kv-light rounded-2xl px-4 py-2"><strong className="block text-lg">{filtered.length}</strong><span className="text-[10px] text-kv-muted">проектов</span></div>
            <div className="bg-kv-light rounded-2xl px-4 py-2"><strong className="block text-lg">{subjects}</strong><span className="text-[10px] text-kv-muted">областей</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 min-[760px]:grid-cols-[1fr_auto_auto] gap-3 mb-5">
          <label className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-kv-muted" />
            <input className="input-kv pl-11" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск проекта, команды или области" />
          </label>
          <label className="flex items-center gap-2 bg-kv-light rounded-2xl px-4">
            <Filter className="w-4 h-4 text-kv-muted" />
            <select className="bg-transparent border-none outline-none py-3 text-sm" value={track} onChange={(event) => setTrack(event.target.value)}>
              <option value="all">Все треки</option><option value="А1">А1</option><option value="А2">А2</option><option value="А3">А3</option>
            </select>
          </label>
          <select className="bg-kv-light rounded-2xl border-none outline-none px-4 py-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Все статусы</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        <div className="rounded-[2rem] overflow-hidden border border-kv-border bg-[#f8fafc] relative">
          <div className="absolute z-10 top-4 left-4 bg-white/90 backdrop-blur rounded-xl px-3 py-2 text-[11px] text-kv-muted flex items-center gap-1.5 shadow-sm pointer-events-none">
            <Move className="w-3.5 h-3.5" /> Узлы можно перемещать
          </div>
          {filtered.length === 0 ? (
            <div className="h-[420px] flex items-center justify-center text-sm text-kv-muted">По выбранным фильтрам проектов нет</div>
          ) : (
            <svg
              ref={svgRef}
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="w-full h-auto min-h-[420px] touch-none"
              onPointerMove={(event) => {
                if (!dragging) return
                const point = pointerToSvg(event)
                if (!point) return
                setPositions((current) => ({ ...current, [dragging]: { x: Math.max(35, Math.min(WIDTH - 35, point.x)), y: Math.max(45, Math.min(HEIGHT - 35, point.y)) } }))
              }}
              onPointerUp={() => setDragging(null)}
              onPointerLeave={() => setDragging(null)}
            >
              <defs>
                <pattern id="project-grid" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#dbe4f0" /></pattern>
              </defs>
              <rect width={WIDTH} height={HEIGHT} fill="url(#project-grid)" />

              {Object.entries(TRACK_CENTERS).map(([key, center]) => (
                <g key={key} opacity={track === 'all' || track === key ? 1 : 0.18}>
                  <circle cx={center.x} cy={center.y} r="48" fill="#e8eefc" stroke="#2B3B6B" strokeWidth="2" />
                  <text x={center.x} y={center.y - 3} textAnchor="middle" className="fill-kv-dark text-[18px] font-bold">{key}</text>
                  <text x={center.x} y={center.y + 16} textAnchor="middle" className="fill-kv-muted text-[10px]">формат команды</text>
                </g>
              ))}

              {filtered.map((project) => {
                const point = positions[project.id]
                const center = TRACK_CENTERS[project.track] ?? TRACK_CENTERS.А2
                if (!point) return null
                return <line key={`track-${project.id}`} x1={center.x} y1={center.y} x2={point.x} y2={point.y} stroke="#c7d2e3" strokeWidth="1.5" />
              })}
              {relatedLinks.map((link) => {
                const from = positions[link.from]
                const to = positions[link.to]
                if (!from || !to) return null
                return <line key={link.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#7c3aed" strokeOpacity="0.42" strokeWidth="2" strokeDasharray="6 5" />
              })}

              {filtered.map((project) => {
                const point = positions[project.id]
                if (!point) return null
                const tasks = project.workspaceSnapshot?.tasks?.length ?? 0
                const radius = Math.min(27, 17 + tasks * 1.5)
                const progress = progressOf(project)
                const circumference = 2 * Math.PI * (radius + 5)
                const color = STATUS_COLORS[project.status]
                return (
                  <g key={project.id} role="button" tabIndex={0} className="cursor-grab focus:outline-none"
                    transform={`translate(${point.x} ${point.y})`}
                    onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(project.id); setSelectedId(project.id) }}
                    onDoubleClick={() => onOpen(project)}
                    onKeyDown={(event) => { if (event.key === 'Enter') onOpen(project) }}>
                    <circle r={radius + 5} fill="white" stroke="#e2e8f0" strokeWidth="4" />
                    <circle r={radius + 5} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={`${circumference * progress / 100} ${circumference}`}
                      transform="rotate(-90)" />
                    <circle r={radius} fill={selectedId === project.id ? '#1e2a4a' : color} opacity="0.96" />
                    <text y="4" textAnchor="middle" className="fill-white text-[10px] font-bold">{progress}%</text>
                    <rect x="-62" y={radius + 9} width="124" height="19" rx="9.5" fill="white" opacity="0.94" />
                    <text y={radius + 22} textAnchor="middle" className="fill-kv-dark text-[10px] font-medium">{shortLabel(project.projectName || project.teamName)}</text>
                    <title>{project.projectName} · {project.teamName} · {subjectKey(project)} · {progress}%</title>
                  </g>
                )
              })}
            </svg>
          )}
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-xs text-kv-muted">
          {Object.entries(STATUS_LABELS).map(([value, label]) => <span key={value} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[value as SubmittedProject['status']] }} />{label}</span>)}
          <span className="ml-auto">Кольцо узла показывает прогресс выполнения задач</span>
        </div>

        {selected && (
          <div className="mt-5 rounded-[1.75rem] bg-kv-light p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold">{selected.projectName || 'Без названия'}</p>
              <p className="text-sm text-kv-muted mt-1">{selected.teamName} · {subjectKey(selected)} · трек {selected.track} · выполнено {progressOf(selected)}%</p>
            </div>
            <button className="btn-blue" onClick={() => onOpen(selected)}><Eye className="w-4 h-4" /> Открыть проект</button>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 min-[700px]:grid-cols-3 gap-4">
        {[
          ['Поиск связей', 'Увидеть проекты одной предметной области и предложить командам обмен методиками, данными или результатами апробации.'],
          ['Кураторская диагностика', 'Найти изолированные проекты, перегруженные кластеры и команды с низким прогрессом, которым нужна адресная поддержка.'],
          ['Организация сообщества', 'Формировать тематические мини-группы, взаимное рецензирование и совместные встречи между треками.'],
        ].map(([title, text]) => (
          <div key={title} className="bg-white rounded-[2rem] p-6">
            <h3 className="font-semibold mb-2">{title}</h3><p className="text-sm text-kv-muted leading-relaxed">{text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

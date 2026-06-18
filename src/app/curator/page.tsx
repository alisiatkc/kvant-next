'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, LogOut, Eye, Users, ChevronDown, ChevronUp, Paperclip, File, FileText } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  type SubmittedProject,
  type CatalogEntry,
  getSubmittedProjects,
  updateProjectStatus,
} from '@/lib/storage'

function detectSubject(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('математик') || t.includes('алгебр') || t.includes('геометр')) return 'math'
  if (t.includes('биолог') || t.includes('природ') || t.includes('экологи')) return 'bio'
  if (t.includes('физик')) return 'physics'
  if (t.includes('информатик') || t.includes('програм') || t.includes('алгоритм') || t.includes('код')) return 'it'
  if (t.includes('экономик') || t.includes('финанс') || t.includes('бизнес')) return 'economics'
  if (t.includes('педагогик') || t.includes('дошкол') || t.includes('речь') || t.includes('детск') || t.includes('логопед')) return 'pedagogy'
  return 'it'
}

const SUBJECT_EMOJI: Record<string, string> = {
  math: '📐', bio: '🧬', physics: '⚡', it: '💻', economics: '💰', pedagogy: '📚',
}
const SUBJECT_TECH: Record<string, string[]> = {
  math:      ['Лазерная резка', 'Фанера 3мм'],
  bio:       ['3D-печать', 'PLA пластик'],
  physics:   ['Лазерная резка', 'Электроника'],
  it:        ['Программирование', 'Arduino'],
  economics: ['Полиграфия', 'Дизайн'],
  pedagogy:  ['Печать', 'Ламинация'],
}

const STATUS_CFG = {
  review:   { label: 'На рассмотрении', Icon: Clock,         cls: 'bg-[#fff3e0] text-[#ef6c00]' },
  approved: { label: 'Одобрено',         Icon: CheckCircle,  cls: 'bg-[#e8f5e9] text-[#2e7d32]' },
  rejected: { label: 'Отклонено',        Icon: XCircle,      cls: 'bg-[#ffebee] text-[#c62828]' },
}

function numericId(sid: string): number {
  return parseInt(sid.slice(-7)) + 10000
}

function buildCatalogEntry(sub: SubmittedProject): CatalogEntry {
  const subject = detectSubject(sub.projectBlock + ' ' + sub.projectName + ' ' + sub.projectDesc)
  return {
    id:       numericId(sub.id),
    title:    sub.projectName || 'Без названия',
    excerpt:  sub.projectBlock || sub.projectDesc.slice(0, 80),
    fullDesc: sub.projectDesc  || 'Описание не указано',
    subject,
    authors:  sub.authors,
    files:    sub.files.length > 0
                ? sub.files.map((f) => ({ name: f.name, icon: f.icon, size: f.size || '—' }))
                : [{ name: sub.productionFile || 'Файл проекта', icon: 'File', size: '—' }],
    image:    SUBJECT_EMOJI[subject] || '🎓',
    tech:     SUBJECT_TECH[subject]  || ['Технопарк'],
    contact:  'https://vk.com/technoparkrgpu',
    likes:    0,
  }
}

export default function CuratorPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [projects,   setProjects]   = useState<SubmittedProject[]>([])
  const [expanded,   setExpanded]   = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const loggedIn = localStorage.getItem('curatorLoggedIn') === 'true'
        if (!loggedIn) { router.push('/cabinet'); return }
        setAuthorized(true)
        const subs = await getSubmittedProjects()
        setProjects(subs)
      } catch {
        router.push('/cabinet')
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  const logout = () => {
    try { localStorage.removeItem('curatorLoggedIn') } catch {}
    router.push('/cabinet')
  }

  const handleStatus = async (id: string, status: 'approved' | 'rejected' | 'review') => {
    try {
      const sub = projects.find((p) => p.id === id)
      const catalogEntry = (status === 'approved' && sub) ? buildCatalogEntry(sub) : undefined
      await updateProjectStatus(id, status, catalogEntry)
      setProjects((prev) => prev.map((p) => p.id === id ? { ...p, status } : p))
    } catch {}
  }

  if (loading) return (
    <>
      <Header />
      <main className="container-kv py-24 text-center text-kv-muted">Загрузка…</main>
      <Footer />
    </>
  )

  if (!authorized) return null

  const counts = {
    review:   projects.filter((p) => p.status === 'review').length,
    approved: projects.filter((p) => p.status === 'approved').length,
    rejected: projects.filter((p) => p.status === 'rejected').length,
  }

  return (
    <>
      <Header />
      <main>
        <div className="container-kv py-10">

          {/* Header */}
          <div className="bg-white rounded-[3rem] p-10 mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-[2.4rem] font-medium mb-1">Панель куратора</h1>
              <p className="text-kv-text">Проверка и публикация студенческих КОП</p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 rounded-full border border-[#e2e8f0] text-kv-text cursor-pointer hover:bg-kv-light transition-colors bg-white text-base" onClick={logout}>
              <LogOut className="w-4 h-4" /> Выйти
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-5 mb-8 max-[700px]:grid-cols-1">
            {([
              { label: 'На рассмотрении', count: counts.review,   color: 'text-[#ef6c00]', bg: 'bg-[#fff3e0]' },
              { label: 'Одобрено',         count: counts.approved, color: 'text-[#2e7d32]', bg: 'bg-[#e8f5e9]' },
              { label: 'Отклонено',        count: counts.rejected, color: 'text-[#c62828]', bg: 'bg-[#ffebee]' },
            ] as const).map((s) => (
              <div key={s.label} className={`${s.bg} rounded-[2rem] p-8 text-center`}>
                <div className={`text-[2.5rem] font-semibold ${s.color} mb-1`}>{s.count}</div>
                <div className="font-medium text-sm">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Projects list */}
          <div className="bg-white rounded-[3rem] p-10">
            <h2 className="text-[2rem] font-medium mb-7 flex items-center gap-3">
              <Users className="w-6 h-6 text-kv-blue" /> Поданные проекты
            </h2>

            {projects.length === 0 ? (
              <div className="text-center py-16 text-kv-muted">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Ещё нет поданных проектов</p>
                <p className="text-sm mt-2">Студенты увидят эту панель после того, как опубликуют КОП из личного кабинета</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => {
                  const sc = STATUS_CFG[project.status]
                  const isOpen = expanded === project.id
                  const date = project.submittedAt
                    ? new Date(project.submittedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : '—'
                  return (
                    <div key={project.id} className="border border-kv-border rounded-[2rem] overflow-hidden">
                      {/* Summary row */}
                      <div className="p-7 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-medium mb-1 truncate">{project.projectName || 'Без названия'}</h3>
                          <p className="text-kv-muted text-sm">
                            Команда: <strong className="text-kv-dark">{project.teamName}</strong> · Капитан: {project.captain} · Трек: {project.track} · {date}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                          <span className={`status-badge ${sc.cls} flex items-center gap-1.5`}>
                            <sc.Icon className="w-4 h-4" /> {sc.label}
                          </span>
                          {project.status === 'review' && (
                            <>
                              <button
                                className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#e8f5e9] text-[#2e7d32] border-none cursor-pointer font-medium hover:bg-[#c8e6c9] transition-colors text-sm"
                                onClick={() => handleStatus(project.id, 'approved')}
                              >
                                <CheckCircle className="w-4 h-4" /> Одобрить
                              </button>
                              <button
                                className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#ffebee] text-[#c62828] border-none cursor-pointer font-medium hover:bg-[#ffcdd2] transition-colors text-sm"
                                onClick={() => handleStatus(project.id, 'rejected')}
                              >
                                <XCircle className="w-4 h-4" /> Отклонить
                              </button>
                            </>
                          )}
                          {project.status !== 'review' && (
                            <button
                              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-kv-light text-kv-muted border-none cursor-pointer font-medium hover:bg-[#e2e8f0] transition-colors text-sm"
                              onClick={() => handleStatus(project.id, 'review')}
                            >
                              Вернуть на рассмотрение
                            </button>
                          )}
                          <button
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-kv-light border-none cursor-pointer text-kv-muted hover:text-kv-dark hover:bg-[#e2e8f0] transition-colors text-sm"
                            onClick={() => setExpanded(isOpen ? null : project.id)}
                          >
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {isOpen ? 'Свернуть' : 'Подробнее'}
                          </button>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isOpen && (
                        <div className="border-t border-kv-border p-7 bg-[#f9fbfe] space-y-5">
                          {project.projectBlock && (
                            <div>
                              <span className="text-xs font-semibold uppercase tracking-wide text-kv-muted">Предметная область</span>
                              <p className="mt-1">{project.projectBlock}</p>
                            </div>
                          )}
                          {project.projectDesc && (
                            <div>
                              <span className="text-xs font-semibold uppercase tracking-wide text-kv-muted">Описание КОП</span>
                              <p className="mt-1 text-kv-text leading-relaxed">{project.projectDesc}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wide text-kv-muted">Состав команды</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {project.authors.map((a, i) => (
                                <span key={i} className="bg-white px-4 py-1.5 rounded-full text-sm border border-kv-border">
                                  {a}{i === 0 ? ' (капитан)' : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                          {(project.files.length > 0 || project.productionFile) && (
                            <div>
                              <span className="text-xs font-semibold uppercase tracking-wide text-kv-muted">Файлы</span>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {project.productionFile && (
                                  <span className="bg-white px-4 py-1.5 rounded-full text-sm border border-kv-blue text-kv-blue flex items-center gap-1.5">
                                    <Paperclip className="w-3.5 h-3.5" /> {project.productionFile}
                                  </span>
                                )}
                                {project.files.slice(0, 4).map((f, i) => (
                                  <span key={i} className="bg-white px-4 py-1.5 rounded-full text-sm border border-kv-border flex items-center gap-1.5">
                                    {f.icon === 'FileText' ? <FileText className="w-3.5 h-3.5 text-kv-blue" /> : <File className="w-3.5 h-3.5 text-kv-blue" />}
                                    {f.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

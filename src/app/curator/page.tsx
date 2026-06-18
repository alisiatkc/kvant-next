'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle, XCircle, Clock, LogOut, Eye, Users,
  ChevronDown, ChevronUp, Paperclip, File, FileText,
  LayoutDashboard, ClipboardList, Bell, MessageSquare,
  BookOpen, CheckCircle2, FolderOpen, Send, X, AlertTriangle,
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  type SubmittedProject,
  type CatalogEntry,
  getSubmittedProjects,
  updateProjectStatus,
} from '@/lib/storage'
import { CURATOR_ACCOUNTS } from '@/data/accounts'

function detectSubject(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('математик') || t.includes('алгебр') || t.includes('геометр')) return 'math'
  if (t.includes('биолог') || t.includes('природ') || t.includes('экологи'))    return 'bio'
  if (t.includes('физик'))                                                         return 'physics'
  if (t.includes('информатик') || t.includes('програм') || t.includes('алгоритм') || t.includes('код')) return 'it'
  if (t.includes('экономик') || t.includes('финанс') || t.includes('бизнес'))    return 'economics'
  if (t.includes('педагогик') || t.includes('дошкол') || t.includes('речь') || t.includes('детск')) return 'pedagogy'
  return 'it'
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
  feedback_requested: { label: 'Запрос обратной связи', Icon: Bell,         cls: 'bg-[#e3f2fd] text-[#1565c0]' },
  review:             { label: 'На рассмотрении',        Icon: Clock,        cls: 'bg-[#fff3e0] text-[#ef6c00]' },
  approved:           { label: 'Одобрено',                Icon: CheckCircle, cls: 'bg-[#e8f5e9] text-[#2e7d32]' },
  rejected:           { label: 'Отклонено',               Icon: XCircle,     cls: 'bg-[#ffebee] text-[#c62828]' },
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
    image:    subject,
    tech:     SUBJECT_TECH[subject] || ['Технопарк'],
    contact:  'https://vk.com/technoparkrgpu',
    likes:    0,
  }
}

type WorkspaceModal = {
  project: SubmittedProject
  feedbackDraft: string
}

type ActiveTab = 'dashboard' | 'projects'

export default function CuratorPage() {
  const router = useRouter()

  const [authorized,    setAuthorized]    = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [curatorName,   setCuratorName]   = useState('')
  const [curatorLogin,  setCuratorLogin]  = useState('')
  const [projects,      setProjects]      = useState<SubmittedProject[]>([])
  const [expanded,      setExpanded]      = useState<string | null>(null)
  const [activeTab,     setActiveTab]     = useState<ActiveTab>('dashboard')
  const [workspaceModal,setWorkspaceModal]= useState<WorkspaceModal | null>(null)
  const [feedbackSent,  setFeedbackSent]  = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const loggedIn = localStorage.getItem('curatorLoggedIn') === 'true'
        const loginName = localStorage.getItem('curatorLoginName') || ''
        if (!loggedIn || !loginName) { router.push('/cabinet'); return }
        const account = CURATOR_ACCOUNTS.find((c) => c.login === loginName)
        if (!account) { router.push('/cabinet'); return }
        setCuratorLogin(loginName)
        setCuratorName(account.name)
        setAuthorized(true)
        const subs = await getSubmittedProjects()
        setProjects(subs.filter((p) => p.curatorLogin === loginName))
      } catch {
        router.push('/cabinet')
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  const logout = () => {
    try {
      localStorage.removeItem('curatorLoggedIn')
      localStorage.removeItem('curatorId')
      localStorage.removeItem('curatorLoginName')
    } catch {}
    router.push('/cabinet')
  }

  const handleStatus = async (
    id: string,
    status: SubmittedProject['status'],
    feedbackNote?: string,
  ) => {
    try {
      const sub = projects.find((p) => p.id === id)
      const catalogEntry = (status === 'approved' && sub) ? buildCatalogEntry(sub) : undefined
      await updateProjectStatus(id, status, catalogEntry, feedbackNote)
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status, ...(feedbackNote !== undefined ? { curatorFeedback: feedbackNote } : {}) }
            : p,
        ),
      )
    } catch {}
  }

  const sendFeedback = async () => {
    if (!workspaceModal) return
    const { project, feedbackDraft } = workspaceModal
    await handleStatus(project.id, project.status, feedbackDraft)
    setFeedbackSent(project.id)
    setWorkspaceModal(null)
  }

  if (loading)
    return (
      <>
        <Header />
        <main className="container-kv py-24 text-center text-kv-muted">Загрузка…</main>
        <Footer />
      </>
    )

  if (!authorized) return null

  // ── derived stats ──────────────────────────────────────────────────────────
  const myTeams   = Array.from(new Set(projects.map((p) => p.teamName)))
  const counts = {
    total:     myTeams.length,
    feedback:  projects.filter((p) => p.status === 'feedback_requested').length,
    review:    projects.filter((p) => p.status === 'review').length,
    approved:  projects.filter((p) => p.status === 'approved').length,
  }

  // Group latest submission per team
  const teamMap: Record<string, SubmittedProject> = {}
  for (const p of projects) {
    if (!teamMap[p.teamName] || p.submittedAt > teamMap[p.teamName].submittedAt) {
      teamMap[p.teamName] = p
    }
  }
  const teamList = Object.values(teamMap)

  return (
    <>
      <Header />
      <main>
        <div className="container-kv py-10">

          {/* Top bar */}
          <div className="bg-white rounded-[3rem] px-10 py-8 mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-kv-muted text-xs uppercase tracking-wide block mb-0.5">Панель куратора</span>
              <h1 className="text-[2rem] font-semibold">{curatorName}</h1>
              <p className="text-kv-muted text-sm mt-0.5">Логин: {curatorLogin} · {myTeams.length} команд{myTeams.length === 1 ? 'a' : myTeams.length < 5 ? 'ы' : ''}</p>
            </div>
            <button
              className="flex items-center gap-2 px-6 py-3 rounded-full border border-kv-border text-kv-text cursor-pointer hover:bg-kv-light transition-colors bg-white text-sm"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" /> Выйти
            </button>
          </div>

          {/* Tab nav */}
          <div className="flex gap-3 mb-6">
            {([
              { id: 'dashboard', label: 'Дашборд',  Icon: LayoutDashboard },
              { id: 'projects',  label: 'Проекты',  Icon: ClipboardList },
            ] as const).map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium border-none cursor-pointer transition-all ${activeTab === id ? 'bg-kv-blue text-white' : 'bg-white text-kv-dark hover:bg-kv-light'}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* ════ DASHBOARD ════ */}
          {activeTab === 'dashboard' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 min-[700px]:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Моих команд',             value: counts.total,    color: 'text-kv-blue',       bg: 'bg-[#eff6ff]' },
                  { label: 'Запрос обратной связи',   value: counts.feedback, color: 'text-[#1565c0]',     bg: 'bg-[#e3f2fd]' },
                  { label: 'На рассмотрении',          value: counts.review,  color: 'text-[#ef6c00]',     bg: 'bg-[#fff3e0]' },
                  { label: 'Одобрено',                  value: counts.approved,color: 'text-[#2e7d32]',    bg: 'bg-[#e8f5e9]' },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-[2rem] p-7 text-center`}>
                    <div className={`text-[2.2rem] font-bold ${s.color} mb-1`}>{s.value}</div>
                    <div className="text-kv-muted text-xs leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Team cards */}
              <div className="bg-white rounded-[3rem] p-10">
                <h2 className="text-[1.5rem] font-semibold mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-kv-blue" /> Мои команды
                </h2>

                {teamList.length === 0 ? (
                  <div className="text-center py-16 text-kv-muted">
                    <Eye className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Ни одна из ваших команд ещё не отправила проект</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 min-[700px]:grid-cols-2 min-[1100px]:grid-cols-3 gap-5">
                    {teamList.map((project) => {
                      const sc = STATUS_CFG[project.status]
                      const hasFeedback = project.status === 'feedback_requested'
                      const isReview    = project.status === 'review'
                      return (
                        <div key={project.id} className="border border-kv-border rounded-[2rem] p-7 bg-[#f9fbfe] hover:bg-white hover:shadow-card transition-all">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-kv-light flex items-center justify-center flex-shrink-0">
                              <Users className="w-5 h-5 text-kv-blue" />
                            </div>
                            <span className={`status-badge text-xs flex items-center gap-1 ${sc.cls}`}>
                              <sc.Icon className="w-3 h-3" /> {sc.label}
                            </span>
                          </div>
                          <h3 className="font-semibold mb-1">{project.teamName}</h3>
                          <p className="text-kv-muted text-xs mb-1">Трек {project.track} · {project.authors.length} участников</p>
                          <p className="text-sm text-kv-text mb-4 line-clamp-2">{project.projectName || 'Проект ещё не назван'}</p>

                          {/* Action row */}
                          <div className="flex flex-col gap-2">
                            <button
                              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm rounded-full bg-kv-light text-kv-dark border-none cursor-pointer hover:bg-[#e2e8f0] transition-colors font-medium"
                              onClick={() => setWorkspaceModal({ project, feedbackDraft: project.curatorFeedback || '' })}
                            >
                              <Eye className="w-3.5 h-3.5" /> Рабочее пространство
                            </button>
                            {hasFeedback && (
                              <button
                                className="flex items-center justify-center gap-2 w-full py-2.5 text-sm rounded-full bg-[#e3f2fd] text-[#1565c0] border-none cursor-pointer hover:bg-[#bbdefb] transition-colors font-medium"
                                onClick={() => setWorkspaceModal({ project, feedbackDraft: project.curatorFeedback || '' })}
                              >
                                <MessageSquare className="w-3.5 h-3.5" /> Написать обратную связь
                              </button>
                            )}
                            {isReview && (
                              <div className="flex gap-2">
                                <button
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs rounded-full bg-[#e8f5e9] text-[#2e7d32] border-none cursor-pointer hover:bg-[#c8e6c9] transition-colors font-medium"
                                  onClick={() => handleStatus(project.id, 'approved')}
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Одобрить
                                </button>
                                <button
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs rounded-full bg-[#ffebee] text-[#c62828] border-none cursor-pointer hover:bg-[#ffcdd2] transition-colors font-medium"
                                  onClick={() => handleStatus(project.id, 'rejected')}
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Отклонить
                                </button>
                              </div>
                            )}
                          </div>

                          {feedbackSent === project.id && (
                            <div className="mt-3 flex items-center gap-1.5 text-[#2e7d32] text-xs">
                              <CheckCircle className="w-3.5 h-3.5" /> Обратная связь отправлена
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ════ PROJECTS LIST ════ */}
          {activeTab === 'projects' && (
            <div className="bg-white rounded-[3rem] p-10">
              <h2 className="text-[1.5rem] font-semibold mb-7 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-kv-blue" /> Поданные проекты
              </h2>

              {projects.length === 0 ? (
                <div className="text-center py-16 text-kv-muted">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Ещё нет поданных проектов</p>
                  <p className="text-sm mt-2">Студенты увидят кнопку «Опубликовать КОП» после заполнения паспорта</p>
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
                        <div className="p-7 flex items-center justify-between flex-wrap gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-medium mb-1 truncate">{project.projectName || 'Без названия'}</h3>
                            <p className="text-kv-muted text-sm">
                              Команда: <strong className="text-kv-dark">{project.teamName}</strong> · Капитан: {project.captain} · Трек: {project.track} · {date}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                            <span className={`status-badge flex items-center gap-1.5 ${sc.cls}`}>
                              <sc.Icon className="w-4 h-4" /> {sc.label}
                            </span>
                            {project.status === 'feedback_requested' && (
                              <button
                                className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#e3f2fd] text-[#1565c0] border-none cursor-pointer font-medium hover:bg-[#bbdefb] transition-colors text-sm"
                                onClick={() => setWorkspaceModal({ project, feedbackDraft: project.curatorFeedback || '' })}
                              >
                                <MessageSquare className="w-4 h-4" /> Написать обратную связь
                              </button>
                            )}
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
                            {project.status !== 'review' && project.status !== 'feedback_requested' && (
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
                            {project.curatorFeedback && (
                              <div className="bg-[#e3f2fd] rounded-2xl p-5">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[#1565c0] block mb-2">Обратная связь куратора</span>
                                <p className="text-sm text-[#1565c0]">{project.curatorFeedback}</p>
                              </div>
                            )}
                            <button
                              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-kv-light text-kv-dark border-none cursor-pointer text-sm hover:bg-[#e2e8f0] transition-colors"
                              onClick={() => setWorkspaceModal({ project, feedbackDraft: project.curatorFeedback || '' })}
                            >
                              <Eye className="w-4 h-4" /> Войти в рабочее пространство
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Workspace modal */}
      {workspaceModal && (
        <div className="modal-overlay" onClick={() => setWorkspaceModal(null)}>
          <div
            className="bg-white rounded-[2.5rem] w-[95%] max-w-[860px] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-10 pt-10 pb-6 border-b border-kv-border sticky top-0 bg-white rounded-t-[2.5rem] z-10">
              <div>
                <h3 className="text-[1.5rem] font-semibold">{workspaceModal.project.teamName}</h3>
                <p className="text-kv-muted text-sm mt-0.5">
                  {workspaceModal.project.projectName || 'Проект без названия'} · Трек {workspaceModal.project.track}
                </p>
              </div>
              <button
                className="modal-close-btn static"
                onClick={() => setWorkspaceModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-10 py-8 space-y-8">

              {/* Status + team */}
              <div className="flex items-center gap-4 flex-wrap">
                {(() => {
                  const sc = STATUS_CFG[workspaceModal.project.status]
                  return (
                    <span className={`status-badge flex items-center gap-1.5 ${sc.cls}`}>
                      <sc.Icon className="w-4 h-4" /> {sc.label}
                    </span>
                  )
                })()}
                {workspaceModal.project.authors.map((a, i) => (
                  <span key={i} className="bg-kv-light px-4 py-1.5 rounded-full text-sm">
                    {a}{i === 0 ? ' (капитан)' : ''}
                  </span>
                ))}
              </div>

              {/* Passport */}
              <div>
                <h4 className="flex items-center gap-2 font-semibold mb-4 text-sm uppercase tracking-wide text-kv-muted">
                  <ClipboardList className="w-4 h-4" /> Паспорт проекта
                </h4>
                <div className="bg-[#f9fbfe] rounded-[1.75rem] p-6 space-y-3 text-sm">
                  {workspaceModal.project.projectBlock && (
                    <p><span className="text-kv-muted">Предметная область:</span> {workspaceModal.project.projectBlock}</p>
                  )}
                  {workspaceModal.project.projectDesc ? (
                    <p className="leading-relaxed">{workspaceModal.project.projectDesc}</p>
                  ) : (
                    <p className="text-kv-muted italic">Описание не заполнено</p>
                  )}
                  {workspaceModal.project.productionFile && (
                    <p className="flex items-center gap-1.5 text-kv-blue">
                      <Paperclip className="w-3.5 h-3.5" /> {workspaceModal.project.productionFile}
                    </p>
                  )}
                </div>
              </div>

              {/* Tasks snapshot */}
              {workspaceModal.project.workspaceSnapshot?.tasks && workspaceModal.project.workspaceSnapshot.tasks.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 font-semibold mb-4 text-sm uppercase tracking-wide text-kv-muted">
                    <CheckCircle2 className="w-4 h-4" /> Задачи (снимок на момент отправки)
                  </h4>
                  <div className="space-y-2">
                    {workspaceModal.project.workspaceSnapshot.tasks.map((task) => (
                      <div key={task.id} className="bg-[#f9fbfe] rounded-2xl px-5 py-3.5 flex items-center justify-between gap-3 text-sm border border-kv-border">
                        <span>{task.title}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 ${
                          task.status === 'done' ? 'bg-[#e8f5e9] text-[#2e7d32]' :
                          task.status === 'inprogress' ? 'bg-[#fff3e0] text-[#ef6c00]' :
                          'bg-kv-light text-kv-muted'
                        }`}>
                          {task.status === 'done' ? 'Готово' : task.status === 'inprogress' ? 'В работе' : 'Запланировано'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes snapshot */}
              {workspaceModal.project.workspaceSnapshot?.notes && (
                <div>
                  <h4 className="flex items-center gap-2 font-semibold mb-4 text-sm uppercase tracking-wide text-kv-muted">
                    <BookOpen className="w-4 h-4" /> Заметки команды
                  </h4>
                  <div className="bg-[#f9fbfe] rounded-[1.75rem] p-6 text-sm text-kv-text whitespace-pre-wrap leading-relaxed border border-kv-border">
                    {workspaceModal.project.workspaceSnapshot.notes}
                  </div>
                </div>
              )}

              {/* Files */}
              {workspaceModal.project.files.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 font-semibold mb-4 text-sm uppercase tracking-wide text-kv-muted">
                    <FolderOpen className="w-4 h-4" /> Файлы проекта
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {workspaceModal.project.files.map((f, i) => (
                      <span key={i} className="bg-[#f9fbfe] px-4 py-2 rounded-full text-sm border border-kv-border flex items-center gap-1.5">
                        {f.icon === 'FileText' ? <FileText className="w-3.5 h-3.5 text-kv-blue" /> : <File className="w-3.5 h-3.5 text-kv-blue" />}
                        {f.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback section */}
              <div className="border-t border-kv-border pt-8">
                <h4 className="flex items-center gap-2 font-semibold mb-4 text-sm uppercase tracking-wide text-kv-muted">
                  <MessageSquare className="w-4 h-4" /> Обратная связь куратора
                </h4>
                {workspaceModal.project.curatorFeedback && (
                  <div className="bg-[#e3f2fd] rounded-2xl p-4 mb-4 text-sm text-[#1565c0]">
                    <strong className="block mb-1 text-xs uppercase tracking-wide">Ранее отправлено:</strong>
                    {workspaceModal.project.curatorFeedback}
                  </div>
                )}
                <textarea
                  className="textarea-kv w-full min-h-[120px]"
                  placeholder="Напишите комментарий для команды…"
                  value={workspaceModal.feedbackDraft}
                  onChange={(e) =>
                    setWorkspaceModal((m) => m ? { ...m, feedbackDraft: e.target.value } : m)
                  }
                />
                <div className="flex gap-3 mt-5 flex-wrap">
                  <button
                    className="flex items-center gap-2 px-6 py-3 bg-kv-blue text-white rounded-full border-none cursor-pointer text-sm font-medium hover:bg-kv-dark transition-colors"
                    onClick={sendFeedback}
                  >
                    <Send className="w-4 h-4" /> Отправить обратную связь
                  </button>
                  {workspaceModal.project.status === 'review' && (
                    <>
                      <button
                        className="flex items-center gap-2 px-6 py-3 bg-[#e8f5e9] text-[#2e7d32] rounded-full border-none cursor-pointer text-sm font-medium hover:bg-[#c8e6c9] transition-colors"
                        onClick={async () => {
                          await handleStatus(workspaceModal.project.id, 'approved', workspaceModal.feedbackDraft || undefined)
                          setWorkspaceModal(null)
                        }}
                      >
                        <CheckCircle className="w-4 h-4" /> Одобрить и опубликовать
                      </button>
                      <button
                        className="flex items-center gap-2 px-6 py-3 bg-[#ffebee] text-[#c62828] rounded-full border-none cursor-pointer text-sm font-medium hover:bg-[#ffcdd2] transition-colors"
                        onClick={async () => {
                          await handleStatus(workspaceModal.project.id, 'rejected', workspaceModal.feedbackDraft || undefined)
                          setWorkspaceModal(null)
                        }}
                      >
                        <XCircle className="w-4 h-4" /> Отклонить
                      </button>
                    </>
                  )}
                  {workspaceModal.project.status === 'feedback_requested' && (
                    <div className="flex items-center gap-1.5 text-kv-muted text-xs self-center">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Студент запросил обратную связь, проект не на финальном рассмотрении
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

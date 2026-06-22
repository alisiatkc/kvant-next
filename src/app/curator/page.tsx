'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle, XCircle, Clock, LogOut, Eye, Users,
  ChevronDown, ChevronUp, Paperclip, File, FileText,
  LayoutDashboard, ClipboardList, Bell, MessageSquare,
  BookOpen, CheckCircle2, FolderOpen, Send, X, AlertTriangle,
  UserCheck, UserPlus, Inbox, Package, Plus, Edit2, Trash2, BarChart3, TrendingUp,
  Activity, Calendar, Filter,
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  type SubmittedProject,
  type CatalogEntry,
  getSubmittedProjects,
  updateProjectStatus,
  getApprovedCatalog,
  updateCatalogEntry,
  deleteCatalogEntry,
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

type WorkspaceModal = { project: SubmittedProject; feedbackDraft: string }
type ActiveTab = 'dashboard' | 'inbox' | 'all' | 'catalog'

type CatalogForm = {
  title: string; excerpt: string; fullDesc: string
  subject: string; authors: string; tech: string
}

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

  // ── catalog editor ────────────────────────────────────────────────────────
  const [catalogEntries,     setCatalogEntries]     = useState<CatalogEntry[]>([])
  const [showCatalogModal,   setShowCatalogModal]   = useState(false)
  const [editingCatalogEntry,setEditingCatalogEntry]= useState<CatalogEntry | null>(null)
  const [catalogForm,        setCatalogForm]        = useState<CatalogForm>({
    title: '', excerpt: '', fullDesc: '', subject: 'it', authors: '', tech: '',
  })
  const [catalogDeleteId,    setCatalogDeleteId]    = useState<number | null>(null)
  const [analyticsView,      setAnalyticsView]      = useState<'status' | 'timeline' | 'funnel'>('status')

  useEffect(() => {
    ;(async () => {
      try {
        const loggedIn  = localStorage.getItem('curatorLoggedIn') === 'true'
        const loginName = localStorage.getItem('curatorLoginName') || ''
        if (!loggedIn || !loginName) { router.push('/cabinet'); return }
        const account = CURATOR_ACCOUNTS.find((c) => c.login === loginName)
        if (!account) { router.push('/cabinet'); return }
        setCuratorLogin(loginName)
        setCuratorName(account.name)
        setAuthorized(true)
        // Fetch ALL projects (no filter — curators can see everything)
        const subs = await getSubmittedProjects()
        setProjects(subs)
        const cat = await getApprovedCatalog()
        setCatalogEntries(cat)
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
    newCuratorLogin?: string,
  ) => {
    try {
      const sub = projects.find((p) => p.id === id)
      const catalogEntry = (status === 'approved' && sub) ? buildCatalogEntry(sub) : undefined
      await updateProjectStatus(id, status, catalogEntry, feedbackNote, newCuratorLogin)
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status,
                ...(feedbackNote     !== undefined ? { curatorFeedback: feedbackNote }   : {}),
                ...(newCuratorLogin  !== undefined ? { curatorLogin: newCuratorLogin }    : {}),
              }
            : p,
        ),
      )
    } catch {}
  }

  const assignToMe = (id: string) => {
    handleStatus(id, projects.find((p) => p.id === id)!.status, undefined, curatorLogin)
  }

  const unassign = (id: string) => {
    handleStatus(id, projects.find((p) => p.id === id)!.status, undefined, '')
  }

  const sendFeedback = async () => {
    if (!workspaceModal) return
    const { project, feedbackDraft } = workspaceModal
    await handleStatus(project.id, project.status, feedbackDraft)
    setWorkspaceModal(null)
  }

  const openCatalogEdit = (entry: CatalogEntry | null) => {
    setEditingCatalogEntry(entry)
    setCatalogForm(entry ? {
      title:    entry.title,
      excerpt:  entry.excerpt,
      fullDesc: entry.fullDesc,
      subject:  entry.subject,
      authors:  entry.authors.join(', '),
      tech:     entry.tech.join(', '),
    } : { title: '', excerpt: '', fullDesc: '', subject: 'it', authors: '', tech: '' })
    setShowCatalogModal(true)
  }

  const saveCatalogEntry = async () => {
    if (!catalogForm.title.trim()) return
    const entry: CatalogEntry = {
      id:       editingCatalogEntry?.id ?? Date.now(),
      title:    catalogForm.title.trim(),
      excerpt:  catalogForm.excerpt.trim(),
      fullDesc: catalogForm.fullDesc.trim(),
      subject:  catalogForm.subject,
      authors:  catalogForm.authors.split(',').map((s) => s.trim()).filter(Boolean),
      files:    editingCatalogEntry?.files ?? [],
      tech:     catalogForm.tech.split(',').map((s) => s.trim()).filter(Boolean),
      image:    catalogForm.subject,
      contact:  'https://vk.com/technoparkrgpu',
      likes:    editingCatalogEntry?.likes ?? 0,
    }
    await updateCatalogEntry(entry)
    setCatalogEntries((prev) => [...prev.filter((e) => e.id !== entry.id), entry])
    setShowCatalogModal(false)
  }

  const confirmDeleteCatalog = async () => {
    if (catalogDeleteId === null) return
    await deleteCatalogEntry(catalogDeleteId)
    setCatalogEntries((prev) => prev.filter((e) => e.id !== catalogDeleteId))
    setCatalogDeleteId(null)
  }

  if (loading) return (
    <>
      <Header />
      <main className="container-kv py-24 text-center text-kv-muted">Загрузка…</main>
      <Footer />
    </>
  )
  if (!authorized) return null

  // ── derived ───────────────────────────────────────────────────────────────
  const mine      = projects.filter((p) => p.curatorLogin === curatorLogin)
  const available = projects.filter((p) => !p.curatorLogin || p.curatorLogin === '')
  // Inbox: feedback_requested only if curator hasn't replied yet; review always needs action
  const inbox     = mine.filter((p) =>
    (p.status === 'feedback_requested' && !p.curatorFeedback) ||
    p.status === 'review',
  )

  const counts = {
    mine:      mine.length,
    inbox:     inbox.length,
    available: available.length,
    approved:  projects.filter((p) => p.status === 'approved').length,
  }

  const TABS: { id: ActiveTab; label: string; Icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Дашборд',        Icon: LayoutDashboard },
    { id: 'inbox',     label: 'Входящие',        Icon: Inbox,      badge: counts.inbox },
    { id: 'all',       label: 'Все проекты',     Icon: ClipboardList },
    { id: 'catalog',   label: 'Каталог КОП',     Icon: Package },
  ]

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
              <p className="text-kv-muted text-sm mt-0.5">Логин: {curatorLogin} · {counts.mine} проект{counts.mine === 1 ? '' : counts.mine < 5 ? 'а' : 'ов'} в работе</p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 rounded-full border border-kv-border text-kv-text cursor-pointer hover:bg-kv-light transition-colors bg-white text-sm" onClick={logout}>
              <LogOut className="w-4 h-4" /> Выйти
            </button>
          </div>

          {/* Tab nav */}
          <div className="flex gap-3 mb-6 flex-wrap">
            {TABS.map(({ id, label, Icon, badge }) => (
              <button key={id}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium border-none cursor-pointer transition-all relative ${activeTab === id ? 'bg-kv-blue text-white' : 'bg-white text-kv-dark hover:bg-kv-light'}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon className="w-4 h-4" /> {label}
                {!!badge && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#ef4444] text-white text-[10px] font-bold flex items-center justify-center">{badge}</span>}
              </button>
            ))}
          </div>

          {/* ════ DASHBOARD ════ */}
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-2 min-[700px]:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Мои проекты',    value: counts.mine,      color: 'text-kv-blue',   bg: 'bg-[#eff6ff]' },
                  { label: 'Ждут ответа',    value: counts.inbox,     color: 'text-[#dc2626]', bg: 'bg-[#fef2f2]' },
                  { label: 'Свободные',       value: counts.available, color: 'text-[#d97706]', bg: 'bg-[#fff3e0]' },
                  { label: 'Одобрено всего', value: counts.approved,  color: 'text-[#2e7d32]', bg: 'bg-[#e8f5e9]' },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-[2rem] p-7 text-center`}>
                    <div className={`text-[2.2rem] font-bold ${s.color} mb-1`}>{s.value}</div>
                    <div className="text-kv-muted text-xs leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Analytics */}
              <div className="bg-white rounded-[3rem] p-8 mb-6">
                {/* Header + view switcher */}
                <div className="flex items-center justify-between mb-7 flex-wrap gap-4">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-kv-blue" /> Аналитика проектов
                  </h3>
                  <div className="flex gap-2 p-1 bg-kv-light rounded-2xl">
                    {([
                      { id: 'status',   label: 'Статусы',    Icon: Filter },
                      { id: 'timeline', label: 'Хронология', Icon: Calendar },
                      { id: 'funnel',   label: 'Воронка',    Icon: Activity },
                    ] as { id: 'status' | 'timeline' | 'funnel'; label: string; Icon: React.ComponentType<{ className?: string }> }[]).map(({ id, label, Icon }) => (
                      <button key={id}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border-none cursor-pointer transition-all ${analyticsView === id ? 'bg-kv-blue text-white shadow-sm' : 'bg-transparent text-kv-muted hover:text-kv-dark'}`}
                        onClick={() => setAnalyticsView(id)}>
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── VIEW: STATUS ── */}
                {analyticsView === 'status' && (() => {
                  const total = projects.length || 1
                  const rows = [
                    { label: 'Запрос обратной связи', key: 'feedback_requested', color: '#1565c0', bg: '#e3f2fd' },
                    { label: 'На рассмотрении',        key: 'review',             color: '#ef6c00', bg: '#fff3e0' },
                    { label: 'Одобрено',               key: 'approved',           color: '#2e7d32', bg: '#e8f5e9' },
                    { label: 'Отклонено',              key: 'rejected',           color: '#c62828', bg: '#ffebee' },
                  ] as { label: string; key: string; color: string; bg: string }[]
                  return (
                    <div className="space-y-4">
                      {rows.map(({ label, key, color, bg }) => {
                        const count = projects.filter((p) => p.status === key).length
                        const pct = Math.round((count / total) * 100)
                        return (
                          <div key={key} className="flex items-center gap-4">
                            <div className="w-32 min-[700px]:w-44 flex-shrink-0">
                              <span className="text-xs text-kv-text leading-tight block">{label}</span>
                            </div>
                            <div className="flex-1 h-7 rounded-xl overflow-hidden" style={{ background: bg }}>
                              <div className="h-full rounded-xl flex items-center px-3 transition-all duration-700"
                                style={{ width: `${count > 0 ? Math.max(pct, 6) : 0}%`, background: color }}>
                                {count > 0 && <span className="text-white text-xs font-bold">{count}</span>}
                              </div>
                            </div>
                            <span className="w-10 text-right text-xs font-semibold tabular-nums" style={{ color }}>{pct}%</span>
                          </div>
                        )
                      })}
                      <p className="text-kv-muted text-xs pt-4 border-t border-kv-border">
                        Всего проектов: <strong>{projects.length}</strong>
                      </p>
                    </div>
                  )
                })()}

                {/* ── VIEW: TIMELINE ── */}
                {analyticsView === 'timeline' && (() => {
                  const monthsMap: Record<string, { submitted: number; approved: number }> = {}
                  projects.forEach((p) => {
                    const raw = (p as { submittedAt?: string }).submittedAt
                    if (!raw) return
                    const d = new Date(raw)
                    if (isNaN(d.getTime())) return
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                    if (!monthsMap[key]) monthsMap[key] = { submitted: 0, approved: 0 }
                    monthsMap[key].submitted++
                    if (p.status === 'approved') monthsMap[key].approved++
                  })
                  const months = Object.entries(monthsMap).sort(([a], [b]) => a.localeCompare(b))
                  const maxVal = Math.max(...months.map(([, v]) => v.submitted), 1)
                  const MONTH_NAMES = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
                  if (months.length === 0) return (
                    <div className="text-center py-10 text-kv-muted text-sm">
                      <Calendar className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      Нет данных о датах подачи проектов
                    </div>
                  )
                  return (
                    <>
                      <div className="flex items-end gap-3 mb-3" style={{ height: '120px' }}>
                        {months.map(([key, val]) => {
                          const subPct  = Math.max(Math.round((val.submitted / maxVal) * 100), 8)
                          const appPct  = Math.max(Math.round((val.approved  / maxVal) * 100), val.approved > 0 ? 4 : 0)
                          const [, mm]  = key.split('-')
                          const mName   = MONTH_NAMES[parseInt(mm) - 1]
                          return (
                            <div key={key} className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full flex items-end gap-0.5" style={{ height: '96px' }}>
                                <div className="flex-1 rounded-t-lg transition-all duration-700"
                                  style={{ height: `${subPct}%`, background: '#2B3B6B' }} title={`Подано: ${val.submitted}`} />
                                <div className="flex-1 rounded-t-lg transition-all duration-700"
                                  style={{ height: `${appPct}%`, background: '#4C1D95', opacity: val.approved > 0 ? 1 : 0 }} title={`Одобрено: ${val.approved}`} />
                              </div>
                              <span className="text-[10px] text-kv-muted">{mName}</span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex items-center gap-5 pt-4 border-t border-kv-border">
                        <span className="flex items-center gap-2 text-xs text-kv-muted">
                          <span className="w-3 h-3 rounded-sm inline-block bg-[#2B3B6B]" /> Подано
                        </span>
                        <span className="flex items-center gap-2 text-xs text-kv-muted">
                          <span className="w-3 h-3 rounded-sm inline-block bg-[#4C1D95]" /> Одобрено
                        </span>
                        <span className="text-xs text-kv-muted ml-auto">
                          {months.length} {months.length === 1 ? 'месяц' : months.length < 5 ? 'месяца' : 'месяцев'}
                        </span>
                      </div>
                    </>
                  )
                })()}

                {/* ── VIEW: FUNNEL ── */}
                {analyticsView === 'funnel' && (() => {
                  const total     = projects.length
                  const reviewed  = projects.filter((p) => ['review', 'approved', 'rejected'].includes(p.status)).length
                  const approved  = projects.filter((p) => p.status === 'approved').length
                  const rejected  = projects.filter((p) => p.status === 'rejected').length
                  const stages = [
                    { label: 'Всего подано',       count: total,    color: '#2B3B6B', pct: 100 },
                    { label: 'Дошли до ревью',      count: reviewed, color: '#4C1D95', pct: total ? Math.round((reviewed / total) * 100) : 0 },
                    { label: 'Одобрено',            count: approved, color: '#2e7d32', pct: total ? Math.round((approved / total) * 100) : 0 },
                    { label: 'Отклонено',           count: rejected, color: '#c62828', pct: total ? Math.round((rejected / total) * 100) : 0 },
                  ]
                  return (
                    <div className="space-y-3">
                      {stages.map(({ label, count, color, pct }) => (
                        <div key={label}>
                          <div className="flex items-center justify-between mb-1.5 text-sm">
                            <span className="text-kv-text">{label}</span>
                            <span className="font-bold tabular-nums" style={{ color }}>{count} <span className="text-kv-muted font-normal text-xs">({pct}%)</span></span>
                          </div>
                          <div className="h-8 rounded-xl bg-[#f1f5f9] overflow-hidden">
                            <div className="h-full rounded-xl flex items-center justify-end pr-3 transition-all duration-700"
                              style={{ width: `${count > 0 ? Math.max(pct, 8) : 0}%`, background: color }}>
                              {pct >= 15 && <span className="text-white text-xs font-semibold">{pct}%</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="mt-5 pt-4 border-t border-kv-border grid grid-cols-2 gap-4">
                        <div className="bg-[#e8f5e9] rounded-2xl p-4 text-center">
                          <div className="text-[1.6rem] font-bold text-[#2e7d32]">
                            {total ? Math.round((approved / total) * 100) : 0}%
                          </div>
                          <div className="text-xs text-[#2e7d32] mt-0.5">Конверсия в одобрение</div>
                        </div>
                        <div className="bg-[#f3eeff] rounded-2xl p-4 text-center">
                          <div className="text-[1.6rem] font-bold text-[#4C1D95]">
                            {total ? Math.round((reviewed / total) * 100) : 0}%
                          </div>
                          <div className="text-xs text-[#4C1D95] mt-0.5">Дошли до ревью</div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* My assigned projects */}
              <div className="bg-white rounded-[3rem] p-10 mb-6">
                <h2 className="text-[1.4rem] font-semibold mb-6 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-kv-blue" /> Мои проекты
                </h2>
                {mine.length === 0 ? (
                  <div className="text-center py-10 text-kv-muted text-sm">
                    Вы ещё не взяли ни один проект. Зайдите во вкладку «Все проекты».
                  </div>
                ) : (
                  <div className="grid grid-cols-1 min-[700px]:grid-cols-2 min-[1100px]:grid-cols-3 gap-5">
                    {mine.map((p) => <ProjectCard key={p.id} project={p}
                      onOpen={() => setWorkspaceModal({ project: p, feedbackDraft: p.curatorFeedback || '' })}
                      onApprove={() => handleStatus(p.id, 'approved')}
                      onReject={() => handleStatus(p.id, 'rejected')}
                      onUnassign={() => unassign(p.id)} />)}
                  </div>
                )}
              </div>

              {/* Available (unassigned) */}
              {available.length > 0 && (
                <div className="bg-white rounded-[3rem] p-10">
                  <h2 className="text-[1.4rem] font-semibold mb-6 flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-[#d97706]" /> Свободные проекты
                  </h2>
                  <div className="grid grid-cols-1 min-[700px]:grid-cols-2 min-[1100px]:grid-cols-3 gap-5">
                    {available.map((p) => (
                      <div key={p.id} className="border border-kv-border rounded-[2rem] p-7 bg-[#f9fbfe]">
                        <h3 className="font-semibold mb-1">{p.teamName || '—'}</h3>
                        <p className="text-kv-muted text-xs mb-3">{p.projectName || 'Проект без названия'} · Трек {p.track}</p>
                        <button className="w-full flex items-center justify-center gap-2 py-2.5 text-sm rounded-full bg-kv-blue text-white border-none cursor-pointer hover:bg-kv-dark transition-colors font-medium"
                          onClick={() => assignToMe(p.id)}>
                          <UserPlus className="w-3.5 h-3.5" /> Взять в работу
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ════ INBOX ════ */}
          {activeTab === 'inbox' && (
            <div className="bg-white rounded-[3rem] p-10">
              <h2 className="text-[1.4rem] font-semibold mb-6 flex items-center gap-2">
                <Inbox className="w-5 h-5 text-kv-blue" /> Ждут вашего ответа
              </h2>
              {inbox.length === 0 ? (
                <div className="text-center py-16 text-kv-muted">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Всё разобрано — новых запросов нет</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inbox.map((p) => {
                    const sc = STATUS_CFG[p.status]
                    const date = p.submittedAt ? new Date(p.submittedAt).toLocaleDateString('ru-RU') : '—'
                    return (
                      <div key={p.id} className="border border-[#90caf9] bg-[#e3f2fd] rounded-[2rem] p-7 flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <h3 className="font-semibold mb-0.5">{p.projectName || 'Без названия'}</h3>
                          <p className="text-sm text-kv-muted">{p.teamName} · {date}</p>
                          <span className={`status-badge mt-2 inline-flex items-center gap-1.5 ${sc.cls}`}>
                            <sc.Icon className="w-3.5 h-3.5" /> {sc.label}
                          </span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-kv-dark rounded-full border-none cursor-pointer text-sm font-medium hover:bg-kv-light transition-colors"
                            onClick={() => setWorkspaceModal({ project: p, feedbackDraft: p.curatorFeedback || '' })}>
                            <Eye className="w-4 h-4" /> Открыть
                          </button>
                          {p.status === 'review' && (
                            <>
                              <button className="flex items-center gap-2 px-5 py-2.5 bg-[#e8f5e9] text-[#2e7d32] rounded-full border-none cursor-pointer text-sm font-medium hover:bg-[#c8e6c9] transition-colors"
                                onClick={() => handleStatus(p.id, 'approved')}>
                                <CheckCircle className="w-4 h-4" /> Одобрить
                              </button>
                              <button className="flex items-center gap-2 px-5 py-2.5 bg-[#ffebee] text-[#c62828] rounded-full border-none cursor-pointer text-sm font-medium hover:bg-[#ffcdd2] transition-colors"
                                onClick={() => handleStatus(p.id, 'rejected')}>
                                <XCircle className="w-4 h-4" /> Отклонить
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════ CATALOG ════ */}
          {activeTab === 'catalog' && (
            <div className="space-y-5">
              <div className="bg-white rounded-[3rem] p-10">
                <div className="flex items-center justify-between mb-7 gap-4 flex-wrap">
                  <div>
                    <h2 className="text-[1.4rem] font-semibold flex items-center gap-2">
                      <Package className="w-5 h-5 text-kv-blue" /> Каталог КОП
                    </h2>
                    <p className="text-kv-muted text-sm mt-1">
                      {catalogEntries.length} {catalogEntries.length === 1 ? 'запись' : catalogEntries.length < 5 ? 'записи' : 'записей'} · добавлены через систему или вручную
                    </p>
                  </div>
                  <button
                    className="flex items-center gap-2 px-6 py-3 bg-kv-blue text-white rounded-full border-none cursor-pointer text-sm font-medium hover:bg-kv-dark transition-colors"
                    onClick={() => openCatalogEdit(null)}
                  >
                    <Plus className="w-4 h-4" /> Добавить КОП
                  </button>
                </div>

                {catalogEntries.length === 0 ? (
                  <div className="text-center py-16 text-kv-muted">
                    <Package className="w-10 h-10 mx-auto mb-4 opacity-20" />
                    <p className="font-medium mb-1">Каталог пуст</p>
                    <p className="text-sm">Одобренные проекты появятся здесь автоматически, или добавьте КОП вручную</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {catalogEntries.map((entry) => (
                      <div key={entry.id} className="border border-kv-border rounded-[2rem] p-6 flex items-center gap-5 flex-wrap hover:bg-[#f9fbfe] transition-colors">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1 truncate">{entry.title}</h3>
                          <p className="text-sm text-kv-text mb-2 line-clamp-1">{entry.excerpt}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {entry.tech.slice(0, 4).map((t) => (
                              <span key={t} className="text-xs bg-kv-light px-2.5 py-0.5 rounded-full text-kv-text">{t}</span>
                            ))}
                            {entry.authors.length > 0 && (
                              <span className="text-xs text-kv-muted">{entry.authors[0]}{entry.authors.length > 1 ? ` +${entry.authors.length - 1}` : ''}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-kv-light border-none cursor-pointer text-sm text-kv-dark hover:bg-[#e2e8f0] transition-colors"
                            onClick={() => openCatalogEdit(entry)}
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Редактировать
                          </button>
                          <button
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#fef2f2] text-[#dc2626] border-none cursor-pointer text-sm hover:bg-[#fee2e2] transition-colors"
                            onClick={() => setCatalogDeleteId(entry.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ ALL PROJECTS ════ */}
          {activeTab === 'all' && (
            <div className="bg-white rounded-[3rem] p-10">
              <h2 className="text-[1.4rem] font-semibold mb-7 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-kv-blue" /> Все проекты ({projects.length})
              </h2>
              {projects.length === 0 ? (
                <div className="text-center py-16 text-kv-muted text-sm">Пока нет поданных проектов</div>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => {
                    const sc = STATUS_CFG[project.status]
                    const isOpen = expanded === project.id
                    const isMe = project.curatorLogin === curatorLogin
                    const date = project.submittedAt ? new Date(project.submittedAt).toLocaleDateString('ru-RU') : '—'
                    return (
                      <div key={project.id} className="border border-kv-border rounded-[2rem] overflow-hidden">
                        <div className="p-7 flex items-center justify-between flex-wrap gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-xl font-medium truncate">{project.projectName || 'Без названия'}</h3>
                              {isMe && <span className="text-xs bg-kv-blue text-white px-2.5 py-0.5 rounded-full flex-shrink-0">Мой</span>}
                            </div>
                            <p className="text-kv-muted text-sm">
                              {project.teamName} · Трек {project.track} · {date}
                              {project.curatorLogin ? ` · Куратор: ${project.curatorLogin}` : ' · Не назначен'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                            <span className={`status-badge flex items-center gap-1.5 ${sc.cls}`}>
                              <sc.Icon className="w-4 h-4" /> {sc.label}
                            </span>
                            {!project.curatorLogin && (
                              <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-kv-blue text-white border-none cursor-pointer text-sm font-medium hover:bg-kv-dark transition-colors"
                                onClick={() => assignToMe(project.id)}>
                                <UserPlus className="w-3.5 h-3.5" /> Взять
                              </button>
                            )}
                            {project.status === 'review' && isMe && (
                              <>
                                <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#e8f5e9] text-[#2e7d32] border-none cursor-pointer text-sm font-medium hover:bg-[#c8e6c9] transition-colors"
                                  onClick={() => handleStatus(project.id, 'approved')}>
                                  <CheckCircle className="w-4 h-4" /> Одобрить
                                </button>
                                <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#ffebee] text-[#c62828] border-none cursor-pointer text-sm font-medium hover:bg-[#ffcdd2] transition-colors"
                                  onClick={() => handleStatus(project.id, 'rejected')}>
                                  <XCircle className="w-4 h-4" /> Отклонить
                                </button>
                              </>
                            )}
                            <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-kv-light border-none cursor-pointer text-kv-muted hover:text-kv-dark hover:bg-[#e2e8f0] transition-colors text-sm"
                              onClick={() => setExpanded(isOpen ? null : project.id)}>
                              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              {isOpen ? 'Свернуть' : 'Подробнее'}
                            </button>
                          </div>
                        </div>
                        {isOpen && (
                          <div className="border-t border-kv-border p-7 bg-[#f9fbfe] space-y-4">
                            {project.projectDesc && <p className="text-sm text-kv-text leading-relaxed">{project.projectDesc}</p>}
                            <div className="flex flex-wrap gap-2">
                              {project.authors.map((a, i) => (
                                <span key={i} className="bg-white px-4 py-1.5 rounded-full text-sm border border-kv-border">{a}{i === 0 ? ' (капитан)' : ''}</span>
                              ))}
                            </div>
                            {project.curatorFeedback && (
                              <div className="bg-[#e3f2fd] rounded-2xl p-4 text-sm text-[#1565c0]">
                                <strong className="block mb-1 text-xs uppercase tracking-wide">Обратная связь:</strong>
                                {project.curatorFeedback}
                              </div>
                            )}
                            <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-kv-light text-kv-dark border-none cursor-pointer text-sm hover:bg-[#e2e8f0] transition-colors"
                              onClick={() => setWorkspaceModal({ project, feedbackDraft: project.curatorFeedback || '' })}>
                              <Eye className="w-4 h-4" /> Рабочее пространство
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
          <div className="bg-white w-full min-[640px]:w-[95%] max-w-[860px] max-h-[92vh] overflow-y-auto rounded-t-[2rem] min-[640px]:rounded-[2.5rem]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 min-[640px]:px-10 pt-6 min-[640px]:pt-10 pb-5 min-[640px]:pb-6 border-b border-kv-border sticky top-0 bg-white rounded-t-[2rem] min-[640px]:rounded-t-[2.5rem] z-10">
              <div>
                <h3 className="text-[1.5rem] font-semibold">{workspaceModal.project.teamName || '—'}</h3>
                <p className="text-kv-muted text-sm mt-0.5">{workspaceModal.project.projectName || 'Без названия'} · Трек {workspaceModal.project.track}</p>
              </div>
              <button className="modal-close-btn static" onClick={() => setWorkspaceModal(null)}><X size={20} /></button>
            </div>
            <div className="px-6 min-[640px]:px-10 py-6 min-[640px]:py-8 space-y-6 min-[640px]:space-y-8">

              {/* Status */}
              <div className="flex items-center gap-3 flex-wrap">
                {(() => { const sc = STATUS_CFG[workspaceModal.project.status]; return (
                  <span className={`status-badge flex items-center gap-1.5 ${sc.cls}`}><sc.Icon className="w-4 h-4" />{sc.label}</span>
                )})()}
                {workspaceModal.project.authors.map((a, i) => (
                  <span key={i} className="bg-kv-light px-4 py-1.5 rounded-full text-sm">{a}{i === 0 ? ' (капитан)' : ''}</span>
                ))}
              </div>

              {/* Passport */}
              <div>
                <h4 className="flex items-center gap-2 font-semibold mb-4 text-xs uppercase tracking-wide text-kv-muted">
                  <ClipboardList className="w-4 h-4" /> Паспорт проекта
                </h4>
                <div className="bg-[#f9fbfe] rounded-[1.75rem] p-6 space-y-2 text-sm border border-kv-border">
                  {workspaceModal.project.projectBlock && <p><span className="text-kv-muted">Предмет:</span> {workspaceModal.project.projectBlock}</p>}
                  {workspaceModal.project.projectDesc
                    ? <p className="leading-relaxed">{workspaceModal.project.projectDesc}</p>
                    : <p className="text-kv-muted italic">Описание не заполнено</p>}
                  {workspaceModal.project.productionFile && (
                    <p className="flex items-center gap-1.5 text-kv-blue"><Paperclip className="w-3.5 h-3.5" />{workspaceModal.project.productionFile}</p>
                  )}
                </div>
              </div>

              {/* Tasks snapshot */}
              {workspaceModal.project.workspaceSnapshot?.tasks && workspaceModal.project.workspaceSnapshot.tasks.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 font-semibold mb-4 text-xs uppercase tracking-wide text-kv-muted">
                    <CheckCircle2 className="w-4 h-4" /> Задачи (снимок)
                  </h4>
                  <div className="space-y-2">
                    {workspaceModal.project.workspaceSnapshot.tasks.map((task) => (
                      <div key={task.id} className="bg-[#f9fbfe] rounded-2xl px-5 py-3 flex items-center justify-between gap-3 text-sm border border-kv-border">
                        <span>{task.title}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 ${task.status === 'done' ? 'bg-[#e8f5e9] text-[#2e7d32]' : task.status === 'inprogress' ? 'bg-[#fff3e0] text-[#ef6c00]' : 'bg-kv-light text-kv-muted'}`}>
                          {task.status === 'done' ? 'Готово' : task.status === 'inprogress' ? 'В работе' : 'Запланировано'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {workspaceModal.project.workspaceSnapshot?.notes && (
                <div>
                  <h4 className="flex items-center gap-2 font-semibold mb-4 text-xs uppercase tracking-wide text-kv-muted">
                    <BookOpen className="w-4 h-4" /> Заметки команды
                  </h4>
                  <div className="bg-[#f9fbfe] rounded-[1.75rem] p-6 text-sm text-kv-text whitespace-pre-wrap leading-relaxed border border-kv-border">{workspaceModal.project.workspaceSnapshot.notes}</div>
                </div>
              )}

              {/* Files */}
              {workspaceModal.project.files.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 font-semibold mb-4 text-xs uppercase tracking-wide text-kv-muted"><FolderOpen className="w-4 h-4" /> Файлы</h4>
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

              {/* Feedback */}
              <div className="border-t border-kv-border pt-8">
                <h4 className="flex items-center gap-2 font-semibold mb-4 text-xs uppercase tracking-wide text-kv-muted">
                  <MessageSquare className="w-4 h-4" /> Обратная связь
                </h4>
                {workspaceModal.project.curatorFeedback && (
                  <div className="bg-[#e3f2fd] rounded-2xl p-4 mb-4 text-sm text-[#1565c0]">
                    <strong className="block mb-1 text-xs uppercase tracking-wide">Ранее отправлено:</strong>
                    {workspaceModal.project.curatorFeedback}
                  </div>
                )}
                <textarea className="textarea-kv w-full min-h-[120px]" placeholder="Напишите комментарий для команды…"
                  value={workspaceModal.feedbackDraft}
                  onChange={(e) => setWorkspaceModal((m) => m ? { ...m, feedbackDraft: e.target.value } : m)} />
                <div className="flex gap-3 mt-5 flex-wrap">
                  <button className="flex items-center gap-2 px-6 py-3 bg-kv-blue text-white rounded-full border-none cursor-pointer text-sm font-medium hover:bg-kv-dark transition-colors"
                    onClick={sendFeedback}>
                    <Send className="w-4 h-4" /> Отправить обратную связь
                  </button>
                  {workspaceModal.project.status === 'review' && (
                    <>
                      <button className="flex items-center gap-2 px-6 py-3 bg-[#e8f5e9] text-[#2e7d32] rounded-full border-none cursor-pointer text-sm font-medium hover:bg-[#c8e6c9] transition-colors"
                        onClick={async () => { await handleStatus(workspaceModal.project.id, 'approved', workspaceModal.feedbackDraft || undefined); setWorkspaceModal(null) }}>
                        <CheckCircle className="w-4 h-4" /> Одобрить и опубликовать
                      </button>
                      <button className="flex items-center gap-2 px-6 py-3 bg-[#ffebee] text-[#c62828] rounded-full border-none cursor-pointer text-sm font-medium hover:bg-[#ffcdd2] transition-colors"
                        onClick={async () => { await handleStatus(workspaceModal.project.id, 'rejected', workspaceModal.feedbackDraft || undefined); setWorkspaceModal(null) }}>
                        <XCircle className="w-4 h-4" /> Отклонить
                      </button>
                    </>
                  )}
                  {workspaceModal.project.status === 'feedback_requested' && (
                    <p className="text-kv-muted text-xs self-center flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> После отправки этот проект исчезнет из «Входящих»
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Catalog edit modal */}
      {showCatalogModal && (
        <div className="modal-overlay" onClick={() => setShowCatalogModal(false)}>
          <div
            className="bg-white max-w-[600px] w-full min-[640px]:w-[90%] max-h-[92vh] overflow-y-auto rounded-t-[2rem] min-[640px]:rounded-[2.5rem] p-7 min-[640px]:p-10 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close-btn" onClick={() => setShowCatalogModal(false)}><X size={20} /></button>
            <h3 className="text-[1.8rem] font-semibold mb-6">
              {editingCatalogEntry ? 'Редактировать КОП' : 'Добавить КОП'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-kv-muted mb-1.5">Название</label>
                <input className="input-kv" placeholder="Название комплекта" value={catalogForm.title}
                  onChange={(e) => setCatalogForm((f) => ({ ...f, title: e.target.value }))} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-kv-muted mb-1.5">Краткое описание (для карточки)</label>
                <textarea className="textarea-kv" rows={2} placeholder="Одно-два предложения…"
                  value={catalogForm.excerpt}
                  onChange={(e) => setCatalogForm((f) => ({ ...f, excerpt: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-kv-muted mb-1.5">Полное описание</label>
                <textarea className="textarea-kv" rows={4} placeholder="Подробное описание КОП…"
                  value={catalogForm.fullDesc}
                  onChange={(e) => setCatalogForm((f) => ({ ...f, fullDesc: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-kv-muted mb-2">Предметная область</label>
                <div className="flex flex-wrap gap-2">
                  {([
                    ['math',      'Математика'],
                    ['bio',       'Биология'],
                    ['physics',   'Физика'],
                    ['it',        'Информатика'],
                    ['economics', 'Экономика'],
                    ['pedagogy',  'Педагогика'],
                  ] as [string, string][]).map(([key, label]) => (
                    <button key={key}
                      className={`px-4 py-2 rounded-full text-sm border cursor-pointer transition-all ${catalogForm.subject === key ? 'bg-kv-blue text-white border-kv-blue' : 'bg-white border-kv-border text-kv-dark hover:bg-kv-light'}`}
                      onClick={() => setCatalogForm((f) => ({ ...f, subject: key }))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-kv-muted mb-1.5">Авторы (через запятую)</label>
                <input className="input-kv" placeholder="Иванов И.И., Петрова М.А."
                  value={catalogForm.authors}
                  onChange={(e) => setCatalogForm((f) => ({ ...f, authors: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-kv-muted mb-1.5">Технологии (через запятую)</label>
                <input className="input-kv" placeholder="Лазерная резка, 3D-печать"
                  value={catalogForm.tech}
                  onChange={(e) => setCatalogForm((f) => ({ ...f, tech: e.target.value }))} />
              </div>
            </div>

            <button
              className="w-full mt-6 py-3.5 bg-kv-blue text-white rounded-full border-none cursor-pointer font-medium hover:bg-kv-dark transition-colors"
              onClick={saveCatalogEntry}
            >
              {editingCatalogEntry ? 'Сохранить изменения' : 'Добавить в каталог'}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {catalogDeleteId !== null && (
        <div className="modal-overlay" onClick={() => setCatalogDeleteId(null)}>
          <div className="bg-white max-w-[420px] w-full min-[640px]:w-[90%] rounded-t-[2rem] min-[640px]:rounded-[2.5rem] p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 bg-[#fef2f2] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Trash2 className="w-6 h-6 text-[#dc2626]" />
            </div>
            <h3 className="text-[1.4rem] font-semibold mb-2">Удалить из каталога?</h3>
            <p className="text-kv-muted text-sm mb-7">Этот КОП исчезнет из публичного каталога. Действие можно отменить, добавив запись заново.</p>
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-full border border-kv-border bg-white text-kv-dark text-sm font-medium cursor-pointer hover:bg-kv-light transition-colors"
                onClick={() => setCatalogDeleteId(null)}>
                Отмена
              </button>
              <button className="flex-1 py-3 rounded-full bg-[#dc2626] text-white text-sm font-medium border-none cursor-pointer hover:bg-[#b91c1c] transition-colors"
                onClick={confirmDeleteCatalog}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Team project card component ────────────────────────────────────────────
function ProjectCard({
  project, onOpen, onApprove, onReject, onUnassign,
}: {
  project: SubmittedProject
  onOpen: () => void
  onApprove: () => void
  onReject: () => void
  onUnassign: () => void
}) {
  const sc = STATUS_CFG[project.status]
  const feedbackSent = project.status === 'feedback_requested' && !!project.curatorFeedback
  return (
    <div className="border border-kv-border rounded-[2rem] p-7 bg-[#f9fbfe] hover:bg-white hover:shadow-card transition-all">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-kv-light flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-kv-blue" />
        </div>
        <span className={`status-badge text-xs flex items-center gap-1 ${sc.cls}`}>
          <sc.Icon className="w-3 h-3" /> {feedbackSent && project.status === 'feedback_requested' ? 'Ответ отправлен' : sc.label}
        </span>
      </div>
      <h3 className="font-semibold mb-1">{project.teamName || '—'}</h3>
      <p className="text-kv-muted text-xs mb-1">Трек {project.track} · {project.authors.length} участников</p>
      <p className="text-sm text-kv-text mb-4 line-clamp-2">{project.projectName || 'Проект ещё не назван'}</p>
      <div className="flex flex-col gap-2">
        <button className="flex items-center justify-center gap-2 w-full py-2.5 text-sm rounded-full bg-kv-light text-kv-dark border-none cursor-pointer hover:bg-[#e2e8f0] transition-colors font-medium" onClick={onOpen}>
          <Eye className="w-3.5 h-3.5" /> Рабочее пространство
        </button>
        {project.status === 'review' && (
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs rounded-full bg-[#e8f5e9] text-[#2e7d32] border-none cursor-pointer hover:bg-[#c8e6c9] transition-colors font-medium" onClick={onApprove}>
              <CheckCircle className="w-3.5 h-3.5" /> Одобрить
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs rounded-full bg-[#ffebee] text-[#c62828] border-none cursor-pointer hover:bg-[#ffcdd2] transition-colors font-medium" onClick={onReject}>
              <XCircle className="w-3.5 h-3.5" /> Отклонить
            </button>
          </div>
        )}
        <button className="text-xs text-kv-muted bg-transparent border-none cursor-pointer hover:text-kv-dark transition-colors mt-1" onClick={onUnassign}>
          Снять с себя
        </button>
      </div>
    </div>
  )
}

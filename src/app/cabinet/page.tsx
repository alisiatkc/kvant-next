'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, UserPlus, Paperclip, Plus, Edit2, Trash2,
  Circle, Clock, CheckCircle2, Upload, File, FileText,
  Cpu, ArrowLeft, CheckCircle, XCircle, X, LogOut,
  LayoutDashboard, ClipboardList, FolderOpen, MessageSquare, BookOpen,
  Send, Calendar, Lightbulb, Hammer, School, BarChart3, Bell, AlertTriangle,
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { type SubmittedProject, submitProject, getSubmittedProjects } from '@/lib/storage'
import { STUDENT_ACCOUNTS, CURATOR_ACCOUNTS } from '@/data/accounts'

type Task = {
  id: string; title: string; desc: string
  status: 'planned' | 'inprogress' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate: string
}
type FileItem = { name: string; icon: string; size?: string; addedAt?: string }
type ApprobationRecord = {
  id: number; school: string; date: string; engagement: string
  whatWorked: string; whatNeedsWork: string; recommendations: string
}
type ChatMessage = { id: string; author: string; text: string; time: string; isSystem?: boolean }
type Tab = 'overview' | 'passport' | 'tasks' | 'files' | 'chat' | 'notes' | 'approbation'

const AI_QUESTIONS: Record<string, string[]> = {
  математика: ['Удалось ли организовать обсуждение решений?', 'Насколько задания связаны с реальной жизнью?', 'Какие трудности возникли у учеников?', 'Хотели бы вы использовать комплект снова?'],
  биология:   ['Насколько школьники были увлечены наблюдением?', 'Удобно ли проводить эксперимент?', 'Что добавить для лучшего понимания?', 'Соответствует ли уровень программе?'],
  физика:     ['Насколько наглядно представлены явления?', 'Были ли трудности при опыте?', 'Оцените безопасность использования.', 'Что изменить для улучшения?'],
  информатика:['Понятны ли инструкции?', 'Какие алгоритмические задачи удалось решить?', 'Что можно упростить?', 'Подходит ли для самостоятельной работы?'],
  экономика:  ['Насколько игра отражает реальные процессы?', 'Было ли интересно?', 'Какие дополнения предложили бы ученики?', 'Сколько времени заняло занятие?'],
  педагогика: ['Насколько игровая форма помогла?', 'Удалось ли удержать внимание детей?', 'Что улучшить в методике?', 'Подходит ли для разных возрастных групп?'],
}

const PRIORITY_CFG = {
  low:    { label: 'Низкий',  color: 'text-[#16a34a]', bg: 'bg-[#f0fdf4]', border: 'border-[#86efac]' },
  medium: { label: 'Средний', color: 'text-[#d97706]', bg: 'bg-[#fffbeb]', border: 'border-[#fcd34d]' },
  high:   { label: 'Высокий', color: 'text-[#dc2626]', bg: 'bg-[#fef2f2]', border: 'border-[#fca5a5]' },
}

const STATUS_CFG = {
  feedback_requested: { label: 'Ожидает обратной связи', bg: 'bg-[#e3f2fd]', color: 'text-[#1565c0]', Icon: Bell },
  review:    { label: 'На рассмотрении', bg: 'bg-[#fff3e0]', color: 'text-[#ef6c00]', Icon: Clock },
  approved:  { label: 'Одобрено',         bg: 'bg-[#e8f5e9]', color: 'text-[#2e7d32]', Icon: CheckCircle },
  rejected:  { label: 'Отклонено',        bg: 'bg-[#ffebee]', color: 'text-[#c62828]', Icon: XCircle },
}

const NAV: { id: Tab; label: string; Icon: React.ComponentType<{ className?: string }>; onlyPublished?: boolean }[] = [
  { id: 'overview',    label: 'Обзор',           Icon: LayoutDashboard },
  { id: 'passport',    label: 'Паспорт проекта', Icon: ClipboardList },
  { id: 'tasks',       label: 'Трекер задач',    Icon: CheckCircle2 },
  { id: 'files',       label: 'Рабочие файлы',   Icon: FolderOpen },
  { id: 'chat',        label: 'Командный чат',   Icon: MessageSquare },
  { id: 'notes',       label: 'Заметки',         Icon: BookOpen },
  { id: 'approbation', label: 'Апробация',       Icon: School, onlyPublished: true },
]

const columns: { status: Task['status']; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { status: 'planned',    label: 'Запланировано', Icon: Circle },
  { status: 'inprogress', label: 'В работе',      Icon: Clock },
  { status: 'done',       label: 'Готово',         Icon: CheckCircle2 },
]

function teamKey(key: string, team: string) {
  return `${key}_${team.replace(/\s/g, '_')}`
}

export default function CabinetPage() {
  const router = useRouter()

  // ── auth ─────────────────────────────────────────────────────────────────
  const [loggedIn,        setLoggedIn]        = useState(false)
  const [userType,        setUserType]        = useState<'student' | 'curator'>('student')
  const [captainName,     setCaptainName]     = useState('')
  const [teamName,        setTeamName]        = useState('')
  const [track,           setTrack]           = useState<'А1' | 'А2'>('А1')
  const [curatorLogin,    setCuratorLogin]    = useState('')
  const [curatorPassword, setCuratorPassword] = useState('')
  const [loginError,      setLoginError]      = useState('')

  // ── navigation ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  // ── passport ─────────────────────────────────────────────────────────────
  const [projectName,    setProjectName]    = useState('')
  const [projectBlock,   setProjectBlock]   = useState('')
  const [projectDesc,    setProjectDesc]    = useState('')
  const [authors,        setAuthors]        = useState<string[]>([])
  const [newAuthorInput, setNewAuthorInput] = useState('')
  const [showAuthorModal,setShowAuthorModal]= useState(false)
  const [productionFile, setProductionFile] = useState('')
  const [passportSaved,  setPassportSaved]  = useState(false)

  // ── tasks ────────────────────────────────────────────────────────────────
  const [tasks,         setTasks]         = useState<Task[]>([])
  const [draggedId,     setDraggedId]     = useState<string | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask,   setEditingTask]   = useState<Task | null>(null)
  const [taskTitle,     setTaskTitle]     = useState('')
  const [taskDesc,      setTaskDesc]      = useState('')
  const [taskPriority,  setTaskPriority]  = useState<'low' | 'medium' | 'high'>('medium')
  const [taskDueDate,   setTaskDueDate]   = useState('')

  // ── files ────────────────────────────────────────────────────────────────
  const [files, setFiles] = useState<FileItem[]>([])

  // ── chat ─────────────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'sys0', author: 'Система', isSystem: true, time: '',
      text: 'Добро пожаловать! Здесь вы можете общаться с участниками команды.' },
  ])
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // ── notes ────────────────────────────────────────────────────────────────
  const [notes,      setNotes]      = useState('')
  const [notesSaved, setNotesSaved] = useState(false)

  // ── publication ───────────────────────────────────────────────────────────
  const [published,        setPublished]        = useState(false)
  const [projectStatus,    setProjectStatus]    = useState<SubmittedProject['status']>('feedback_requested')
  const [curatorFeedback,  setCuratorFeedback]  = useState('')
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [showFeedbackSent, setShowFeedbackSent] = useState(false)

  // ── approbation ───────────────────────────────────────────────────────────
  const [approbationHistory, setApprobationHistory] = useState<ApprobationRecord[]>([])
  const [approbationForm,    setApprobationForm]    = useState({
    school: '', date: '', engagement: '', whatWorked: '', whatNeedsWork: '', recommendations: '',
  })
  const [aiQuestions,     setAiQuestions]     = useState<string[]>([])
  const [showAiQuestions, setShowAiQuestions] = useState(false)
  const [approbationSaved,setApprobationSaved]= useState(false)

  const projectId = useRef<string>('')

  // ── load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const savedCaptain = localStorage.getItem('cabinet_captainName')
        const savedTeam    = localStorage.getItem('cabinet_teamName')
        const savedTrack   = localStorage.getItem('cabinet_track') as 'А1' | 'А2' | null
        const savedCurator = localStorage.getItem('cabinet_curatorLogin') || ''
        if (savedCaptain && savedTeam) {
          setCaptainName(savedCaptain)
          setTeamName(savedTeam)
          if (savedTrack) setTrack(savedTrack)
          setCuratorLogin(savedCurator)
          const savedAuthors = localStorage.getItem(teamKey('cabinet_authors', savedTeam))
          setAuthors(savedAuthors ? JSON.parse(savedAuthors) : [savedCaptain])
          setLoggedIn(true)

          const savedTasks = localStorage.getItem(teamKey('cabinet_tasks', savedTeam))
          if (savedTasks) setTasks(JSON.parse(savedTasks))
          const savedFiles = localStorage.getItem(teamKey('cabinet_files', savedTeam))
          if (savedFiles) setFiles(JSON.parse(savedFiles))
          const savedChat = localStorage.getItem(teamKey('cabinet_chat', savedTeam))
          if (savedChat) {
            setChatMessages([
              { id: 'sys0', author: 'Система', isSystem: true, time: '',
                text: 'Добро пожаловать! Здесь вы можете общаться с участниками команды.' },
              ...JSON.parse(savedChat),
            ])
          }
          setNotes(localStorage.getItem(teamKey('cabinet_notes', savedTeam)) || '')
          setProjectName(   localStorage.getItem(teamKey('cabinet_projectName',    savedTeam)) || '')
          setProjectBlock(  localStorage.getItem(teamKey('cabinet_projectBlock',   savedTeam)) || '')
          setProjectDesc(   localStorage.getItem(teamKey('cabinet_projectDesc',    savedTeam)) || '')
          setProductionFile(localStorage.getItem(teamKey('cabinet_productionFile', savedTeam)) || '')
        }
      } catch {}

      try {
        const pid = localStorage.getItem('currentProjectId') || ''
        const pub = localStorage.getItem('projectPublished') === 'true'
        projectId.current = pid
        if (pub && pid) {
          const subs = await getSubmittedProjects()
          const mine = subs.find((s) => s.id === pid)
          setPublished(true)
          setProjectStatus(mine?.status || 'feedback_requested')
          if (mine?.curatorFeedback) setCuratorFeedback(mine.curatorFeedback)
          const hist = JSON.parse(localStorage.getItem(`approbationHistory_${pid}`) || '[]')
          setApprobationHistory(hist)
        }
      } catch {}
    })()
  }, [])

  useEffect(() => {
    const t = localStorage.getItem('cabinet_teamName')
    if (t) try { localStorage.setItem(teamKey('cabinet_tasks', t), JSON.stringify(tasks)) } catch {}
  }, [tasks])
  useEffect(() => {
    const t = localStorage.getItem('cabinet_teamName')
    if (t) try { localStorage.setItem(teamKey('cabinet_files', t), JSON.stringify(files)) } catch {}
  }, [files])
  useEffect(() => {
    if (loggedIn) {
      try { localStorage.setItem(teamKey('cabinet_authors', teamName), JSON.stringify(authors)) } catch {}
    }
  }, [authors, loggedIn, teamName])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleLogin = () => {
    setLoginError('')
    if (userType === 'student') {
      if (!captainName.trim()) { setLoginError('Введите имя и фамилию'); return }
      const account = STUDENT_ACCOUNTS.find(
        (a) => a.name.toLowerCase() === captainName.trim().toLowerCase(),
      )
      if (!account) {
        setLoginError('Вас нет в списке студентов. Уточните у куратора.')
        return
      }
      const id = localStorage.getItem('currentProjectId') || Date.now().toString()
      projectId.current = id
      try {
        localStorage.setItem('cabinet_captainName', account.name)
        localStorage.setItem('cabinet_teamName',    account.teamName)
        localStorage.setItem('cabinet_track',       account.track)
        localStorage.setItem('cabinet_curatorLogin',account.curatorLogin)
        localStorage.setItem('currentProjectId',    id)
        const existing = localStorage.getItem(teamKey('cabinet_authors', account.teamName))
        if (!existing) {
          localStorage.setItem(teamKey('cabinet_authors', account.teamName), JSON.stringify([account.name]))
        }
      } catch {}
      setTeamName(account.teamName)
      setTrack(account.track)
      setCuratorLogin(account.curatorLogin)
      const savedAuthors = localStorage.getItem(teamKey('cabinet_authors', account.teamName))
      setAuthors(savedAuthors ? JSON.parse(savedAuthors) : [account.name])

      const savedTasks = localStorage.getItem(teamKey('cabinet_tasks', account.teamName))
      setTasks(savedTasks ? JSON.parse(savedTasks) : [])
      const savedFiles = localStorage.getItem(teamKey('cabinet_files', account.teamName))
      setFiles(savedFiles ? JSON.parse(savedFiles) : [])
      setProjectName(   localStorage.getItem(teamKey('cabinet_projectName',    account.teamName)) || '')
      setProjectBlock(  localStorage.getItem(teamKey('cabinet_projectBlock',   account.teamName)) || '')
      setProjectDesc(   localStorage.getItem(teamKey('cabinet_projectDesc',    account.teamName)) || '')
      setProductionFile(localStorage.getItem(teamKey('cabinet_productionFile', account.teamName)) || '')
      setNotes(         localStorage.getItem(teamKey('cabinet_notes',          account.teamName)) || '')

      setLoggedIn(true)
    } else {
      const curator = CURATOR_ACCOUNTS.find(
        (c) => c.login === curatorLogin.trim() && c.password === curatorPassword,
      )
      if (!curator) { setLoginError('Неверный логин или пароль'); return }
      try {
        localStorage.setItem('curatorLoggedIn', 'true')
        localStorage.setItem('curatorId', curator.id)
        localStorage.setItem('curatorLoginName', curator.login)
      } catch {}
      router.push('/curator')
    }
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem('cabinet_captainName')
      localStorage.removeItem('cabinet_teamName')
      localStorage.removeItem('cabinet_track')
      localStorage.removeItem('cabinet_curatorLogin')
      localStorage.removeItem('currentProjectId')
      localStorage.removeItem('projectPublished')
    } catch {}
    setLoggedIn(false)
    setCaptainName('')
    setTeamName('')
    setTrack('А1')
    setCuratorLogin('')
    setPublished(false)
    setActiveTab('overview')
  }

  const savePassport = () => {
    try {
      localStorage.setItem(teamKey('cabinet_projectName',    teamName), projectName)
      localStorage.setItem(teamKey('cabinet_projectBlock',   teamName), projectBlock)
      localStorage.setItem(teamKey('cabinet_projectDesc',    teamName), projectDesc)
      localStorage.setItem(teamKey('cabinet_productionFile', teamName), productionFile)
    } catch {}
    setPassportSaved(true)
    setTimeout(() => setPassportSaved(false), 3000)
  }

  const buildSubmission = (id: string, status: SubmittedProject['status']): SubmittedProject => ({
    id,
    projectName:    projectName  || 'Без названия',
    projectBlock:   projectBlock || '',
    projectDesc:    projectDesc  || '',
    teamName,
    captain:        captainName,
    track,
    authors,
    productionFile,
    files: files.map((f) => ({ name: f.name, icon: f.icon, size: f.size || '—' })),
    status,
    submittedAt:     new Date().toISOString(),
    curatorLogin,
    workspaceSnapshot: { tasks, notes },
  })

  const handleFeedbackRequest = async () => {
    const id = projectId.current || Date.now().toString()
    projectId.current = id
    const submission = buildSubmission(id, 'feedback_requested')
    try {
      await submitProject(submission)
      localStorage.setItem('projectPublished', 'true')
      localStorage.setItem('currentProjectId', id)
    } catch {}
    setPublished(true)
    setProjectStatus('feedback_requested')
    setShowFeedbackSent(true)
  }

  const handlePublish = () => setShowPublishConfirm(true)

  const confirmPublish = async () => {
    const id = projectId.current || Date.now().toString()
    projectId.current = id
    const submission = buildSubmission(id, 'review')
    try {
      await submitProject(submission)
      localStorage.setItem('projectPublished', 'true')
      localStorage.setItem('currentProjectId', id)
    } catch {}
    setPublished(true)
    setProjectStatus('review')
    setShowPublishConfirm(false)
    setShowNotification(true)
  }

  const saveApprobation = () => {
    if (!approbationForm.school.trim()) { alert('Укажите название школы'); return }
    const record: ApprobationRecord = { id: Date.now(), ...approbationForm }
    const newHist = [...approbationHistory, record]
    setApprobationHistory(newHist)
    try { localStorage.setItem(`approbationHistory_${projectId.current}`, JSON.stringify(newHist)) } catch {}
    setApprobationForm({ school: '', date: '', engagement: '', whatWorked: '', whatNeedsWork: '', recommendations: '' })
    setApprobationSaved(true)
    setTimeout(() => setApprobationSaved(false), 3000)
  }

  const openTask = (task?: Task) => {
    if (task) {
      setEditingTask(task); setTaskTitle(task.title)
      setTaskDesc(task.desc); setTaskPriority(task.priority); setTaskDueDate(task.dueDate)
    } else {
      setEditingTask(null); setTaskTitle(''); setTaskDesc(''); setTaskPriority('medium'); setTaskDueDate('')
    }
    setShowTaskModal(true)
  }

  const saveTask = () => {
    if (!taskTitle.trim()) return
    if (editingTask) {
      setTasks((p) => p.map((t) => t.id === editingTask.id
        ? { ...t, title: taskTitle, desc: taskDesc, priority: taskPriority, dueDate: taskDueDate } : t))
    } else {
      setTasks((p) => [...p, { id: Date.now().toString(), title: taskTitle, desc: taskDesc, status: 'planned', priority: taskPriority, dueDate: taskDueDate }])
    }
    setShowTaskModal(false)
  }

  const onDrop = (status: Task['status']) => {
    if (!draggedId) return
    setTasks((p) => p.map((t) => t.id === draggedId ? { ...t, status } : t))
    setDraggedId(null)
  }

  const addFile = () => {
    const name = prompt('Название файла (например, product.dxf):')
    if (!name?.trim()) return
    setFiles((p) => [...p, { name: name.trim(), icon: name.endsWith('.pdf') ? 'FileText' : 'File', size: '—', addedAt: new Date().toISOString().slice(0, 10) }])
  }

  const sendMessage = () => {
    if (!chatInput.trim()) return
    const msg: ChatMessage = { id: Date.now().toString(), author: captainName, text: chatInput.trim(), time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }
    const next = [...chatMessages, msg]
    setChatMessages(next)
    setChatInput('')
    try { localStorage.setItem(teamKey('cabinet_chat', teamName), JSON.stringify(next.filter((m) => !m.isSystem))) } catch {}
  }

  const generateAiQuestions = () => {
    const subject = prompt('Укажите предмет (математика, биология, физика, информатика, экономика, педагогика):', 'математика')?.toLowerCase() || 'математика'
    setAiQuestions(AI_QUESTIONS[subject] ?? AI_QUESTIONS.математика)
    setShowAiQuestions(true)
  }

  // ── derived ───────────────────────────────────────────────────────────────
  const doneTasks      = tasks.filter((t) => t.status === 'done').length
  const passportFilled = !!(projectName.trim() && projectDesc.trim())

  let currentStage = 0
  if (passportFilled) currentStage = 1
  if (published)      currentStage = 2
  if (approbationHistory.length > 0) currentStage = 3

  const stages = [
    { Icon: Lightbulb, label: 'Идея',      hint: 'Проект начат' },
    { Icon: Hammer,    label: 'Разработка', hint: 'Паспорт заполнен' },
    { Icon: School,    label: 'Апробация',  hint: 'КОП направлен куратору' },
    { Icon: BarChart3, label: 'Рефлексия',  hint: 'Апробация пройдена' },
  ]

  const visibleTabs = NAV.filter((t) => !t.onlyPublished || (published && projectStatus === 'approved'))
  const sc = STATUS_CFG[projectStatus]
  const canFeedback = passportFilled && (!published || projectStatus === 'feedback_requested')
  const canPublish  = passportFilled && projectStatus !== 'review' && projectStatus !== 'approved'

  // ── login screen ──────────────────────────────────────────────────────────
  if (!loggedIn) {
    return (
      <>
        <Header active="cabinet" />
        <main>
          <div className="bg-white rounded-[3rem] px-[50px] py-[60px] max-w-[520px] mx-auto my-16 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)]">
            <Link href="/" className="flex items-center gap-2 text-kv-blue font-medium no-underline mb-8 text-sm">
              <ArrowLeft className="w-4 h-4" /> На главную
            </Link>
            <h2 className="text-[2.2rem] font-semibold mb-1">Вход в КвантЛаб</h2>
            <p className="text-kv-text mb-8 text-sm">Выберите роль для входа</p>

            <div className="flex gap-3 mb-8 p-1 bg-kv-light rounded-2xl">
              {(['student', 'curator'] as const).map((t) => (
                <button key={t}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer border-none transition-all ${userType === t ? 'bg-white text-kv-dark shadow-sm' : 'bg-transparent text-kv-muted hover:text-kv-dark'}`}
                  onClick={() => setUserType(t)}
                >
                  {t === 'student' ? 'Студент' : 'Куратор'}
                </button>
              ))}
            </div>

            {userType === 'student' ? (
              <>
                <div className="mb-3 bg-kv-light rounded-2xl px-5 py-3">
                  <p className="text-kv-muted text-xs leading-relaxed">
                    Введите имя и фамилию точно так, как они указаны куратором. Примеры: <strong>Ткаченко Алиса</strong>, <strong>Петрова Мария</strong>
                  </p>
                </div>
                <div className="mb-6">
                  <label className="block mb-2 font-medium text-[#3f4a6b] text-sm">Имя и фамилия</label>
                  <input className="input-kv" placeholder="Иванова Мария" value={captainName}
                    onChange={(e) => setCaptainName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block mb-2 font-medium text-[#3f4a6b] text-sm">Логин</label>
                  <input className="input-kv" placeholder="curator" value={curatorLogin}
                    onChange={(e) => setCuratorLogin(e.target.value)} />
                </div>
                <div className="mb-6">
                  <label className="block mb-2 font-medium text-[#3f4a6b] text-sm">Пароль</label>
                  <input className="input-kv" type="password" placeholder="••••••••" value={curatorPassword}
                    onChange={(e) => setCuratorPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                </div>
              </>
            )}

            {loginError && (
              <div className="flex items-center gap-2 text-[#c62828] text-sm mb-4 bg-[#ffebee] px-4 py-3 rounded-2xl">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {loginError}
              </div>
            )}
            <button className="w-full py-4 bg-kv-dark text-white rounded-full text-base font-medium cursor-pointer hover:bg-kv-blue transition-colors border-none" onClick={handleLogin}>
              Войти
            </button>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // ── cabinet ───────────────────────────────────────────────────────────────
  return (
    <>
      <Header active="cabinet" />
      <main>
        <div className="container-kv py-8">

          {/* Top bar */}
          <div className="bg-white rounded-[2rem] px-8 py-5 mb-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-kv-muted text-xs uppercase tracking-wide block mb-0.5">Рабочее пространство</span>
              <span className="text-xl font-semibold">{captainName} <span className="text-kv-muted font-normal text-base">· {teamName}</span></span>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="tag-kv">{track}</span>
              <span className={`status-badge flex items-center gap-1.5 ${
                published ? `${sc.bg} ${sc.color}` : 'bg-kv-light text-kv-muted'
              }`}>
                {published ? <><sc.Icon className="w-3.5 h-3.5" /> {sc.label}</> : 'Черновик'}
              </span>
              <button
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-kv-muted border border-kv-border bg-white cursor-pointer hover:text-kv-dark hover:border-kv-dark transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="w-3.5 h-3.5" /> Выйти
              </button>
            </div>
          </div>

          {/* Curator feedback banner */}
          {published && curatorFeedback && (
            <div className="bg-[#e3f2fd] border border-[#90caf9] rounded-[1.75rem] px-7 py-5 mb-6 flex items-start gap-3">
              <MessageSquare className="w-4 h-4 text-[#1565c0] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-[#1565c0] text-sm mb-1">Обратная связь куратора</p>
                <p className="text-[#1565c0] text-sm">{curatorFeedback}</p>
              </div>
            </div>
          )}

          <div className="flex gap-6 items-start max-[920px]:flex-col">

            {/* Sidebar */}
            <nav className="w-[200px] flex-shrink-0 space-y-1 max-[920px]:w-full max-[920px]:flex max-[920px]:flex-wrap max-[920px]:gap-2 max-[920px]:space-y-0">
              {visibleTabs.map(({ id, label, Icon }) => (
                <button key={id}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-left text-[0.88rem] cursor-pointer border-none transition-all max-[920px]:w-auto max-[920px]:flex-1 ${activeTab === id ? 'bg-kv-blue text-white font-medium' : 'bg-white text-kv-dark hover:bg-kv-light'}`}
                  onClick={() => setActiveTab(id)}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* ════ OVERVIEW ════ */}
              {activeTab === 'overview' && (
                <>
                  {/* Progress */}
                  <div className="bg-white rounded-[2.5rem] p-8">
                    <h3 className="text-[1.3rem] font-semibold mb-7">Прогресс проекта</h3>
                    <div className="relative flex">
                      <div className="absolute top-5 left-5 right-5 h-[2px] bg-kv-light" />
                      <div className="absolute top-5 left-5 h-[2px] bg-kv-blue transition-all duration-500"
                        style={{ width: currentStage === 0 ? 0 : currentStage >= 3 ? 'calc(100% - 40px)' : `${currentStage * 33.33}%` }} />
                      {stages.map(({ Icon, label, hint }, i) => {
                        const done = i < currentStage
                        const active = i === currentStage
                        return (
                          <div key={label} className="flex-1 flex flex-col items-center gap-2.5 relative z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${done ? 'bg-kv-blue text-white' : active ? 'bg-white border-2 border-kv-blue text-kv-blue' : 'bg-kv-light text-kv-muted'}`}>
                              {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                            </div>
                            <span className={`text-xs font-medium text-center leading-tight ${active ? 'text-kv-blue' : done ? 'text-kv-dark' : 'text-kv-muted'}`}>{label}</span>
                            <span className="text-[0.7rem] text-kv-muted text-center hidden min-[560px]:block">{hint}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 min-[560px]:grid-cols-4 gap-4">
                    {[
                      { label: 'Задач выполнено', value: `${doneTasks}/${tasks.length}`, color: 'text-kv-blue' },
                      { label: 'Файлов загружено', value: files.length,              color: 'text-[#7c3aed]' },
                      { label: 'Участников',        value: authors.length,            color: 'text-[#059669]' },
                      { label: 'Апробаций',          value: approbationHistory.length, color: 'text-[#d97706]' },
                    ].map((s) => (
                      <div key={s.label} className="bg-white rounded-[1.75rem] p-6 text-center border border-kv-border">
                        <div className={`text-[1.9rem] font-bold ${s.color} mb-1`}>{s.value}</div>
                        <div className="text-kv-muted text-xs">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Status */}
                  {published && (
                    <div className={`rounded-[1.75rem] p-6 flex items-start gap-4 ${sc.bg}`}>
                      <sc.Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${sc.color}`} />
                      <div>
                        <p className={`font-medium ${sc.color}`}>Статус КОП: {sc.label}</p>
                        {projectStatus === 'feedback_requested' && <p className="text-sm text-kv-muted mt-1">Куратор получил запрос и скоро оставит комментарий.</p>}
                        {projectStatus === 'review'             && <p className="text-sm text-kv-muted mt-1">Проект направлен на публикацию — куратор рассматривает его.</p>}
                        {projectStatus === 'approved'           && <p className="text-sm text-kv-muted mt-1">КОП одобрен и опубликован в каталоге. Переходите к апробации!</p>}
                        {projectStatus === 'rejected'           && <p className="text-sm text-kv-muted mt-1">Куратор отклонил проект — уточните причины и внесите правки.</p>}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="bg-white rounded-[2.5rem] p-8">
                    <h4 className="font-semibold mb-5 text-[1rem]">Быстрые действия</h4>
                    <div className="flex flex-wrap gap-3">
                      <button className="btn-blue text-sm" onClick={() => setActiveTab('passport')}>
                        <ClipboardList className="w-4 h-4" /> Паспорт
                      </button>
                      <button className="btn-blue text-sm" onClick={() => { openTask(); setActiveTab('tasks') }}>
                        <Plus className="w-4 h-4" /> Новая задача
                      </button>
                      <button className="btn-blue text-sm" onClick={() => setActiveTab('chat')}>
                        <MessageSquare className="w-4 h-4" /> Чат
                      </button>
                      {canFeedback && (
                        <button className="flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-full bg-[#e3f2fd] text-[#1565c0] border-none cursor-pointer hover:bg-[#bbdefb] transition-colors" onClick={handleFeedbackRequest}>
                          <Bell className="w-4 h-4" /> Сообщить куратору
                        </button>
                      )}
                      {canPublish && (
                        <button className="flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-full bg-[#e8f5e9] text-[#2e7d32] border-none cursor-pointer hover:bg-[#c8e6c9] transition-colors" onClick={handlePublish}>
                          <CheckCircle2 className="w-4 h-4" /> Опубликовать КОП
                        </button>
                      )}
                      {published && projectStatus === 'approved' && (
                        <button className="btn-ai text-sm" onClick={() => setActiveTab('approbation')}>
                          <School className="w-4 h-4" /> Добавить апробацию
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ════ PASSPORT ════ */}
              {activeTab === 'passport' && (
                <div className="bg-white rounded-[2.5rem] p-8">
                  <h3 className="text-[1.3rem] font-semibold mb-1">Паспорт проекта</h3>
                  <p className="text-kv-muted text-sm mb-7">Основной документ коробочного образовательного комплекта</p>

                  <div className="grid grid-cols-2 gap-5 max-[700px]:grid-cols-1">
                    <div>
                      <label className="block mb-2 font-medium text-[#3f4a6b] text-sm">Название КОП</label>
                      <input className="input-kv" placeholder="Геометрический конструктор" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block mb-2 font-medium text-[#3f4a6b] text-sm">Предметная область</label>
                      <input className="input-kv" placeholder="Математика, 7–8 класс" value={projectBlock} onChange={(e) => setProjectBlock(e.target.value)} />
                    </div>
                    <div className="col-span-2 max-[700px]:col-span-1">
                      <label className="block mb-2 font-medium text-[#3f4a6b] text-sm">Описание КОП</label>
                      <textarea className="textarea-kv" rows={4} placeholder="Цель, целевая аудитория, особенности и методические задачи" value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} />
                    </div>
                  </div>

                  <div className="mt-7">
                    <label className="block mb-3 font-medium text-sm">Состав команды</label>
                    <div className="flex flex-wrap gap-3 mb-4">
                      {authors.map((a, i) => (
                        <span key={i} className="bg-kv-light px-4 py-2 rounded-full flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-kv-blue" /> {a}{i === 0 && <span className="text-kv-muted text-xs">капитан</span>}
                        </span>
                      ))}
                    </div>
                    <button className="bg-transparent border border-dashed border-[#9aa9c0] rounded-full px-5 py-2 text-sm cursor-pointer flex items-center gap-2 hover:border-kv-blue transition-colors" onClick={() => setShowAuthorModal(true)}>
                      <UserPlus className="w-4 h-4" /> Добавить участника
                    </button>
                  </div>

                  <div className="bg-kv-light rounded-[1.75rem] p-6 mt-7 flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h4 className="font-medium mb-1 text-sm">Производственный файл</h4>
                      <p className="text-kv-muted text-xs">DXF/SVG для лазера · STL для 3D-печати · PDF для методики</p>
                      {productionFile && <p className="mt-2 flex items-center gap-1.5 text-kv-blue text-sm"><Paperclip className="w-4 h-4" />{productionFile}</p>}
                    </div>
                    <button className="bg-white border border-kv-blue text-kv-blue px-5 py-2.5 rounded-full cursor-pointer flex items-center gap-2 hover:bg-kv-light transition-colors text-sm font-medium"
                      onClick={() => { const f = prompt('Название файла (product.dxf):'); if (f) setProductionFile(f) }}>
                      <Paperclip className="w-4 h-4" /> Прикрепить
                    </button>
                  </div>

                  {passportSaved && <div className="mt-4 bg-[#e8f5e9] px-5 py-3 rounded-2xl text-[#2e7d32] text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Паспорт сохранён</div>}
                  <button className="bg-kv-blue text-white border-none rounded-full px-9 py-3.5 text-base font-medium cursor-pointer hover:bg-kv-dark transition-colors mt-6" onClick={savePassport}>
                    Сохранить паспорт
                  </button>
                </div>
              )}

              {/* ════ TASKS ════ */}
              {activeTab === 'tasks' && (
                <div className="bg-white rounded-[2.5rem] p-8">
                  <div className="flex justify-between items-center mb-7">
                    <div>
                      <h3 className="text-[1.3rem] font-semibold">Трекер задач</h3>
                      <p className="text-kv-muted text-sm mt-0.5">{doneTasks} из {tasks.length} выполнено</p>
                    </div>
                    <button className="btn-blue" onClick={() => openTask()}><Plus className="w-4 h-4" /> Новая задача</button>
                  </div>
                  {tasks.length === 0 ? (
                    <div className="text-center py-16 text-kv-muted">
                      <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Задач пока нет</p>
                      <p className="text-xs mt-1">Создайте первую задачу, чтобы отслеживать работу над КОП</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4 max-[700px]:grid-cols-1">
                      {columns.map(({ status, label, Icon }) => (
                        <div key={status} className="bg-[#f9fbfe] rounded-[1.75rem] p-5 min-h-[200px]"
                          onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(status)}>
                          <h4 className="flex items-center gap-2 mb-4 text-kv-blue font-medium text-xs uppercase tracking-wide">
                            <Icon className="w-4 h-4" /> {label}
                            <span className="ml-auto bg-kv-light text-kv-muted rounded-full px-2 py-0.5 font-semibold">
                              {tasks.filter((t) => t.status === status).length}
                            </span>
                          </h4>
                          {tasks.filter((t) => t.status === status).map((task) => {
                            const p = PRIORITY_CFG[task.priority]
                            const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
                            return (
                              <div key={task.id}
                                className={`bg-white rounded-2xl p-4 mb-2.5 border cursor-grab select-none hover:shadow-card transition-all ${overdue ? 'border-[#fca5a5]' : 'border-kv-border'}`}
                                draggable onDragStart={() => setDraggedId(task.id)} onDragEnd={() => setDraggedId(null)}>
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <p className="font-medium text-sm leading-snug">{task.title}</p>
                                  <span className={`text-[0.65rem] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${p.bg} ${p.color}`}>{p.label}</span>
                                </div>
                                {task.desc && <p className="text-kv-text text-xs mb-2 leading-relaxed">{task.desc}</p>}
                                {task.dueDate && (
                                  <p className={`text-xs flex items-center gap-1 mb-2 ${overdue ? 'text-[#ef4444]' : 'text-kv-muted'}`}>
                                    <Calendar className="w-3 h-3" />{overdue ? '! ' : ''}{task.dueDate}
                                  </p>
                                )}
                                <div className="flex justify-end gap-1 mt-1">
                                  <button className="bg-transparent border-none cursor-pointer text-[#8b9bb5] hover:text-kv-blue p-1" onClick={() => openTask(task)}><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button className="bg-transparent border-none cursor-pointer text-[#8b9bb5] hover:text-red-400 p-1" onClick={() => confirm('Удалить задачу?') && setTasks((p) => p.filter((t) => t.id !== task.id))}><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            )
                          })}
                          {tasks.filter((t) => t.status === status).length === 0 && (
                            <div className="flex items-center justify-center h-16 text-kv-muted text-xs">Перетащите сюда</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ════ FILES ════ */}
              {activeTab === 'files' && (
                <div className="bg-white rounded-[2.5rem] p-8">
                  <div className="flex justify-between items-center mb-7">
                    <div>
                      <h3 className="text-[1.3rem] font-semibold">Рабочие файлы</h3>
                      <p className="text-kv-muted text-sm mt-0.5">{files.length} файл{files.length === 1 ? '' : files.length < 5 ? 'а' : 'ов'}</p>
                    </div>
                    <button className="btn-blue" onClick={addFile}><Upload className="w-4 h-4" /> Загрузить</button>
                  </div>
                  {files.length === 0 ? (
                    <div className="text-center py-16 text-kv-muted">
                      <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Файлов пока нет</p>
                      <p className="text-xs mt-1">Добавьте DXF, STL, PDF или другие рабочие файлы КОП</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
                      {files.map((f, i) => (
                        <div key={i} className="bg-[#f9fbfe] rounded-[1.75rem] p-5 border border-kv-border relative group hover:bg-kv-light hover:-translate-y-0.5 transition-all">
                          <button className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white border-none rounded-full p-1 cursor-pointer text-[#8b9bb5] hover:text-red-400"
                            onClick={() => confirm('Удалить файл?') && setFiles((p) => p.filter((_, idx) => idx !== i))}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="cursor-pointer text-center" onClick={() => alert(`Скачивание ${f.name} (демо)`)}>
                            {f.icon === 'FileText' ? <FileText className="w-8 h-8 text-kv-blue mx-auto mb-3" /> : <File className="w-8 h-8 text-kv-blue mx-auto mb-3" />}
                            <span className="text-xs block mb-1 break-words">{f.name}</span>
                            {f.size && <span className="text-[#8b9bb5] text-[0.7rem]">{f.size}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ════ CHAT ════ */}
              {activeTab === 'chat' && (
                <div className="bg-white rounded-[2.5rem] p-8 flex flex-col" style={{ height: '580px' }}>
                  <h3 className="text-[1.3rem] font-semibold mb-0.5">Командный чат</h3>
                  <p className="text-kv-muted text-sm mb-5">Команда: {teamName}</p>
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                    {chatMessages.map((msg) => (
                      <div key={msg.id}>
                        {msg.isSystem ? (
                          <div className="text-center">
                            <span className="text-xs text-kv-muted bg-kv-light px-4 py-1.5 rounded-full inline-block">{msg.text}</span>
                          </div>
                        ) : (
                          <div className={`flex gap-2.5 ${msg.author === captainName ? 'flex-row-reverse' : ''}`}>
                            <div className="w-8 h-8 rounded-full bg-kv-light flex items-center justify-center flex-shrink-0 text-kv-blue font-semibold text-sm">
                              {msg.author.charAt(0).toUpperCase()}
                            </div>
                            <div className={`max-w-[70%] flex flex-col gap-1 ${msg.author === captainName ? 'items-end' : 'items-start'}`}>
                              <span className="text-[0.7rem] text-kv-muted">{msg.author} · {msg.time}</span>
                              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.author === captainName ? 'bg-kv-blue text-white rounded-tr-sm' : 'bg-[#f2f5fb] rounded-tl-sm'}`}>
                                {msg.text}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="flex gap-3">
                    <input className="input-kv flex-1" placeholder="Написать сообщение…" value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()} />
                    <button className="btn-blue px-5" onClick={sendMessage}><Send className="w-4 h-4" /></button>
                  </div>
                </div>
              )}

              {/* ════ NOTES ════ */}
              {activeTab === 'notes' && (
                <div className="bg-white rounded-[2.5rem] p-8">
                  <h3 className="text-[1.3rem] font-semibold mb-1">Заметки проекта</h3>
                  <p className="text-kv-muted text-sm mb-6">Идеи, ссылки, наблюдения — записывайте по ходу работы</p>
                  <textarea className="textarea-kv w-full min-h-[380px]" placeholder="Начните писать заметки о вашем КОП…" value={notes}
                    onChange={(e) => setNotes(e.target.value)} />
                  {notesSaved && <div className="mt-3 bg-[#e8f5e9] px-5 py-3 rounded-2xl text-[#2e7d32] text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />Заметки сохранены</div>}
                  <button className="bg-kv-blue text-white border-none rounded-full px-9 py-3.5 text-base font-medium cursor-pointer hover:bg-kv-dark transition-colors mt-5"
                    onClick={() => { try { localStorage.setItem(teamKey('cabinet_notes', teamName), notes) } catch {} setNotesSaved(true); setTimeout(() => setNotesSaved(false), 2500) }}>
                    Сохранить
                  </button>
                </div>
              )}

              {/* ════ APPROBATION ════ */}
              {activeTab === 'approbation' && published && (
                <div className="space-y-5">
                  <div className="bg-white rounded-[2.5rem] p-8">
                    <div className="flex justify-between items-start flex-wrap gap-4 mb-5">
                      <div>
                        <h3 className="text-[1.3rem] font-semibold mb-1">{projectName || 'Мой КОП'}</h3>
                        <p className="text-kv-muted text-sm">{projectBlock} · {authors.join(', ')}</p>
                      </div>
                      <span className={`status-badge ${sc.bg} ${sc.color} flex items-center gap-1.5`}><sc.Icon className="w-4 h-4" />{sc.label}</span>
                    </div>
                    {projectDesc && <p className="text-kv-text text-sm leading-relaxed">{projectDesc}</p>}
                  </div>

                  <div className="bg-white rounded-[2.5rem] p-8">
                    <h3 className="text-[1.3rem] font-semibold mb-1">Добавить результат апробации</h3>
                    <p className="text-kv-muted text-sm mb-6">Заполните после проведения занятия с использованием КОП</p>
                    <div className="mb-5">
                      <button className="btn-ai" onClick={generateAiQuestions}><Cpu className="w-4 h-4" />Сгенерировать вопросы для анкеты</button>
                      {showAiQuestions && aiQuestions.length > 0 && (
                        <div className="mt-4 bg-[#f9fbfe] rounded-2xl p-5 border border-kv-border">
                          <strong className="block mb-3 text-sm">Рекомендуемые вопросы:</strong>
                          <ul className="list-disc pl-5 space-y-1.5 text-sm text-kv-text">
                            {aiQuestions.map((q, i) => <li key={i}>{q}</li>)}
                          </ul>
                          <button className="mt-3 text-sm text-kv-blue cursor-pointer bg-transparent border-none hover:underline"
                            onClick={() => setApprobationForm((f) => ({ ...f, recommendations: aiQuestions.join('\n') }))}>
                            Скопировать в рекомендации
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-5 max-[700px]:grid-cols-1">
                      <div>
                        <label className="block mb-2 font-medium text-[#3f4a6b] text-sm">Учреждение и класс</label>
                        <input className="input-kv" placeholder="ГБОУ Школа №123, 8Б" value={approbationForm.school} onChange={(e) => setApprobationForm((f) => ({ ...f, school: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium text-[#3f4a6b] text-sm">Дата проведения</label>
                        <input className="input-kv" type="date" value={approbationForm.date} onChange={(e) => setApprobationForm((f) => ({ ...f, date: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium text-[#3f4a6b] text-sm">Вовлечённость учеников (1–5)</label>
                        <input className="input-kv" type="number" min="1" max="5" value={approbationForm.engagement} onChange={(e) => setApprobationForm((f) => ({ ...f, engagement: e.target.value }))} />
                      </div>
                      {[{ key: 'whatWorked', label: 'Что прошло хорошо?' }, { key: 'whatNeedsWork', label: 'Что требует доработки?' }, { key: 'recommendations', label: 'Рекомендации автору' }].map(({ key, label }) => (
                        <div key={key} className="col-span-2 max-[700px]:col-span-1">
                          <label className="block mb-2 font-medium text-[#3f4a6b] text-sm">{label}</label>
                          <textarea className="textarea-kv" value={approbationForm[key as keyof typeof approbationForm]} onChange={(e) => setApprobationForm((f) => ({ ...f, [key]: e.target.value }))} />
                        </div>
                      ))}
                    </div>
                    {approbationSaved && <div className="mt-4 bg-[#e8f5e9] px-5 py-3 rounded-2xl text-[#2e7d32] text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />Результаты сохранены</div>}
                    <button className="bg-kv-blue text-white border-none rounded-full px-9 py-3.5 text-base font-medium cursor-pointer hover:bg-kv-dark transition-colors mt-6" onClick={saveApprobation}>
                      Сохранить результаты
                    </button>
                  </div>

                  {approbationHistory.length > 0 && (
                    <div className="bg-white rounded-[2.5rem] p-8">
                      <h3 className="text-[1.3rem] font-semibold mb-5">История апробаций ({approbationHistory.length})</h3>
                      <div className="space-y-3">
                        {approbationHistory.map((rec) => (
                          <details key={rec.id} className="bg-[#f9fbfe] rounded-[1.75rem] px-6 py-4 border border-kv-border">
                            <summary className="font-medium cursor-pointer flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5"><FileText className="w-4 h-4 text-kv-blue" />{rec.school}</div>
                              <span className="text-kv-muted text-sm font-normal flex-shrink-0">{rec.date} · {rec.engagement}/5</span>
                            </summary>
                            <div className="mt-4 pt-4 border-t border-[#e2e8f0] space-y-2 text-sm text-kv-text">
                              <p><strong>Что удалось:</strong> {rec.whatWorked}</p>
                              <p><strong>Требует доработки:</strong> {rec.whatNeedsWork}</p>
                              <p><strong>Рекомендации:</strong> {rec.recommendations}</p>
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Publish CTA bar */}
              {!published && activeTab !== 'overview' && activeTab !== 'approbation' && passportFilled && (
                <div className="bg-kv-light rounded-[2rem] px-7 py-5 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h4 className="font-semibold mb-0.5 text-sm">Готово к отправке куратору?</h4>
                    <p className="text-kv-muted text-xs">Выберите тип отправки</p>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full bg-[#e3f2fd] text-[#1565c0] border-none cursor-pointer hover:bg-[#bbdefb] transition-colors" onClick={handleFeedbackRequest}>
                      <Bell className="w-4 h-4" /> Сообщить куратору
                    </button>
                    <button className="bg-kv-blue text-white border-none rounded-full px-5 py-2.5 text-sm cursor-pointer hover:bg-kv-dark transition-colors flex items-center gap-2" onClick={handlePublish}>
                      <CheckCircle2 className="w-4 h-4" /> Опубликовать КОП
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-kv-light rounded-[2rem] p-7 text-center">
                <h4 className="font-semibold mb-2 text-sm">Каталог КОП</h4>
                <p className="text-kv-muted text-sm mb-4">Посмотрите проекты других команд</p>
                <Link href="/catalog" className="btn-blue inline-flex">Перейти в каталог</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Author modal */}
      {showAuthorModal && (
        <div className="modal-overlay" onClick={() => setShowAuthorModal(false)}>
          <div className="bg-white max-w-[420px] w-[90%] rounded-[2.5rem] p-10 relative" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowAuthorModal(false)}><X size={20} /></button>
            <h3 className="text-[1.8rem] font-semibold mb-6">Добавить участника</h3>
            <input className="input-kv mb-5" placeholder="Имя и фамилия" value={newAuthorInput}
              onChange={(e) => setNewAuthorInput(e.target.value)} autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && newAuthorInput.trim()) { setAuthors((a) => [...a, newAuthorInput.trim()]); setNewAuthorInput(''); setShowAuthorModal(false) } }} />
            <button className="w-full py-3.5 bg-kv-blue text-white rounded-full border-none cursor-pointer font-medium hover:bg-kv-dark transition-colors"
              onClick={() => { if (newAuthorInput.trim()) { setAuthors((a) => [...a, newAuthorInput.trim()]); setNewAuthorInput(''); setShowAuthorModal(false) } }}>
              Добавить
            </button>
          </div>
        </div>
      )}

      {/* Task modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="bg-white max-w-[480px] w-[90%] rounded-[2.5rem] p-10 relative" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowTaskModal(false)}><X size={20} /></button>
            <h3 className="text-[1.8rem] font-semibold mb-6">{editingTask ? 'Редактировать' : 'Новая задача'}</h3>
            <input className="input-kv mb-4" placeholder="Название задачи" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} autoFocus />
            <textarea className="textarea-kv mb-4" placeholder="Описание (необязательно)" rows={3} value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
            <div className="mb-4">
              <label className="block mb-2.5 text-sm font-medium">Приоритет</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((p) => {
                  const cfg = PRIORITY_CFG[p]
                  return (
                    <button key={p} className={`flex-1 py-2.5 rounded-full text-sm font-medium border cursor-pointer transition-all ${taskPriority === p ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-white border-[#e2e8f0] text-kv-muted hover:bg-kv-light'}`}
                      onClick={() => setTaskPriority(p)}>{cfg.label}</button>
                  )
                })}
              </div>
            </div>
            <div className="mb-6">
              <label className="block mb-2.5 text-sm font-medium">Срок выполнения</label>
              <input className="input-kv" type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
            </div>
            <button className="w-full py-3.5 bg-kv-blue text-white rounded-full border-none cursor-pointer font-medium hover:bg-kv-dark transition-colors" onClick={saveTask}>
              Сохранить
            </button>
          </div>
        </div>
      )}

      {/* Publish confirm modal */}
      {showPublishConfirm && (
        <div className="modal-overlay" onClick={() => setShowPublishConfirm(false)}>
          <div className="bg-white max-w-[460px] w-[90%] rounded-[2.5rem] p-10 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-[#e8f5e9] flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-7 h-7 text-[#2e7d32]" />
            </div>
            <h3 className="text-[1.7rem] font-semibold mb-3">Направить КОП куратору?</h3>
            <p className="text-kv-text text-sm leading-relaxed mb-8">
              Вы направите проект <strong>«{projectName || 'без названия'}»</strong> куратору для публикации в каталоге.<br />
              Перед отправкой убедитесь, что все материалы готовы.
            </p>
            <div className="flex gap-3">
              <button className="flex-1 py-3.5 border border-kv-border rounded-full text-kv-text text-sm font-medium cursor-pointer hover:bg-kv-light transition-colors" onClick={() => setShowPublishConfirm(false)}>
                Отмена
              </button>
              <button className="flex-1 py-3.5 bg-kv-blue text-white rounded-full border-none cursor-pointer text-sm font-medium hover:bg-kv-dark transition-colors" onClick={confirmPublish}>
                Направить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback sent notification */}
      {showFeedbackSent && (
        <div className="modal-overlay" onClick={() => setShowFeedbackSent(false)}>
          <div className="bg-white max-w-[420px] w-[90%] rounded-[2.5rem] p-10 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-[#e3f2fd] flex items-center justify-center mx-auto mb-5">
              <Bell className="w-7 h-7 text-[#1565c0]" />
            </div>
            <h3 className="text-[1.7rem] font-semibold mb-3">Куратор уведомлён</h3>
            <p className="text-kv-muted mb-6">Куратор получил запрос на обратную связь и скоро просмотрит ваш проект.</p>
            <button className="w-full py-3.5 bg-kv-blue text-white rounded-full border-none cursor-pointer font-medium hover:bg-kv-dark transition-colors"
              onClick={() => { setShowFeedbackSent(false); setActiveTab('overview') }}>
              Понятно
            </button>
          </div>
        </div>
      )}

      {/* Published notification */}
      {showNotification && (
        <div className="modal-overlay" onClick={() => setShowNotification(false)}>
          <div className="bg-white max-w-[420px] w-[90%] rounded-[2.5rem] p-10 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-[#e8f5e9] flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-7 h-7 text-[#2e7d32]" />
            </div>
            <h3 className="text-[1.7rem] font-semibold mb-3">КОП направлен!</h3>
            <p className="text-kv-muted mb-6">Куратор получил проект на рассмотрение. Следите за статусом во вкладке «Обзор».</p>
            <button className="w-full py-3.5 bg-kv-blue text-white rounded-full border-none cursor-pointer font-medium hover:bg-kv-dark transition-colors"
              onClick={() => { setShowNotification(false); setActiveTab('overview') }}>
              К обзору
            </button>
          </div>
        </div>
      )}
    </>
  )
}

'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, UserPlus, Paperclip, Plus, Edit2, Trash2,
  Circle, Clock, CheckCircle2, Upload, File, FileText,
  Cpu, ArrowLeft, CheckCircle, XCircle,
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

type Task = { id: string; title: string; desc: string; status: 'planned' | 'inprogress' | 'done' }
type FileItem = { name: string; icon: string }
type ApprobationRecord = {
  id: number; school: string; date: string; engagement: string;
  whatWorked: string; whatNeedsWork: string; recommendations: string;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c))

const AI_QUESTIONS: Record<string, string[]> = {
  математика: ['Удалось ли организовать обсуждение решений?', 'Насколько задания связаны с реальной жизнью?', 'Какие трудности возникли?'],
  биология: ['Насколько школьники были увлечены наблюдением?', 'Удобно ли проводить эксперимент?', 'Что добавить для лучшего понимания?'],
  физика: ['Насколько наглядно представлены явления?', 'Были ли трудности при опыте?', 'Оценка безопасности?'],
  информатика: ['Понятны ли инструкции?', 'Какие алгоритмические задачи решили?', 'Что упростить?'],
  экономика: ['Насколько игра отражает реальные процессы?', 'Было ли интересно?', 'Какие дополнения?'],
  педагогика: ['Насколько игровая форма помогла?', 'Удалось ли удержать внимание?', 'Что улучшить в методике?'],
}

export default function CabinetPage() {
  const router = useRouter()

  // Auth state
  const [loggedIn, setLoggedIn] = useState(false)
  const [userType, setUserType] = useState<'student' | 'curator'>('student')
  const [captainName, setCaptainName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [track, setTrack] = useState<'А1' | 'А2'>('А1')
  const [curatorLogin, setCuratorLogin] = useState('')
  const [curatorPassword, setCuratorPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // Project state
  const [projectName, setProjectName] = useState('')
  const [projectBlock, setProjectBlock] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [authors, setAuthors] = useState<string[]>([])
  const [newAuthorInput, setNewAuthorInput] = useState('')
  const [showAuthorModal, setShowAuthorModal] = useState(false)
  const [productionFile, setProductionFile] = useState('')

  // Tasks
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Выбрать тему проекта', desc: '', status: 'planned' },
    { id: '2', title: 'Подготовить макет', desc: '', status: 'inprogress' },
    { id: '3', title: 'Написать инструкцию', desc: '', status: 'done' },
  ])
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')

  // Files
  const [files, setFiles] = useState<FileItem[]>([
    { name: 'Макет.dxf', icon: 'File' },
    { name: 'Инструкция.pdf', icon: 'FileText' },
    { name: 'Код.ino', icon: 'File' },
  ])

  // Publication
  const [published, setPublished] = useState(false)
  const [projectStatus, setProjectStatus] = useState<'review' | 'approved' | 'rejected'>('review')
  const [showNotification, setShowNotification] = useState(false)

  // Approbation
  const [approbationHistory, setApprobationHistory] = useState<ApprobationRecord[]>([])
  const [approbationForm, setApprobationForm] = useState({
    school: '', date: '', engagement: '', whatWorked: '', whatNeedsWork: '', recommendations: '',
  })
  const [aiQuestions, setAiQuestions] = useState<string[]>([])
  const [showAiQuestions, setShowAiQuestions] = useState(false)
  const [approbationSaved, setApprobationSaved] = useState(false)

  const projectId = useRef<string>('')

  useEffect(() => {
    try {
      const savedPublished = localStorage.getItem('projectPublished') === 'true'
      const savedStatus = (localStorage.getItem('projectStatus') as 'review' | 'approved' | 'rejected') || 'review'
      const savedProjId = localStorage.getItem('currentProjectId') || ''
      projectId.current = savedProjId
      if (savedPublished) {
        setPublished(true)
        setProjectStatus(savedStatus)
        const history = JSON.parse(localStorage.getItem(`approbationHistory_${savedProjId}`) || '[]')
        setApprobationHistory(history)
      }
    } catch {}
  }, [])

  const handleLogin = () => {
    setLoginError('')
    if (userType === 'student') {
      if (!captainName.trim() || !teamName.trim()) {
        setLoginError('Заполните все поля')
        return
      }
      const id = Date.now().toString()
      projectId.current = id
      try {
        localStorage.setItem('currentProjectId', id)
        localStorage.setItem('projectPublished', 'false')
        localStorage.removeItem('projectStatus')
      } catch {}
      setAuthors([captainName.trim()])
      setLoggedIn(true)
    } else {
      // Demo credentials only — not for production use
      if (curatorLogin === 'curator' && curatorPassword === 'curator123') {
        try { localStorage.setItem('curatorLoggedIn', 'true') } catch {}
        router.push('/curator')
      } else {
        setLoginError('Неверный логин или пароль')
      }
    }
  }

  const handlePublish = () => {
    const id = projectId.current || Date.now().toString()
    projectId.current = id
    try {
      localStorage.setItem('projectPublished', 'true')
      localStorage.setItem('projectStatus', 'review')
      localStorage.setItem('currentProjectId', id)
    } catch {}
    setPublished(true)
    setProjectStatus('review')
    setShowNotification(true)
  }

  const saveApprobation = () => {
    if (!approbationForm.school.trim()) { alert('Укажите название школы'); return }
    const record: ApprobationRecord = { id: Date.now(), ...approbationForm }
    const newHistory = [...approbationHistory, record]
    setApprobationHistory(newHistory)
    try {
      localStorage.setItem(`approbationHistory_${projectId.current}`, JSON.stringify(newHistory))
    } catch {}
    setApprobationForm({ school: '', date: '', engagement: '', whatWorked: '', whatNeedsWork: '', recommendations: '' })
    setApprobationSaved(true)
    setTimeout(() => setApprobationSaved(false), 3000)
  }

  const openTask = (task?: Task) => {
    if (task) {
      setEditingTask(task)
      setTaskTitle(task.title)
      setTaskDesc(task.desc)
    } else {
      setEditingTask(null)
      setTaskTitle('')
      setTaskDesc('')
    }
    setShowTaskModal(true)
  }

  const saveTask = () => {
    if (!taskTitle.trim()) return
    if (editingTask) {
      setTasks((prev) => prev.map((t) => t.id === editingTask.id ? { ...t, title: taskTitle, desc: taskDesc } : t))
    } else {
      setTasks((prev) => [...prev, { id: Date.now().toString(), title: taskTitle, desc: taskDesc, status: 'planned' }])
    }
    setShowTaskModal(false)
  }

  const deleteTask = (id: string) => {
    if (confirm('Удалить задачу?')) setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const onDrop = (status: Task['status']) => {
    if (!draggedId) return
    setTasks((prev) => prev.map((t) => t.id === draggedId ? { ...t, status } : t))
    setDraggedId(null)
  }

  const generateAiQuestions = () => {
    const subject = prompt('Укажите предмет (математика, биология, физика, информатика, экономика, педагогика):', 'математика')?.toLowerCase() || 'математика'
    const questions = AI_QUESTIONS[subject] ?? AI_QUESTIONS.математика
    setAiQuestions(questions)
    setShowAiQuestions(true)
  }

  const columns: { status: Task['status']; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { status: 'planned', label: 'Запланировано', Icon: Circle },
    { status: 'inprogress', label: 'В работе', Icon: Clock },
    { status: 'done', label: 'Готово', Icon: CheckCircle2 },
  ]

  const statusBadgeClass = {
    review: 'bg-[#fff3e0] text-[#ef6c00]',
    approved: 'bg-[#c8e6c9] text-[#2e7d32]',
    rejected: 'bg-[#ffebee] text-[#c62828]',
  }
  const statusLabel = { review: 'На рассмотрении', approved: 'Одобрено', rejected: 'Отклонено' }

  return (
    <>
      <Header active="cabinet" />
      <main>
        <div className="container-kv">
          {/* Login card */}
          {!loggedIn && (
            <div className="bg-white rounded-[3rem] px-[50px] py-[60px] max-w-[550px] mx-auto my-16 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-2 mb-6">
                <Link href="/" className="flex items-center gap-2 text-kv-blue font-medium no-underline">
                  <ArrowLeft className="w-4 h-4" /> На главную
                </Link>
              </div>
              <h2 className="text-[2.4rem] font-medium mb-4">Вход в личный кабинет</h2>
              <p className="text-kv-text text-lg mb-10">Выберите тип пользователя</p>

              <div className="flex gap-5 mb-8 justify-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="userType" checked={userType === 'student'} onChange={() => setUserType('student')} />
                  Студент
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="userType" checked={userType === 'curator'} onChange={() => setUserType('curator')} />
                  Куратор
                </label>
              </div>

              {userType === 'student' ? (
                <>
                  <div className="flex gap-4 mb-10">
                    {(['А1', 'А2'] as const).map((t) => (
                      <button
                        key={t}
                        className={`flex-1 py-4 rounded-full border font-medium text-lg cursor-pointer transition-colors ${track === t ? 'bg-kv-blue text-white border-kv-blue' : 'bg-white border-[#e2e8f0]'}`}
                        onClick={() => setTrack(t)}
                      >
                        {t} · {t === 'А1' ? 'Семестр' : 'Интенсив'}
                      </button>
                    ))}
                  </div>
                  <div className="mb-6">
                    <label className="block mb-2 font-medium text-[#3f4a6b]">Имя и фамилия капитана</label>
                    <input className="input-kv" placeholder="Иванов Иван" value={captainName} onChange={(e) => setCaptainName(e.target.value)} />
                  </div>
                  <div className="mb-6">
                    <label className="block mb-2 font-medium text-[#3f4a6b]">Название команды</label>
                    <input className="input-kv" placeholder="Команда №1" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="block mb-2 font-medium text-[#3f4a6b]">Логин</label>
                    <input className="input-kv" placeholder="Логин" value={curatorLogin} onChange={(e) => setCuratorLogin(e.target.value)} />
                  </div>
                  <div className="mb-6">
                    <label className="block mb-2 font-medium text-[#3f4a6b]">Пароль</label>
                    <input className="input-kv" type="password" placeholder="Пароль" value={curatorPassword} onChange={(e) => setCuratorPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                  </div>
                </>
              )}

              {loginError && <p className="text-[#c62828] text-center mb-4">{loginError}</p>}
              <button
                className="w-full py-4 bg-kv-dark text-white rounded-full text-lg font-medium cursor-pointer hover:bg-kv-blue transition-colors border-none mt-4"
                onClick={handleLogin}
              >
                Войти
              </button>
            </div>
          )}

          {/* Cabinet content */}
          {loggedIn && (
            <div className="py-10">
              {/* Welcome */}
              <div className="bg-white rounded-[3rem] p-10 mb-10">
                <h2 className="text-3xl font-medium mb-2">Здравствуйте, {captainName}!</h2>
                <p className="text-kv-text">Команда: <strong>{teamName}</strong> · Формат: <strong>{track}</strong></p>
              </div>

              {!published ? (
                <>
                  {/* Passport / project form */}
                  <div className="bg-white rounded-[3rem] p-10 mb-10">
                    <h3 className="text-[2rem] font-medium mb-1">Паспорт проекта</h3>
                    <p className="text-kv-muted mb-8">Основной документ вашего коробочного образовательного комплекта</p>
                    <div className="grid grid-cols-2 gap-8 max-[700px]:grid-cols-1">
                      <div>
                        <label className="block mb-2.5 font-medium text-[#3f4a6b]">Название КОП</label>
                        <input className="input-kv" placeholder="Геометрический конструктор" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                      </div>
                      <div>
                        <label className="block mb-2.5 font-medium text-[#3f4a6b]">Предметная область</label>
                        <input className="input-kv" placeholder="Математика, 7–8 класс" value={projectBlock} onChange={(e) => setProjectBlock(e.target.value)} />
                      </div>
                      <div className="col-span-2 max-[700px]:col-span-1">
                        <label className="block mb-2.5 font-medium text-[#3f4a6b]">Описание КОП</label>
                        <textarea className="textarea-kv" placeholder="Цель, целевая аудитория, особенности продукта и методические задачи" value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} />
                      </div>
                    </div>

                    {/* Authors */}
                    <div className="mt-8">
                      <label className="block mb-4 font-medium">Авторы</label>
                      <div className="flex flex-wrap gap-3 mb-4">
                        {authors.map((a, i) => (
                          <span key={i} className="bg-kv-light px-5 py-2.5 rounded-full flex items-center gap-2">
                            <User className="w-4 h-4" /> {a}{i === 0 ? ' (капитан)' : ''}
                          </span>
                        ))}
                      </div>
                      <button
                        className="bg-transparent border border-dashed border-[#9aa9c0] rounded-full px-6 py-2.5 text-base cursor-pointer flex items-center gap-2 hover:border-kv-blue transition-colors"
                        onClick={() => setShowAuthorModal(true)}
                      >
                        <UserPlus className="w-4 h-4" /> Добавить участника
                      </button>
                    </div>

                    {/* Production file */}
                    <div className="bg-kv-light rounded-[2.5rem] p-8 mt-8 flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h4 className="font-medium mb-1">Производственный файл</h4>
                        <p className="text-kv-muted text-sm">DXF / SVG для лазера · STL для 3D-печати · PDF для методики</p>
                      </div>
                      <button
                        className="bg-white border border-kv-blue text-kv-blue px-7 py-3 rounded-full cursor-pointer flex items-center gap-2 hover:bg-kv-light transition-colors"
                        onClick={() => { const f = prompt('Введите имя файла (например, product.dxf):'); if (f) setProductionFile(f) }}
                      >
                        <Paperclip className="w-4 h-4" /> Прикрепить файл
                      </button>
                    </div>
                    {productionFile && (
                      <p className="mt-3 flex items-center gap-2 text-kv-blue"><Paperclip className="w-4 h-4" /> {productionFile}</p>
                    )}
                  </div>

                  {/* Kanban */}
                  <div className="bg-white rounded-[3rem] p-10 mb-10">
                    <div className="flex justify-between items-center mb-10">
                      <h3 className="text-[2rem] font-medium">Трекер задач</h3>
                      <button className="btn-blue" onClick={() => openTask()}>
                        <Plus className="w-4 h-4" /> Добавить задачу
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-6 max-[700px]:grid-cols-1">
                      {columns.map(({ status, label, Icon }) => (
                        <div
                          key={status}
                          className="bg-[#f9fbfe] rounded-[2.25rem] p-6 min-h-[400px]"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => onDrop(status)}
                        >
                          <h4 className="flex items-center gap-2.5 mb-6 text-kv-blue font-medium">
                            <Icon className="w-5 h-5" /> {label}
                          </h4>
                          <div className="min-h-[300px]">
                            {tasks.filter((t) => t.status === status).map((task) => (
                              <div
                                key={task.id}
                                className="bg-white rounded-3xl p-5 mb-4 border border-kv-border cursor-grab active:cursor-grabbing select-none"
                                draggable
                                onDragStart={() => setDraggedId(task.id)}
                                onDragEnd={() => setDraggedId(null)}
                              >
                                <p className="font-semibold text-[1.05rem] mb-2">{task.title}</p>
                                {task.desc && <p className="text-kv-text text-sm">{task.desc}</p>}
                                <div className="flex justify-end gap-3 mt-3">
                                  <button className="bg-transparent border-none cursor-pointer text-[#8b9bb5] hover:text-kv-blue transition-colors" onClick={() => openTask(task)}>
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button className="bg-transparent border-none cursor-pointer text-[#8b9bb5] hover:text-red-400 transition-colors" onClick={() => deleteTask(task.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Files */}
                  <div className="bg-white rounded-[3rem] p-10 mb-10">
                    <div className="flex justify-between items-center mb-10">
                      <h3 className="text-[2rem] font-medium">Рабочие файлы</h3>
                      <button
                        className="btn-blue"
                        onClick={() => { const f = prompt('Введите название файла:'); if (f) setFiles((prev) => [...prev, { name: f, icon: 'File' }]) }}
                      >
                        <Upload className="w-4 h-4" /> Загрузить файл
                      </button>
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
                      {files.map((f, i) => (
                        <div
                          key={i}
                          className="bg-[#f9fbfe] rounded-[1.75rem] py-6 px-5 text-center border border-kv-border cursor-pointer hover:bg-kv-light hover:-translate-y-0.5 transition-all"
                          onClick={() => alert(`Скачивание ${f.name} (демо)`)}
                        >
                          {f.icon === 'FileText' ? <FileText className="w-9 h-9 text-kv-blue mx-auto mb-4" /> : <File className="w-9 h-9 text-kv-blue mx-auto mb-4" />}
                          <span className="text-sm">{f.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Publish */}
                  <div className="bg-kv-light rounded-[3.75rem] px-10 py-[50px] mb-10 flex items-center justify-between flex-wrap gap-6">
                    <div>
                      <h3 className="text-[1.8rem] font-medium mb-1">Опубликовать КОП в каталог</h3>
                      <p className="text-kv-muted">Проект отправится куратору на проверку — после одобрения появится в общем каталоге</p>
                    </div>
                    <button className="bg-kv-blue text-white border-none rounded-full px-10 py-4 text-lg cursor-pointer hover:bg-kv-dark transition-colors" onClick={handlePublish}>
                      Опубликовать
                    </button>
                  </div>
                </>
              ) : (
                // Published mode
                <div className="bg-white rounded-[3rem] p-10 mb-10">
                  <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                    <h3 className="text-[2rem] font-medium">Мой опубликованный комплект</h3>
                    <span className={`status-badge ${statusBadgeClass[projectStatus]}`}>
                      {projectStatus === 'approved' ? <CheckCircle className="w-4 h-4" /> : projectStatus === 'rejected' ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      {statusLabel[projectStatus]}
                    </span>
                  </div>
                  <div className="bg-[#f9fbfe] rounded-[2.25rem] p-8 mb-6 border border-kv-border">
                    <h3 className="text-[1.8rem] font-medium mb-4">{projectName || 'Без названия'}</h3>
                    <div className="flex gap-5 text-kv-muted mb-4 text-sm">
                      <span>📅 {projectBlock}</span>
                      <span>{authors.join(', ')}</span>
                    </div>
                    <p className="text-kv-text">{projectDesc}</p>
                    {productionFile && <p className="mt-3"><strong>Файл:</strong> {productionFile}</p>}
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    <button className="btn-ai"
                      onClick={() => document.getElementById('approbation-section')?.scrollIntoView({ behavior: 'smooth' })}>
                      <Cpu className="w-4 h-4" /> Апробация
                    </button>
                    <button className="btn-blue" onClick={() => setPublished(false)}>
                      <Edit2 className="w-4 h-4" /> Редактировать
                    </button>
                  </div>
                </div>
              )}

              {/* Approbation requests */}
              <div className="bg-white rounded-[3rem] p-10 mb-10">
                <h3 className="text-[2rem] font-medium mb-6">Заявки на апробацию вашего КОП</h3>
                <p className="text-kv-muted">Пока нет заявок.</p>
              </div>

              {/* Approbation section */}
              {published && (
                <div className="bg-white rounded-[3rem] p-10 mb-10" id="approbation-section">
                  <h3 className="text-[2rem] font-medium mb-8">Апробация комплекта в школе</h3>

                  {/* AI questions */}
                  <div className="mb-6">
                    <button className="btn-ai" onClick={generateAiQuestions}>
                      <Cpu className="w-4 h-4" /> Сгенерировать вопросы для анкеты
                    </button>
                    {showAiQuestions && aiQuestions.length > 0 && (
                      <div className="mt-4 bg-[#f9fbfe] rounded-3xl p-4">
                        <strong className="block mb-2">Рекомендуемые вопросы:</strong>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-kv-text">
                          {aiQuestions.map((q, i) => <li key={i}>{q}</li>)}
                        </ul>
                        <button
                          className="mt-3 text-sm text-kv-blue cursor-pointer bg-transparent border-none hover:underline"
                          onClick={() => setApprobationForm((f) => ({ ...f, recommendations: aiQuestions.join('\n') }))}
                        >
                          Скопировать в рекомендации
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Approbation form */}
                  <div className="grid grid-cols-2 gap-6 max-[700px]:grid-cols-1">
                    <div>
                      <label className="block mb-2 font-medium text-[#3f4a6b]">Название школы / класс</label>
                      <input className="input-kv" value={approbationForm.school} onChange={(e) => setApprobationForm((f) => ({ ...f, school: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block mb-2 font-medium text-[#3f4a6b]">Дата апробации</label>
                      <input className="input-kv" type="date" value={approbationForm.date} onChange={(e) => setApprobationForm((f) => ({ ...f, date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block mb-2 font-medium text-[#3f4a6b]">Вовлечённость (1–5)</label>
                      <input className="input-kv" type="number" min="1" max="5" value={approbationForm.engagement} onChange={(e) => setApprobationForm((f) => ({ ...f, engagement: e.target.value }))} />
                    </div>
                    <div className="col-span-2 max-[700px]:col-span-1">
                      <label className="block mb-2 font-medium text-[#3f4a6b]">Что было самым удачным?</label>
                      <textarea className="textarea-kv" value={approbationForm.whatWorked} onChange={(e) => setApprobationForm((f) => ({ ...f, whatWorked: e.target.value }))} />
                    </div>
                    <div className="col-span-2 max-[700px]:col-span-1">
                      <label className="block mb-2 font-medium text-[#3f4a6b]">Что требует доработки?</label>
                      <textarea className="textarea-kv" value={approbationForm.whatNeedsWork} onChange={(e) => setApprobationForm((f) => ({ ...f, whatNeedsWork: e.target.value }))} />
                    </div>
                    <div className="col-span-2 max-[700px]:col-span-1">
                      <label className="block mb-2 font-medium text-[#3f4a6b]">Рекомендации автору</label>
                      <textarea className="textarea-kv" value={approbationForm.recommendations} onChange={(e) => setApprobationForm((f) => ({ ...f, recommendations: e.target.value }))} />
                    </div>
                  </div>

                  {approbationSaved && (
                    <div className="mt-4 bg-[#e8f5e9] px-4 py-3 rounded-3xl text-[#2e7d32]">✅ Спасибо! Результаты сохранены.</div>
                  )}

                  <button className="bg-kv-blue text-white border-none rounded-full px-10 py-4 text-base font-medium cursor-pointer hover:bg-kv-dark transition-colors mt-6" onClick={saveApprobation}>
                    Сохранить результаты
                  </button>

                  {/* History */}
                  {approbationHistory.length > 0 && (
                    <div className="mt-10">
                      <h4 className="text-xl font-medium mb-4">История апробации</h4>
                      <div className="space-y-3">
                        {approbationHistory.map((rec) => (
                          <details key={rec.id} className="bg-[#f9fbfe] rounded-[2rem] px-6 py-4 border border-kv-border">
                            <summary className="font-medium cursor-pointer flex items-center gap-3">
                              <FileText className="w-4 h-4 text-kv-blue" /> {rec.school} — {rec.date}
                            </summary>
                            <div className="mt-4 pt-4 border-t border-[#e2e8f0] space-y-2 text-sm text-kv-text">
                              <p><strong>Вовлечённость:</strong> {rec.engagement}/5</p>
                              <p><strong>Что удалось:</strong> {rec.whatWorked}</p>
                              <p><strong>Что требует доработки:</strong> {rec.whatNeedsWork}</p>
                              <p><strong>Рекомендации:</strong> {rec.recommendations}</p>
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Catalog link */}
              <div className="bg-kv-light rounded-[3rem] p-10 mb-10 text-center">
                <h3 className="text-[1.8rem] font-medium mb-4">Каталог коробочных образовательных комплектов</h3>
                <p className="text-kv-muted mb-6">Посмотрите готовые работы других команд</p>
                <Link href="/catalog" className="btn-blue inline-flex">
                  Перейти в каталог
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Add author modal */}
      {showAuthorModal && (
        <div className="modal-overlay" onClick={() => setShowAuthorModal(false)}>
          <div className="bg-white max-w-[450px] w-[90%] rounded-[2.5rem] p-10 relative" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[1.8rem] font-medium mb-6">Добавить участника</h3>
            <input
              className="input-kv mb-5"
              placeholder="Имя и фамилия"
              value={newAuthorInput}
              onChange={(e) => setNewAuthorInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && newAuthorInput.trim()) { setAuthors((a) => [...a, newAuthorInput.trim()]); setNewAuthorInput(''); setShowAuthorModal(false) } }}
              autoFocus
            />
            <button
              className="w-full py-3.5 bg-kv-blue text-white rounded-full border-none cursor-pointer text-base font-medium hover:bg-kv-dark transition-colors"
              onClick={() => { if (newAuthorInput.trim()) { setAuthors((a) => [...a, newAuthorInput.trim()]); setNewAuthorInput(''); setShowAuthorModal(false) } }}
            >
              Добавить
            </button>
          </div>
        </div>
      )}

      {/* Task modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="bg-white max-w-[450px] w-[90%] rounded-[2.5rem] p-10 relative" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[1.8rem] font-medium mb-6">{editingTask ? 'Редактировать задачу' : 'Новая задача'}</h3>
            <input className="input-kv mb-4" placeholder="Название задачи" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} autoFocus />
            <textarea className="textarea-kv mb-5" placeholder="Описание" rows={3} value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
            <button
              className="w-full py-3.5 bg-kv-blue text-white rounded-full border-none cursor-pointer text-base font-medium hover:bg-kv-dark transition-colors"
              onClick={saveTask}
            >
              Сохранить
            </button>
          </div>
        </div>
      )}

      {/* Notification modal */}
      {showNotification && (
        <div className="modal-overlay" onClick={() => setShowNotification(false)}>
          <div className="bg-white max-w-[450px] w-[90%] rounded-[2.5rem] p-10 text-center" onClick={(e) => e.stopPropagation()}>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-[1.8rem] font-medium mb-3">Отправлено!</h3>
            <p className="text-kv-muted mb-6">Проект отправлен куратору на проверку</p>
            <button
              className="w-full py-3.5 bg-kv-blue text-white rounded-full border-none cursor-pointer text-base font-medium hover:bg-kv-dark transition-colors"
              onClick={() => setShowNotification(false)}
            >
              Хорошо
            </button>
          </div>
        </div>
      )}
    </>
  )
}

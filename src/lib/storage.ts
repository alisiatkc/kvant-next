export type SubmittedProject = {
  id: string
  teamCode: string
  projectName: string
  projectBlock: string
  projectDesc: string
  teamName: string
  captain: string
  track: string
  authors: string[]
  productionFile: string
  files: Array<{ name: string; icon: string; size?: string }>
  status: 'feedback_requested' | 'review' | 'approved' | 'rejected'
  submittedAt: string
  feedbackRequestedAt?: string
  curatorLogin: string
  curatorFeedback?: string
  workspaceSnapshot?: {
    tasks: Array<{ id: string; title: string; desc: string; status: string; priority: string; dueDate: string }>
    notes: string
    sprints?: Array<{ id: string; name: string; goal: string; startDate: string; endDate: string; status: string; retroNotes: string; createdAt: string }>
  }
}

export type AuthUser = {
  role: 'student' | 'curator'
  login: string
  teamCode?: string
  track?: 'А1' | 'А2' | 'А3'
  curatorLogin?: string
  name?: string
  id?: string
}

export type ResearchStage = 'T0' | 'T1' | 'T2' | 'T3'

export type ResearchAnswers = {
  processClarity: number
  selfOrganization: number
  teamwork: number
  communication: number
  materialsAccess: number
  usefulness: number
  usability: number
  projectResult: number
}

export type ResearchMeasurementInput = {
  participantCode: string
  stage: ResearchStage
  previousPractice?: boolean
  consentConfirmed: boolean
  answers: ResearchAnswers
}

export type ResearchMeasurement = {
  id: string
  teamCode: string
  participantId: string
  stage: ResearchStage
  previousPractice: boolean | null
  consentConfirmed: boolean
  instrumentVersion: string
  answers: ResearchAnswers
  createdAt: string
}

export type CommunityProject = {
  id: string
  teamCode: string
  teamName: string
  projectName: string
  projectBlock: string
  publicSummary: string
  track: string
  status: SubmittedProject['status']
  submittedAt: string
  progressPercent: number
  progressStage: string
  cohort: string
  isArchive: boolean
  openToQuestions: boolean
}

export type PeerReviewScores = {
  problemClarity: number
  resultQuality: number
  applicability: number
  presentation: number
}

export type PeerReviewInput = {
  projectId: string
  scores: PeerReviewScores
  comment: string
}

export type PeerReview = PeerReviewInput & {
  id: string
  projectTeamCode: string
  reviewerTeamCode: string
  reviewerTeamName: string
  createdAt: string
}

export type CommunityMessageInput = {
  projectId: string
  text: string
}

export type CommunityMessage = CommunityMessageInput & {
  id: string
  authorTeamCode: string
  authorTeamName: string
  createdAt: string
}

export type CatalogEntry = {
  id: number
  title: string
  excerpt: string
  fullDesc: string
  subject: string
  authors: string[]
  files: Array<{ name: string; icon: string; size: string }>
  image: string
  tech: string[]
  contact: string
  likes: number
}

export type TeamWorkspace = {
  teamName: string
  captainName: string
  track: string
  authors: string[]
  practiceStart: string
  practiceEnd: string
  projectName: string
  projectBlock: string
  projectDesc: string
  productionFile: string
  tasks: Array<{
    id: string
    title: string
    desc: string
    status: 'planned' | 'inprogress' | 'testing' | 'done'
    priority: 'low' | 'medium' | 'high'
    dueDate: string
    createdAt: string
    blocked: boolean
    blockedReason?: string
  }>
  files: Array<{ name: string; icon: string; size?: string }>
  sprints: Array<{
    id: string
    name: string
    goal: string
    startDate: string
    endDate: string
    status: 'planned' | 'active' | 'completed'
    retroNotes: string
    createdAt: string
  }>
  notes: string
  approbationHistory: Array<{
    id: number
    school: string
    date: string
    engagement: string
    whatWorked: string
    whatNeedsWork: string
    recommendations: string
  }>
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
const SESSION_TOKEN_KEY = 'kvant_session_token'
const SESSION_USER_KEY = 'kvant_session_user'

const DEMO_USERS: Array<AuthUser & { password: string }> = [
  { role: 'student', login: 'demo-team', password: 'demo', teamCode: 'demo-team', track: 'А1', curatorLogin: 'demo-curator' },
  { role: 'curator', login: 'demo-curator', password: 'demo', name: 'Демонстрационный куратор', id: 'demo-curator' },
]

function saveSession(token: string, user: AuthUser) {
  localStorage.setItem(SESSION_TOKEN_KEY, token)
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(SESSION_TOKEN_KEY)
  localStorage.removeItem(SESSION_USER_KEY)
}

async function apiCall(
  action: string,
  method: 'GET' | 'POST',
  body?: object,
  query?: Record<string, string>,
): Promise<Record<string, unknown>> {
  const params = new URLSearchParams({ action, ...query })
  const token = typeof window !== 'undefined' ? localStorage.getItem(SESSION_TOKEN_KEY) : null
  const res = await fetch(`${API_URL}?${params.toString()}`, {
    method,
    headers: {
      ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({})) as Record<string, unknown>
  if (!res.ok) {
    if (res.status === 401) clearSession()
    throw new Error(typeof data.error === 'string' ? data.error : `API ${action} failed: ${res.status}`)
  }
  return data
}

export async function loginUser(role: AuthUser['role'], login: string, password: string): Promise<AuthUser> {
  if (API_URL) {
    let data
    try {
      data = await apiCall('login', 'POST', { role, login, password })
    } catch (error) {
      if (error instanceof Error && error.message === 'invalid credentials') {
        throw new Error('Неверный логин или пароль')
      }
      if (error instanceof Error && error.message === 'authentication is not configured') {
        throw new Error('Сервер авторизации ещё не настроен')
      }
      throw error
    }
    if (typeof data.token !== 'string' || !data.user) throw new Error('Некорректный ответ сервера')
    const user = data.user as AuthUser
    saveSession(data.token, user)
    return user
  }
  if (!DEMO_MODE) throw new Error('Сервер авторизации ещё не подключён')
  const user = DEMO_USERS.find((item) => item.role === role && item.login === login && item.password === password)
  if (!user) throw new Error('Неверный логин или пароль')
  const { password: _password, ...identity } = user
  saveSession('demo-session', identity)
  return identity
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const saved = localStorage.getItem(SESSION_USER_KEY)
  if (!saved) return null
  if (!API_URL) {
    if (!DEMO_MODE) return null
    try { return JSON.parse(saved) as AuthUser } catch { clearSession(); return null }
  }
  try {
    const data = await apiCall('me', 'GET')
    const user = data.user as AuthUser
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user))
    return user
  } catch {
    clearSession()
    return null
  }
}

function workspaceStorageKey(teamCode: string): string {
  return `teamWorkspace_${teamCode.replace(/\s+/g, '_')}`
}

export async function getTeamWorkspace(teamCode: string): Promise<TeamWorkspace | null> {
  if (API_URL) {
    const data = await apiCall('getWorkspace', 'GET', undefined, { teamCode })
    return (data.workspace as TeamWorkspace | null) ?? null
  }
  return JSON.parse(localStorage.getItem(workspaceStorageKey(teamCode)) || 'null')
}

export async function saveTeamWorkspace(teamCode: string, workspace: TeamWorkspace): Promise<void> {
  if (API_URL) {
    await apiCall('saveWorkspace', 'POST', { teamCode, workspace })
    return
  }
  localStorage.setItem(workspaceStorageKey(teamCode), JSON.stringify(workspace))
}

export async function submitProject(project: SubmittedProject): Promise<void> {
  if (API_URL) {
    await apiCall('submit', 'POST', { project })
    return
  }
  const existing: SubmittedProject[] = JSON.parse(
    localStorage.getItem('submittedProjects') || '[]',
  )
  localStorage.setItem(
    'submittedProjects',
    JSON.stringify([...existing.filter((p) => p.id !== project.id), project]),
  )
}

export async function getSubmittedProjects(): Promise<SubmittedProject[]> {
  if (API_URL) {
    const data = await apiCall('getProjects', 'GET')
    return (data.projects as SubmittedProject[]) ?? []
  }
  return JSON.parse(localStorage.getItem('submittedProjects') || '[]')
}

export async function updateProjectStatus(
  id: string,
  status: SubmittedProject['status'],
  catalogEntry?: CatalogEntry,
  curatorFeedback?: string,
  newCuratorLogin?: string,
): Promise<void> {
  if (API_URL) {
    await apiCall('updateStatus', 'POST', { id, status, catalogEntry, curatorFeedback, curatorLogin: newCuratorLogin })
    return
  }
  const subs: SubmittedProject[] = JSON.parse(
    localStorage.getItem('submittedProjects') || '[]',
  )
  localStorage.setItem(
    'submittedProjects',
    JSON.stringify(
      subs.map((p) =>
        p.id === id
          ? { ...p, status,
              ...(curatorFeedback   !== undefined ? { curatorFeedback }              : {}),
              ...(newCuratorLogin   !== undefined ? { curatorLogin: newCuratorLogin } : {}),
            }
          : p,
      ),
    ),
  )
  const numId = parseInt(id.slice(-7)) + 10000
  const existing: CatalogEntry[] = JSON.parse(
    localStorage.getItem('approvedCatalogProjects') || '[]',
  )
  if (status === 'approved' && catalogEntry) {
    localStorage.setItem(
      'approvedCatalogProjects',
      JSON.stringify([...existing.filter((p) => p.id !== numId), catalogEntry]),
    )
  } else {
    localStorage.setItem(
      'approvedCatalogProjects',
      JSON.stringify(existing.filter((p) => p.id !== numId)),
    )
  }
}

export async function getApprovedCatalog(): Promise<CatalogEntry[]> {
  if (API_URL) {
    const data = await apiCall('getCatalog', 'GET')
    return (data.projects as CatalogEntry[]) ?? []
  }
  return JSON.parse(localStorage.getItem('approvedCatalogProjects') || '[]')
}

export async function updateCatalogEntry(entry: CatalogEntry): Promise<void> {
  if (API_URL) {
    await apiCall('updateCatalog', 'POST', { entry })
    return
  }
  const existing: CatalogEntry[] = JSON.parse(localStorage.getItem('approvedCatalogProjects') || '[]')
  localStorage.setItem('approvedCatalogProjects', JSON.stringify([
    ...existing.filter((e) => e.id !== entry.id),
    entry,
  ]))
}

export async function deleteCatalogEntry(id: number): Promise<void> {
  if (API_URL) {
    await apiCall('deleteCatalog', 'POST', { id })
    return
  }
  const existing: CatalogEntry[] = JSON.parse(localStorage.getItem('approvedCatalogProjects') || '[]')
  localStorage.setItem('approvedCatalogProjects', JSON.stringify(existing.filter((e) => e.id !== id)))
}

export async function submitResearchMeasurement(measurement: ResearchMeasurementInput): Promise<{ participantId: string; savedAt: string }> {
  if (API_URL) {
    const data = await apiCall('submitMeasurement', 'POST', { measurement })
    return { participantId: data.participantId as string, savedAt: data.savedAt as string }
  }
  if (!DEMO_MODE) throw new Error('Сервер исследования ещё не подключён')
  const user = await getCurrentUser()
  if (!user?.teamCode) throw new Error('Требуется вход команды')
  const participantId = measurement.participantCode.trim().toUpperCase()
  const record: ResearchMeasurement = {
    id: `${user.teamCode}:${participantId}:${measurement.stage}`,
    teamCode: user.teamCode,
    participantId,
    stage: measurement.stage,
    previousPractice: measurement.stage === 'T0' ? measurement.previousPractice ?? false : null,
    consentConfirmed: true,
    instrumentVersion: '1.0-demo',
    answers: measurement.answers,
    createdAt: new Date().toISOString(),
  }
  const existing: ResearchMeasurement[] = JSON.parse(localStorage.getItem('researchMeasurements') || '[]')
  localStorage.setItem('researchMeasurements', JSON.stringify([
    ...existing.filter((item) => item.id !== record.id),
    record,
  ]))
  return { participantId, savedAt: record.createdAt }
}

export async function getResearchMeasurements(): Promise<ResearchMeasurement[]> {
  if (API_URL) {
    const data = await apiCall('getMeasurements', 'GET')
    return (data.measurements as ResearchMeasurement[]) ?? []
  }
  if (!DEMO_MODE) return []
  return JSON.parse(localStorage.getItem('researchMeasurements') || '[]')
}

const DEMO_COMMUNITY_PROJECTS: CommunityProject[] = [
  {
    id: 'demo-project-lab',
    teamCode: 'demo-lab',
    teamName: 'Команда «Лаборатория идей»',
    projectName: 'Набор для исследования качества воды',
    projectBlock: 'Исследовательский проект',
    publicSummary: 'Команда проверяет сценарий учебного исследования и собирает обратную связь о понятности этапов.',
    track: 'А1',
    status: 'review',
    submittedAt: '2026-09-20T10:00:00.000Z',
    progressPercent: 68,
    progressStage: 'Апробация прототипа',
    cohort: '2026/27',
    isArchive: false,
    openToQuestions: true,
  },
  {
    id: 'demo-project-dialog',
    teamCode: 'demo-dialog',
    teamName: 'Команда «Диалог»',
    projectName: 'Карточки для групповой рефлексии',
    projectBlock: 'Методический проект',
    publicSummary: 'Завершённый проект прошлого потока. Команда готова рассказать, как организовала апробацию и переработала материалы после обратной связи.',
    track: 'А2',
    status: 'approved',
    submittedAt: '2025-05-25T12:00:00.000Z',
    progressPercent: 100,
    progressStage: 'Завершён и передан в архив',
    cohort: '2025/26',
    isArchive: true,
    openToQuestions: true,
  },
]

const DEMO_PEER_REVIEWS: PeerReview[] = [
  {
    id: 'demo-project-lab:demo-experts',
    projectId: 'demo-project-lab',
    projectTeamCode: 'demo-lab',
    reviewerTeamCode: 'demo-experts',
    reviewerTeamName: 'Команда «Эксперты»',
    scores: { problemClarity: 4, resultQuality: 4, applicability: 5, presentation: 4 },
    comment: 'Понятна проблема и предполагаемый результат. Советуем заранее сформулировать критерии наблюдения и показать логику апробации.',
    createdAt: '2026-09-23T09:30:00.000Z',
  },
]

const DEMO_COMMUNITY_MESSAGES: CommunityMessage[] = [
  {
    id: 'demo-project-dialog:question-1',
    projectId: 'demo-project-dialog',
    authorTeamCode: 'demo-start',
    authorTeamName: 'Команда «Старт»',
    text: 'Как вы определяли, какие вопросы оставить в итоговой версии после первой апробации?',
    createdAt: '2026-09-24T10:00:00.000Z',
  },
  {
    id: 'demo-project-dialog:reply-1',
    projectId: 'demo-project-dialog',
    authorTeamCode: 'demo-dialog',
    authorTeamName: 'Команда «Диалог»',
    text: 'Мы оставили вопросы, которые помогали участникам назвать конкретное действие команды, а слишком общие формулировки убрали после наблюдения.',
    createdAt: '2026-09-24T14:20:00.000Z',
  },
]

function progressOf(project: SubmittedProject): { percent: number; stage: string } {
  const tasks = project.workspaceSnapshot?.tasks || []
  if (tasks.length > 0) {
    const done = tasks.filter((task) => task.status === 'done').length
    const percent = Math.round((done / tasks.length) * 100)
    if (percent >= 100) return { percent: 100, stage: 'Результат подготовлен' }
    if (percent >= 70) return { percent, stage: 'Апробация и доработка' }
    if (percent >= 35) return { percent, stage: 'Разработка прототипа' }
    return { percent, stage: 'Проектирование решения' }
  }
  if (project.status === 'approved') return { percent: 100, stage: 'Завершён и опубликован' }
  if (project.status === 'review') return { percent: 75, stage: 'Экспертная проверка' }
  return { percent: 50, stage: 'Разработка решения' }
}

function normalizeCommunityProject(project: SubmittedProject): CommunityProject {
  const progress = progressOf(project)
  return {
    id: project.id,
    teamCode: project.teamCode,
    teamName: project.teamName || project.teamCode,
    projectName: project.projectName || 'Проект без названия',
    projectBlock: project.projectBlock || 'Проект',
    publicSummary: `Команда работает над проектом направления «${project.projectBlock || 'проектная деятельность'}». Подробные материалы и исходные файлы не опубликованы.`,
    track: project.track || '—',
    status: project.status,
    submittedAt: project.submittedAt,
    progressPercent: progress.percent,
    progressStage: progress.stage,
    cohort: '2026/27',
    isArchive: false,
    openToQuestions: true,
  }
}

export async function getCommunityProjects(): Promise<CommunityProject[]> {
  if (API_URL) {
    const data = await apiCall('getCommunityProjects', 'GET')
    return (data.projects as CommunityProject[]) ?? []
  }
  if (!DEMO_MODE) return []
  const submitted: SubmittedProject[] = JSON.parse(localStorage.getItem('submittedProjects') || '[]')
  const combined = [...submitted.map(normalizeCommunityProject), ...DEMO_COMMUNITY_PROJECTS]
  return [...new Map(combined.map((project) => [project.id, project])).values()]
}

export async function getPeerReviews(projectId?: string): Promise<PeerReview[]> {
  if (API_URL) {
    const data = await apiCall('getPeerReviews', 'GET', undefined, projectId ? { projectId } : undefined)
    return (data.reviews as PeerReview[]) ?? []
  }
  if (!DEMO_MODE) return []
  const saved: PeerReview[] = JSON.parse(localStorage.getItem('peerReviews') || '[]')
  const combined = [...saved, ...DEMO_PEER_REVIEWS.filter((seed) => !saved.some((item) => item.id === seed.id))]
  return projectId ? combined.filter((review) => review.projectId === projectId) : combined
}

export async function savePeerReview(input: PeerReviewInput): Promise<PeerReview> {
  if (API_URL) {
    const data = await apiCall('submitPeerReview', 'POST', { review: input })
    return data.review as PeerReview
  }
  if (!DEMO_MODE) throw new Error('Сервер взаимооценивания ещё не подключён')
  const user = await getCurrentUser()
  if (!user?.teamCode || user.role !== 'student') throw new Error('Требуется вход команды')
  const projects = await getCommunityProjects()
  const project = projects.find((item) => item.id === input.projectId)
  if (!project) throw new Error('Проект не найден')
  if (project.isArchive) throw new Error('Завершённым командам задают вопросы вместо выставления рейтинга')
  if (project.teamCode === user.teamCode) throw new Error('Нельзя оценивать проект своей команды')
  const values = Object.values(input.scores)
  if (values.length !== 4 || values.some((value) => !Number.isInteger(value) || value < 1 || value > 5)) {
    throw new Error('Поставьте оценку от 1 до 5 по каждому критерию')
  }
  const comment = input.comment.trim()
  if (comment.length < 20 || comment.length > 1200) {
    throw new Error('Комментарий должен содержать от 20 до 1200 символов')
  }
  const review: PeerReview = {
    id: `${project.id}:${user.teamCode}`,
    projectId: project.id,
    projectTeamCode: project.teamCode,
    reviewerTeamCode: user.teamCode,
    reviewerTeamName: localStorage.getItem('cabinet_teamName') || user.teamCode,
    scores: input.scores,
    comment,
    createdAt: new Date().toISOString(),
  }
  const existing: PeerReview[] = JSON.parse(localStorage.getItem('peerReviews') || '[]')
  localStorage.setItem('peerReviews', JSON.stringify([
    ...existing.filter((item) => item.id !== review.id),
    review,
  ]))
  return review
}

export async function getCommunityMessages(projectId?: string): Promise<CommunityMessage[]> {
  if (API_URL) {
    const data = await apiCall('getCommunityMessages', 'GET', undefined, projectId ? { projectId } : undefined)
    return (data.messages as CommunityMessage[]) ?? []
  }
  if (!DEMO_MODE) return []
  const saved: CommunityMessage[] = JSON.parse(localStorage.getItem('communityMessages') || '[]')
  const combined = [...saved, ...DEMO_COMMUNITY_MESSAGES.filter((seed) => !saved.some((item) => item.id === seed.id))]
  return projectId ? combined.filter((message) => message.projectId === projectId) : combined
}

export async function saveCommunityMessage(input: CommunityMessageInput): Promise<CommunityMessage> {
  if (API_URL) {
    const data = await apiCall('submitCommunityMessage', 'POST', { message: input })
    return data.message as CommunityMessage
  }
  if (!DEMO_MODE) throw new Error('Сервер проектного сообщества ещё не подключён')
  const user = await getCurrentUser()
  if (!user?.teamCode || user.role !== 'student') throw new Error('Требуется вход команды')
  const projects = await getCommunityProjects()
  const project = projects.find((item) => item.id === input.projectId)
  if (!project) throw new Error('Проект не найден')
  if (!project.openToQuestions) throw new Error('Команда не открыла обсуждение проекта')
  const text = input.text.trim()
  if (text.length < 10 || text.length > 800) {
    throw new Error('Сообщение должно содержать от 10 до 800 символов')
  }
  const message: CommunityMessage = {
    id: `${project.id}:${user.teamCode}:${Date.now()}`,
    projectId: project.id,
    authorTeamCode: user.teamCode,
    authorTeamName: localStorage.getItem('cabinet_teamName') || user.teamCode,
    text,
    createdAt: new Date().toISOString(),
  }
  const existing: CommunityMessage[] = JSON.parse(localStorage.getItem('communityMessages') || '[]')
  localStorage.setItem('communityMessages', JSON.stringify([...existing, message]))
  return message
}

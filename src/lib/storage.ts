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

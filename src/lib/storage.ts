export type SubmittedProject = {
  id: string
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
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

async function apiCall(
  action: string,
  method: 'GET' | 'POST',
  body?: object,
  query?: Record<string, string>,
): Promise<Record<string, unknown>> {
  const params = new URLSearchParams({ action, ...query })
  const res = await fetch(`${API_URL}?${params.toString()}`, {
    method,
    headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`API ${action} failed: ${res.status}`)
  return res.json()
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

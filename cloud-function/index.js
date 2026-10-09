'use strict'

// Yandex Cloud Function: kvant-api
// Handles CRUD operations via YDB Document API (DynamoDB-compatible).
//
// Required environment variables (set in Cloud Function settings):
//   YDB_ENDPOINT   — Document API endpoint from YDB database details
//   YDB_ACCESS_KEY_ID      — Static access key ID
//   YDB_SECRET_ACCESS_KEY  — Static access key secret
//   YDB_REGION     — Default: ru-central1
//   SESSION_SECRET — Random secret of at least 32 characters for signing sessions
//   AUTH_ACCOUNTS_JSON — JSON array of server-side accounts with scrypt hashes

const crypto = require('node:crypto')
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  GetCommand,
  DeleteCommand,
} = require('@aws-sdk/lib-dynamodb')

const client = new DynamoDBClient({
  endpoint: process.env.YDB_ENDPOINT,
  region:   process.env.YDB_REGION || 'ru-central1',
  credentials: {
    accessKeyId:     process.env.YDB_ACCESS_KEY_ID,
    secretAccessKey: process.env.YDB_SECRET_ACCESS_KEY,
  },
})

const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
})

const CORS = {
  'Access-Control-Allow-Origin':  process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const CATALOG_TABLE = 'approved_catalog'
const WORKSPACE_TABLE = 'team_workspaces'
const RESEARCH_TABLE = 'research_measurements'
const PEER_REVIEW_TABLE = 'peer_reviews'
const COMMUNITY_MESSAGE_TABLE = 'community_messages'
const MAX_WORKSPACE_BYTES = 350000
const MAX_PROJECT_BYTES = 200000
const SESSION_TTL_SECONDS = 12 * 60 * 60
const RESEARCH_STAGES = new Set(['T0', 'T1', 'T2', 'T3'])
const RESEARCH_INSTRUMENT_VERSION = '1.0'
const RESEARCH_FIELDS = [
  'processClarity',
  'selfOrganization',
  'teamwork',
  'communication',
  'materialsAccess',
  'usefulness',
  'usability',
  'projectResult',
]
const CATALOG_SUBJECTS = new Set([
  'math',
  'bio',
  'physics',
  'it',
  'economics',
  'pedagogy',
])

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

// Converts a string timestamp ID to a stable numeric catalog ID (> 10000)
function numericId(sid) {
  return parseInt(sid.slice(-7)) + 10000
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function validateCatalogEntry(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return 'entry required'
  }
  if (!Number.isSafeInteger(entry.id) || entry.id <= 0) {
    return 'entry.id must be a positive integer'
  }
  if (!isNonEmptyString(entry.title)) {
    return 'entry.title required'
  }
  if (!isNonEmptyString(entry.subject) || !CATALOG_SUBJECTS.has(entry.subject)) {
    return 'entry.subject is invalid'
  }
  if (!Array.isArray(entry.authors) || !Array.isArray(entry.files) || !Array.isArray(entry.tech)) {
    return 'entry.authors, entry.files and entry.tech must be arrays'
  }
  return null
}

function validateTeamCode(teamCode) {
  return typeof teamCode === 'string' && /^[a-zA-Z0-9_-]{3,64}$/.test(teamCode)
}

function validateResearchMeasurement(measurement) {
  if (!measurement || typeof measurement !== 'object' || Array.isArray(measurement)) {
    return 'measurement required'
  }
  if (typeof measurement.participantCode !== 'string' || !/^[a-zA-Z0-9_-]{3,32}$/.test(measurement.participantCode.trim())) {
    return 'participantCode is invalid'
  }
  if (!RESEARCH_STAGES.has(measurement.stage)) return 'stage is invalid'
  if (measurement.consentConfirmed !== true) return 'participant consent required'
  if (!measurement.answers || typeof measurement.answers !== 'object' || Array.isArray(measurement.answers)) {
    return 'answers required'
  }
  if (RESEARCH_FIELDS.some((field) => !Number.isInteger(measurement.answers[field]) || measurement.answers[field] < 1 || measurement.answers[field] > 5)) {
    return 'all answers must be integers from 1 to 5'
  }
  if (measurement.stage === 'T0' && typeof measurement.previousPractice !== 'boolean') {
    return 'previousPractice required for T0'
  }
  return null
}

const PEER_REVIEW_FIELDS = [
  'problemClarity',
  'resultQuality',
  'applicability',
  'presentation',
]

function validatePeerReview(review) {
  if (!review || typeof review !== 'object' || Array.isArray(review)) {
    return 'review required'
  }
  if (!isNonEmptyString(review.projectId) || review.projectId.length > 128) {
    return 'projectId is invalid'
  }
  if (!review.scores || typeof review.scores !== 'object' || Array.isArray(review.scores)) {
    return 'scores required'
  }
  if (PEER_REVIEW_FIELDS.some((field) => !Number.isInteger(review.scores[field]) || review.scores[field] < 1 || review.scores[field] > 5)) {
    return 'all peer review scores must be integers from 1 to 5'
  }
  if (!isNonEmptyString(review.comment) || review.comment.trim().length < 20 || review.comment.trim().length > 1200) {
    return 'comment must contain from 20 to 1200 characters'
  }
  return null
}

function projectProgress(project) {
  const tasks = project.workspaceSnapshot && Array.isArray(project.workspaceSnapshot.tasks)
    ? project.workspaceSnapshot.tasks
    : []
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

function communityProject(project) {
  const progress = projectProgress(project)
  return {
    id: project.id,
    teamCode: project.teamCode,
    teamName: project.teamName || project.teamCode,
    projectName: project.projectName || 'Проект без названия',
    projectBlock: project.projectBlock || 'Проект',
    publicSummary: isNonEmptyString(project.communitySummary)
      ? project.communitySummary.trim().slice(0, 500)
      : `Команда работает над проектом направления «${project.projectBlock || 'проектная деятельность'}». Подробные материалы и исходные файлы не опубликованы.`,
    track: project.track || '—',
    status: project.status,
    submittedAt: project.submittedAt,
    progressPercent: progress.percent,
    progressStage: progress.stage,
    cohort: isNonEmptyString(project.communityCohort) ? project.communityCohort : '2026/27',
    isArchive: project.communityArchive === true,
    openToQuestions: project.openToQuestions !== false,
  }
}

function validateCommunityMessage(message) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) return 'message required'
  if (!isNonEmptyString(message.projectId) || message.projectId.length > 128) return 'projectId is invalid'
  if (!isNonEmptyString(message.text) || message.text.trim().length < 10 || message.text.trim().length > 800) {
    return 'message text must contain from 10 to 800 characters'
  }
  return null
}

function loadAccounts() {
  try {
    const accounts = JSON.parse(process.env.AUTH_ACCOUNTS_JSON || '[]')
    return Array.isArray(accounts) ? accounts : []
  } catch (_) {
    console.error('[kvant-api] AUTH_ACCOUNTS_JSON is invalid')
    return []
  }
}

function verifyPassword(password, encodedHash) {
  if (typeof password !== 'string' || typeof encodedHash !== 'string') return false
  const [algorithm, salt, expectedHex] = encodedHash.split('$')
  if (algorithm !== 'scrypt' || !salt || !/^[a-f0-9]{64}$/i.test(expectedHex || '')) return false
  const actual = crypto.scryptSync(password, salt, 32)
  const expected = Buffer.from(expectedHex, 'hex')
  return expected.length === actual.length && crypto.timingSafeEqual(actual, expected)
}

function encodePart(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function signSession(account) {
  const secret = process.env.SESSION_SECRET || ''
  if (secret.length < 32) throw new Error('authentication is not configured')
  const payload = {
    sub: account.login,
    role: account.role,
    teamCode: account.role === 'student' ? account.login : undefined,
    track: account.track,
    curatorLogin: account.curatorLogin,
    name: account.name,
    id: account.id,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
  const encoded = encodePart(payload)
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

function readSession(event) {
  const secret = process.env.SESSION_SECRET || ''
  if (secret.length < 32) return null
  const headers = event.headers || {}
  const authorization = headers.Authorization || headers.authorization || ''
  const match = /^Bearer\s+(.+)$/i.exec(authorization)
  if (!match) return null
  const [encoded, signature] = match[1].split('.')
  if (!encoded || !signature) return null
  const expected = crypto.createHmac('sha256', secret).update(encoded).digest()
  let actual
  try { actual = Buffer.from(signature, 'base64url') } catch (_) { return null }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null
    if (!['student', 'curator'].includes(payload.role) || !isNonEmptyString(payload.sub)) return null
    return payload
  } catch (_) {
    return null
  }
}

function publicIdentity(session) {
  return {
    role: session.role,
    login: session.sub,
    ...(session.teamCode ? { teamCode: session.teamCode } : {}),
    ...(session.track ? { track: session.track } : {}),
    ...(session.curatorLogin ? { curatorLogin: session.curatorLogin } : {}),
    ...(session.name ? { name: session.name } : {}),
    ...(session.id ? { id: session.id } : {}),
  }
}

function requireRole(event, role) {
  const session = readSession(event)
  if (!session || session.role !== role) return null
  return session
}

module.exports.handler = async function (event) {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' }
  }

  const qs     = event.queryStringParameters || {}
  const action = qs.action

  let body = {}
  try {
    if (event.body) body = JSON.parse(event.body)
  } catch (_) {}

  try {
    // ── POST ?action=login  (server verifies credentials) ───────────────────
    if (action === 'login' && event.httpMethod === 'POST') {
      const { role, login, password } = body
      if (!['student', 'curator'].includes(role) || !isNonEmptyString(login) || !isNonEmptyString(password)) {
        return respond(400, { error: 'role, login and password required' })
      }
      const account = loadAccounts().find((item) => item.role === role && item.login.toLowerCase() === login.trim().toLowerCase())
      if (!account || !verifyPassword(password, account.passwordHash)) {
        return respond(401, { error: 'invalid credentials' })
      }
      const token = signSession(account)
      const session = readSession({ headers: { Authorization: `Bearer ${token}` } })
      return respond(200, { token, user: publicIdentity(session) })
    }

    // ── GET ?action=me  (checks an existing session) ───────────────────────
    if (action === 'me' && event.httpMethod === 'GET') {
      const session = readSession(event)
      if (!session) return respond(401, { error: 'unauthorized' })
      return respond(200, { user: publicIdentity(session) })
    }

    // ── POST ?action=submit  (student publishes project) ──────────────────────
    if (action === 'submit' && event.httpMethod === 'POST') {
      const session = requireRole(event, 'student')
      if (!session) return respond(401, { error: 'student session required' })
      const { project } = body
      if (!project || !project.id) return respond(400, { error: 'project.id required' })
      if (project.teamCode !== session.teamCode) return respond(403, { error: 'project belongs to another team' })
      if (!['feedback_requested', 'review'].includes(project.status)) {
        return respond(400, { error: 'student project status is invalid' })
      }

      const existing = await ddb.send(new GetCommand({
        TableName: 'submitted_projects',
        Key: { id: project.id },
      }))
      if (existing.Item) {
        try {
          const existingProject = JSON.parse(existing.Item.data)
          if (existingProject.teamCode && existingProject.teamCode !== session.teamCode) {
            return respond(403, { error: 'project id belongs to another team' })
          }
        } catch (_) {
          return respond(409, { error: 'existing project data is invalid' })
        }
      }

      const storedProject = {
        ...project,
        teamCode: session.teamCode,
        curatorLogin: session.curatorLogin || '',
      }
      if (Buffer.byteLength(JSON.stringify(storedProject), 'utf8') > MAX_PROJECT_BYTES) {
        return respond(413, { error: 'project is too large' })
      }

      await ddb.send(new PutCommand({
        TableName: 'submitted_projects',
        Item: { id: project.id, data: JSON.stringify(storedProject) },
      }))
      return respond(200, { ok: true })
    }

    // ── GET ?action=getProjects  (curator loads all submissions) ─────────────
    if (action === 'getProjects' && event.httpMethod === 'GET') {
      if (!requireRole(event, 'curator')) return respond(401, { error: 'curator session required' })
      const result = await ddb.send(new ScanCommand({ TableName: 'submitted_projects' }))
      const projects = (result.Items || []).map((item) => JSON.parse(item.data))
      return respond(200, { projects })
    }

    // ── POST ?action=updateStatus  (curator approves / rejects / leaves feedback) ──
    if (action === 'updateStatus' && event.httpMethod === 'POST') {
      if (!requireRole(event, 'curator')) return respond(401, { error: 'curator session required' })
      const { id, status, catalogEntry, curatorFeedback } = body
      if (!id || !status) return respond(400, { error: 'id and status required' })

      // Update status (and optional feedback) in submitted_projects
      const found = await ddb.send(new GetCommand({
        TableName: 'submitted_projects',
        Key: { id },
      }))
      const { curatorLogin: newCuratorLogin } = body
      if (found.Item) {
        const project = JSON.parse(found.Item.data)
        project.status = status
        if (curatorFeedback !== undefined && curatorFeedback !== null) {
          project.curatorFeedback = curatorFeedback
        }
        if (newCuratorLogin !== undefined) {
          project.curatorLogin = newCuratorLogin
        }
        await ddb.send(new PutCommand({
          TableName: 'submitted_projects',
          Item: { id, data: JSON.stringify(project) },
        }))
      }

      // Sync approved_catalog
      const catId = numericId(id)
      if (status === 'approved' && catalogEntry) {
        await ddb.send(new PutCommand({
          TableName: CATALOG_TABLE,
          Item: { id: catId, data: JSON.stringify({ ...catalogEntry, id: catId }) },
        }))
      } else {
        // Remove from catalog on reject / return-to-review (ignore if not present)
        try {
          await ddb.send(new DeleteCommand({
            TableName: CATALOG_TABLE,
            Key: { id: catId },
          }))
        } catch (_) {}
      }

      return respond(200, { ok: true })
    }

    // ── GET ?action=getCatalog  (catalog page fetches approved projects) ─────
    if (action === 'getCatalog' && event.httpMethod === 'GET') {
      const result = await ddb.send(new ScanCommand({ TableName: CATALOG_TABLE }))
      const projects = (result.Items || [])
        .map((item) => {
          try {
            return JSON.parse(item.data)
          } catch (_) {
            console.warn('[kvant-api] Invalid approved_catalog item', item.id)
            return null
          }
        })
        .filter(Boolean)
      return respond(200, { projects })
    }

    // ── GET ?action=getWorkspace&teamCode=...  (team loads workspace) ───────
    if (action === 'getWorkspace' && event.httpMethod === 'GET') {
      const session = requireRole(event, 'student')
      if (!session) return respond(401, { error: 'student session required' })
      const { teamCode } = qs
      if (!validateTeamCode(teamCode)) {
        return respond(400, { error: 'valid teamCode required' })
      }
      if (teamCode !== session.teamCode) return respond(403, { error: 'workspace belongs to another team' })

      const result = await ddb.send(new GetCommand({
        TableName: WORKSPACE_TABLE,
        Key: { id: teamCode },
      }))
      if (!result.Item) return respond(200, { workspace: null })

      try {
        return respond(200, {
          workspace: JSON.parse(result.Item.data),
          updatedAt: result.Item.updatedAt || null,
        })
      } catch (_) {
        console.warn('[kvant-api] Invalid team workspace', teamCode)
        return respond(500, { error: 'workspace data is invalid' })
      }
    }

    // ── POST ?action=saveWorkspace  (team saves current workspace) ─────────
    if (action === 'saveWorkspace' && event.httpMethod === 'POST') {
      const session = requireRole(event, 'student')
      if (!session) return respond(401, { error: 'student session required' })
      const { teamCode, workspace } = body
      if (!validateTeamCode(teamCode)) {
        return respond(400, { error: 'valid teamCode required' })
      }
      if (teamCode !== session.teamCode) return respond(403, { error: 'workspace belongs to another team' })
      if (!workspace || typeof workspace !== 'object' || Array.isArray(workspace)) {
        return respond(400, { error: 'workspace required' })
      }

      const data = JSON.stringify(workspace)
      if (Buffer.byteLength(data, 'utf8') > MAX_WORKSPACE_BYTES) {
        return respond(413, { error: 'workspace is too large' })
      }

      const updatedAt = new Date().toISOString()
      await ddb.send(new PutCommand({
        TableName: WORKSPACE_TABLE,
        Item: { id: teamCode, data, updatedAt },
      }))
      return respond(200, { ok: true, updatedAt })
    }

    // ── POST ?action=submitMeasurement  (anonymous repeated measurement) ───
    if (action === 'submitMeasurement' && event.httpMethod === 'POST') {
      const session = requireRole(event, 'student')
      if (!session) return respond(401, { error: 'student session required' })
      const { measurement } = body
      const validationError = validateResearchMeasurement(measurement)
      if (validationError) return respond(400, { error: validationError })

      const normalizedCode = measurement.participantCode.trim().toUpperCase()
      const participantId = crypto
        .createHmac('sha256', process.env.SESSION_SECRET)
        .update(`${session.teamCode}:${normalizedCode}`)
        .digest('hex')
        .slice(0, 16)
      const createdAt = new Date().toISOString()
      const record = {
        id: `${session.teamCode}:${participantId}:${measurement.stage}`,
        teamCode: session.teamCode,
        participantId,
        stage: measurement.stage,
        previousPractice: measurement.stage === 'T0' ? measurement.previousPractice : null,
        consentConfirmed: true,
        instrumentVersion: RESEARCH_INSTRUMENT_VERSION,
        answers: Object.fromEntries(RESEARCH_FIELDS.map((field) => [field, measurement.answers[field]])),
        createdAt,
      }

      await ddb.send(new PutCommand({
        TableName: RESEARCH_TABLE,
        Item: { id: record.id, data: JSON.stringify(record), createdAt },
      }))
      return respond(200, { ok: true, participantId, stage: record.stage, savedAt: createdAt })
    }

    // ── GET ?action=getMeasurements  (curator research export) ─────────────
    if (action === 'getMeasurements' && event.httpMethod === 'GET') {
      if (!requireRole(event, 'curator')) return respond(401, { error: 'curator session required' })
      const result = await ddb.send(new ScanCommand({ TableName: RESEARCH_TABLE }))
      const measurements = (result.Items || [])
        .map((item) => {
          try { return JSON.parse(item.data) }
          catch (_) {
            console.warn('[kvant-api] Invalid research measurement', item.id)
            return null
          }
        })
        .filter(Boolean)
      return respond(200, { measurements })
    }

    // ── GET ?action=getCommunityProjects  (authenticated project exchange) ──
    if (action === 'getCommunityProjects' && event.httpMethod === 'GET') {
      const session = readSession(event)
      if (!session) return respond(401, { error: 'authenticated session required' })
      const result = await ddb.send(new ScanCommand({ TableName: 'submitted_projects' }))
      const projects = (result.Items || [])
        .map((item) => {
          try { return JSON.parse(item.data) }
          catch (_) {
            console.warn('[kvant-api] Invalid submitted project', item.id)
            return null
          }
        })
        .filter((project) => project && project.status !== 'rejected')
        .map(communityProject)
      return respond(200, { projects })
    }

    // ── GET ?action=getPeerReviews[&projectId=...]  (student/curator) ───────
    if (action === 'getPeerReviews' && event.httpMethod === 'GET') {
      const session = readSession(event)
      if (!session) return respond(401, { error: 'authenticated session required' })
      const result = await ddb.send(new ScanCommand({ TableName: PEER_REVIEW_TABLE }))
      const reviews = (result.Items || [])
        .map((item) => {
          try { return JSON.parse(item.data) }
          catch (_) {
            console.warn('[kvant-api] Invalid peer review', item.id)
            return null
          }
        })
        .filter((review) => review && (!qs.projectId || review.projectId === qs.projectId))
      return respond(200, { reviews })
    }

    // ── POST ?action=submitPeerReview  (one review per team and project) ────
    if (action === 'submitPeerReview' && event.httpMethod === 'POST') {
      const session = requireRole(event, 'student')
      if (!session) return respond(401, { error: 'student session required' })
      const { review } = body
      const validationError = validatePeerReview(review)
      if (validationError) return respond(400, { error: validationError })

      const projectResult = await ddb.send(new GetCommand({
        TableName: 'submitted_projects',
        Key: { id: review.projectId },
      }))
      if (!projectResult.Item) return respond(404, { error: 'project not found' })

      let project
      try { project = JSON.parse(projectResult.Item.data) }
      catch (_) { return respond(500, { error: 'stored project is invalid' }) }
      if (project.teamCode === session.teamCode) {
        return respond(403, { error: 'a team cannot review its own project' })
      }
      if (project.status === 'rejected') {
        return respond(409, { error: 'project is not open for peer review' })
      }

      const createdAt = new Date().toISOString()
      const storedReview = {
        id: `${review.projectId}:${session.teamCode}`,
        projectId: review.projectId,
        projectTeamCode: project.teamCode,
        reviewerTeamCode: session.teamCode,
        reviewerTeamName: session.teamCode,
        scores: Object.fromEntries(PEER_REVIEW_FIELDS.map((field) => [field, review.scores[field]])),
        comment: review.comment.trim(),
        createdAt,
      }
      await ddb.send(new PutCommand({
        TableName: PEER_REVIEW_TABLE,
        Item: { id: storedReview.id, data: JSON.stringify(storedReview), createdAt },
      }))
      return respond(200, { ok: true, review: storedReview })
    }

    // ── GET ?action=getCommunityMessages[&projectId=...] ──────────────────
    if (action === 'getCommunityMessages' && event.httpMethod === 'GET') {
      const session = readSession(event)
      if (!session) return respond(401, { error: 'authenticated session required' })
      const result = await ddb.send(new ScanCommand({ TableName: COMMUNITY_MESSAGE_TABLE }))
      const messages = (result.Items || [])
        .map((item) => {
          try { return JSON.parse(item.data) }
          catch (_) {
            console.warn('[kvant-api] Invalid community message', item.id)
            return null
          }
        })
        .filter((message) => message && (!qs.projectId || message.projectId === qs.projectId))
      return respond(200, { messages })
    }

    // ── POST ?action=submitCommunityMessage  (cross-cohort discussion) ──────
    if (action === 'submitCommunityMessage' && event.httpMethod === 'POST') {
      const session = requireRole(event, 'student')
      if (!session) return respond(401, { error: 'student session required' })
      const { message } = body
      const validationError = validateCommunityMessage(message)
      if (validationError) return respond(400, { error: validationError })

      const projectResult = await ddb.send(new GetCommand({
        TableName: 'submitted_projects',
        Key: { id: message.projectId },
      }))
      if (!projectResult.Item) return respond(404, { error: 'project not found' })

      let project
      try { project = JSON.parse(projectResult.Item.data) }
      catch (_) { return respond(500, { error: 'stored project is invalid' }) }
      if (project.openToQuestions === false) {
        return respond(403, { error: 'project discussion is closed' })
      }

      const createdAt = new Date().toISOString()
      const storedMessage = {
        id: `${message.projectId}:${session.teamCode}:${Date.now()}`,
        projectId: message.projectId,
        authorTeamCode: session.teamCode,
        authorTeamName: session.teamCode,
        text: message.text.trim(),
        createdAt,
      }
      await ddb.send(new PutCommand({
        TableName: COMMUNITY_MESSAGE_TABLE,
        Item: { id: storedMessage.id, data: JSON.stringify(storedMessage), createdAt },
      }))
      return respond(200, { ok: true, message: storedMessage })
    }

    // ── POST ?action=updateCatalog  (curator creates / edits catalog entry) ─
    if (action === 'updateCatalog' && event.httpMethod === 'POST') {
      if (!requireRole(event, 'curator')) return respond(401, { error: 'curator session required' })
      const { entry } = body
      const validationError = validateCatalogEntry(entry)
      if (validationError) return respond(400, { error: validationError })

      const normalizedEntry = {
        ...entry,
        title: entry.title.trim(),
        excerpt: typeof entry.excerpt === 'string' ? entry.excerpt.trim() : '',
        fullDesc: typeof entry.fullDesc === 'string' ? entry.fullDesc.trim() : '',
        authors: entry.authors.filter(isNonEmptyString).map((value) => value.trim()),
        tech: entry.tech.filter(isNonEmptyString).map((value) => value.trim()),
        likes: Number.isFinite(entry.likes) ? Math.max(0, entry.likes) : 0,
      }

      await ddb.send(new PutCommand({
        TableName: CATALOG_TABLE,
        Item: { id: normalizedEntry.id, data: JSON.stringify(normalizedEntry) },
      }))
      return respond(200, { ok: true, entry: normalizedEntry })
    }

    // ── POST ?action=deleteCatalog  (curator removes catalog entry) ─────────
    if (action === 'deleteCatalog' && event.httpMethod === 'POST') {
      if (!requireRole(event, 'curator')) return respond(401, { error: 'curator session required' })
      const { id } = body
      if (!Number.isSafeInteger(id) || id <= 0) {
        return respond(400, { error: 'id must be a positive integer' })
      }

      await ddb.send(new DeleteCommand({
        TableName: CATALOG_TABLE,
        Key: { id },
      }))
      return respond(200, { ok: true })
    }

    return respond(404, { error: `Unknown action: ${action}` })
  } catch (e) {
    console.error('[kvant-api]', e)
    return respond(500, { error: e.message })
  }
}

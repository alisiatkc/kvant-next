'use strict'

// Yandex Cloud Function: kvant-api
// Handles CRUD operations via YDB Document API (DynamoDB-compatible).
//
// Required environment variables (set in Cloud Function settings):
//   YDB_ENDPOINT   — Document API endpoint from YDB database details
//   YDB_ACCESS_KEY_ID      — Static access key ID
//   YDB_SECRET_ACCESS_KEY  — Static access key secret
//   YDB_REGION     — Default: ru-central1

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
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const CATALOG_TABLE = 'approved_catalog'
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
    // ── POST ?action=submit  (student publishes project) ──────────────────────
    if (action === 'submit' && event.httpMethod === 'POST') {
      const { project } = body
      if (!project || !project.id) return respond(400, { error: 'project.id required' })

      await ddb.send(new PutCommand({
        TableName: 'submitted_projects',
        Item: { id: project.id, data: JSON.stringify(project) },
      }))
      return respond(200, { ok: true })
    }

    // ── GET ?action=getProjects  (curator loads all submissions) ─────────────
    if (action === 'getProjects' && event.httpMethod === 'GET') {
      const result = await ddb.send(new ScanCommand({ TableName: 'submitted_projects' }))
      const projects = (result.Items || []).map((item) => JSON.parse(item.data))
      return respond(200, { projects })
    }

    // ── POST ?action=updateStatus  (curator approves / rejects / leaves feedback) ──
    if (action === 'updateStatus' && event.httpMethod === 'POST') {
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

    // ── POST ?action=updateCatalog  (curator creates / edits catalog entry) ─
    if (action === 'updateCatalog' && event.httpMethod === 'POST') {
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

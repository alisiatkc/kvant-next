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

    // ── POST ?action=updateStatus  (curator approves / rejects) ─────────────
    if (action === 'updateStatus' && event.httpMethod === 'POST') {
      const { id, status, catalogEntry } = body
      if (!id || !status) return respond(400, { error: 'id and status required' })

      // Update status in submitted_projects
      const found = await ddb.send(new GetCommand({
        TableName: 'submitted_projects',
        Key: { id },
      }))
      if (found.Item) {
        const project = JSON.parse(found.Item.data)
        project.status = status
        await ddb.send(new PutCommand({
          TableName: 'submitted_projects',
          Item: { id, data: JSON.stringify(project) },
        }))
      }

      // Sync approved_catalog
      const catId = numericId(id)
      if (status === 'approved' && catalogEntry) {
        await ddb.send(new PutCommand({
          TableName: 'approved_catalog',
          Item: { id: catId, data: JSON.stringify({ ...catalogEntry, id: catId }) },
        }))
      } else {
        // Remove from catalog on reject / return-to-review (ignore if not present)
        try {
          await ddb.send(new DeleteCommand({
            TableName: 'approved_catalog',
            Key: { id: catId },
          }))
        } catch (_) {}
      }

      return respond(200, { ok: true })
    }

    // ── GET ?action=getCatalog  (catalog page fetches approved projects) ─────
    if (action === 'getCatalog' && event.httpMethod === 'GET') {
      const result = await ddb.send(new ScanCommand({ TableName: 'approved_catalog' }))
      const projects = (result.Items || []).map((item) => JSON.parse(item.data))
      return respond(200, { projects })
    }

    return respond(404, { error: `Unknown action: ${action}` })
  } catch (e) {
    console.error('[kvant-api]', e)
    return respond(500, { error: e.message })
  }
}

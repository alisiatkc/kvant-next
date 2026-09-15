'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const Module = require('node:module')
const crypto = require('node:crypto')

const SESSION_SECRET = 'test-session-secret-that-is-longer-than-32-characters'
const hashPassword = (password, salt) => `scrypt$${salt}$${crypto.scryptSync(password, salt, 32).toString('hex')}`

process.env.SESSION_SECRET = SESSION_SECRET
process.env.AUTH_ACCOUNTS_JSON = JSON.stringify([
  {
    role: 'student', login: 'kvant-01', passwordHash: hashPassword('student-pass', 'team-salt'),
    track: 'А1', curatorLogin: 'curator',
  },
  {
    role: 'curator', login: 'curator', passwordHash: hashPassword('curator-pass', 'curator-salt'),
    name: 'Тестовый куратор', id: 'c1',
  },
])

const calls = []
let sendResult = {}

class Command {
  constructor(input) {
    this.input = input
  }
}

class PutCommand extends Command {}
class ScanCommand extends Command {}
class GetCommand extends Command {}
class DeleteCommand extends Command {}

const originalLoad = Module._load
Module._load = function mockAwsSdk(request, parent, isMain) {
  if (request === '@aws-sdk/client-dynamodb') {
    return { DynamoDBClient: class DynamoDBClient {} }
  }
  if (request === '@aws-sdk/lib-dynamodb') {
    return {
      DynamoDBDocumentClient: {
        from: () => ({
          send: async (command) => {
            calls.push(command)
            return typeof sendResult === 'function' ? sendResult(command) : sendResult
          },
        }),
      },
      PutCommand,
      ScanCommand,
      GetCommand,
      DeleteCommand,
    }
  }
  return originalLoad(request, parent, isMain)
}

const { handler } = require('./index')
Module._load = originalLoad

function token(payload) {
  const encoded = Buffer.from(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString('base64url')
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

const teamToken = token({ sub: 'kvant-01', role: 'student', teamCode: 'kvant-01', track: 'А1' })
const otherTeamToken = token({ sub: 'kvant-02', role: 'student', teamCode: 'kvant-02', track: 'А2' })
const curatorToken = token({ sub: 'curator', role: 'curator', name: 'Тестовый куратор', id: 'c1' })

function event(action, body, method = 'POST', authToken) {
  return {
    httpMethod: method,
    queryStringParameters: { action },
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    body: body === undefined ? undefined : JSON.stringify(body),
  }
}

test.beforeEach(() => {
  calls.length = 0
  sendResult = {}
})

test('login verifies a server-side password and returns a signed session', async () => {
  const response = await handler(event('login', {
    role: 'student', login: 'kvant-01', password: 'student-pass',
  }))
  const body = JSON.parse(response.body)

  assert.equal(response.statusCode, 200)
  assert.equal(body.user.role, 'student')
  assert.equal(body.user.teamCode, 'kvant-01')
  assert.equal(typeof body.token, 'string')
  assert.equal(body.user.passwordHash, undefined)
})

test('login rejects an invalid password', async () => {
  const response = await handler(event('login', {
    role: 'student', login: 'kvant-01', password: 'wrong-password',
  }))

  assert.equal(response.statusCode, 401)
  assert.equal(calls.length, 0)
})

test('updateCatalog stores a normalized catalog entry', async () => {
  const response = await handler(event('updateCatalog', {
    entry: {
      id: 101,
      title: '  Речевые карточки  ',
      excerpt: '  Краткое описание  ',
      fullDesc: '  Полное описание  ',
      subject: 'pedagogy',
      authors: [' Анна ', '', 'Ирина'],
      files: [],
      tech: [' Печать ', 'Ламинация'],
      image: 'pedagogy',
      contact: '',
      likes: -4,
    },
  }, 'POST', curatorToken))

  assert.equal(response.statusCode, 200)
  assert.equal(calls.length, 1)
  assert.ok(calls[0] instanceof PutCommand)
  assert.equal(calls[0].input.TableName, 'approved_catalog')

  const stored = JSON.parse(calls[0].input.Item.data)
  assert.equal(stored.title, 'Речевые карточки')
  assert.deepEqual(stored.authors, ['Анна', 'Ирина'])
  assert.deepEqual(stored.tech, ['Печать', 'Ламинация'])
  assert.equal(stored.likes, 0)
})

test('updateCatalog rejects an invalid entry without writing', async () => {
  const response = await handler(event('updateCatalog', {
    entry: { id: 0, title: '', subject: 'unknown', authors: [], files: [], tech: [] },
  }, 'POST', curatorToken))

  assert.equal(response.statusCode, 400)
  assert.equal(calls.length, 0)
})

test('deleteCatalog removes the requested entry', async () => {
  const response = await handler(event('deleteCatalog', { id: 101 }, 'POST', curatorToken))

  assert.equal(response.statusCode, 200)
  assert.equal(calls.length, 1)
  assert.ok(calls[0] instanceof DeleteCommand)
  assert.deepEqual(calls[0].input, {
    TableName: 'approved_catalog',
    Key: { id: 101 },
  })
})

test('getCatalog skips malformed stored records', async () => {
  sendResult = {
    Items: [
      { id: 101, data: JSON.stringify({ id: 101, title: 'Проект' }) },
      { id: 102, data: '{not-json' },
    ],
  }

  const response = await handler(event('getCatalog', undefined, 'GET'))
  const body = JSON.parse(response.body)

  assert.equal(response.statusCode, 200)
  assert.deepEqual(body.projects, [{ id: 101, title: 'Проект' }])
})

test('saveWorkspace stores the team workspace', async () => {
  const workspace = {
    projectName: 'Исследовательский проект',
    tasks: [{ id: '1', title: 'Собрать данные' }],
    notes: 'Первый цикл наблюдений',
  }

  const response = await handler(event('saveWorkspace', {
    teamCode: 'kvant-01',
    workspace,
  }, 'POST', teamToken))

  assert.equal(response.statusCode, 200)
  assert.equal(calls.length, 1)
  assert.ok(calls[0] instanceof PutCommand)
  assert.equal(calls[0].input.TableName, 'team_workspaces')
  assert.equal(calls[0].input.Item.id, 'kvant-01')
  assert.deepEqual(JSON.parse(calls[0].input.Item.data), workspace)
  assert.ok(calls[0].input.Item.updatedAt)
})

test('getWorkspace returns the saved workspace', async () => {
  const workspace = { projectName: 'Цифровой проект', tasks: [], notes: '' }
  sendResult = {
    Item: {
      id: 'kvant-01',
      data: JSON.stringify(workspace),
      updatedAt: '2026-09-13T12:00:00.000Z',
    },
  }

  const response = await handler({
    httpMethod: 'GET',
    queryStringParameters: { action: 'getWorkspace', teamCode: 'kvant-01' },
    headers: { Authorization: `Bearer ${teamToken}` },
  })
  const body = JSON.parse(response.body)

  assert.equal(response.statusCode, 200)
  assert.deepEqual(body.workspace, workspace)
  assert.equal(body.updatedAt, '2026-09-13T12:00:00.000Z')
})

test('workspace actions reject an invalid team code', async () => {
  const response = await handler(event('saveWorkspace', {
    teamCode: '../other-team',
    workspace: {},
  }, 'POST', teamToken))

  assert.equal(response.statusCode, 400)
  assert.equal(calls.length, 0)
})

test('workspace rejects a request without a session', async () => {
  const response = await handler(event('saveWorkspace', {
    teamCode: 'kvant-01', workspace: {},
  }))

  assert.equal(response.statusCode, 401)
  assert.equal(calls.length, 0)
})

test('student cannot open another team workspace', async () => {
  const response = await handler({
    httpMethod: 'GET',
    queryStringParameters: { action: 'getWorkspace', teamCode: 'kvant-01' },
    headers: { Authorization: `Bearer ${otherTeamToken}` },
  })

  assert.equal(response.statusCode, 403)
  assert.equal(calls.length, 0)
})

test('student cannot edit the curator catalog', async () => {
  const response = await handler(event('deleteCatalog', { id: 101 }, 'POST', teamToken))

  assert.equal(response.statusCode, 401)
  assert.equal(calls.length, 0)
})

test('student submission is bound to the authenticated team', async () => {
  sendResult = (command) => command instanceof GetCommand ? {} : {}
  const response = await handler(event('submit', {
    project: {
      id: 'project-1', teamCode: 'kvant-01', status: 'review',
      projectName: 'Проект', curatorLogin: 'forged-curator',
    },
  }, 'POST', teamToken))

  assert.equal(response.statusCode, 200)
  assert.equal(calls.length, 2)
  assert.ok(calls[0] instanceof GetCommand)
  assert.ok(calls[1] instanceof PutCommand)
  const stored = JSON.parse(calls[1].input.Item.data)
  assert.equal(stored.teamCode, 'kvant-01')
  assert.equal(stored.curatorLogin, '')
})

test('student cannot overwrite another team project id', async () => {
  sendResult = (command) => command instanceof GetCommand
    ? { Item: { id: 'project-1', data: JSON.stringify({ teamCode: 'kvant-02' }) } }
    : {}
  const response = await handler(event('submit', {
    project: { id: 'project-1', teamCode: 'kvant-01', status: 'review' },
  }, 'POST', teamToken))

  assert.equal(response.statusCode, 403)
  assert.equal(calls.length, 1)
  assert.ok(calls[0] instanceof GetCommand)
})

test('research measurement stores a pseudonymous repeated response', async () => {
  const response = await handler(event('submitMeasurement', {
    measurement: {
      participantCode: 'ST-014',
      stage: 'T0',
      previousPractice: true,
      consentConfirmed: true,
      answers: {
        processClarity: 4,
        selfOrganization: 3,
        teamwork: 5,
        communication: 4,
        materialsAccess: 3,
        usefulness: 4,
        usability: 5,
        projectResult: 4,
      },
    },
  }, 'POST', teamToken))
  const body = JSON.parse(response.body)

  assert.equal(response.statusCode, 200)
  assert.equal(calls.length, 1)
  assert.ok(calls[0] instanceof PutCommand)
  assert.equal(calls[0].input.TableName, 'research_measurements')
  const stored = JSON.parse(calls[0].input.Item.data)
  assert.equal(stored.teamCode, 'kvant-01')
  assert.equal(stored.stage, 'T0')
  assert.equal(stored.previousPractice, true)
  assert.equal(stored.consentConfirmed, true)
  assert.equal(stored.instrumentVersion, '1.0')
  assert.equal(stored.participantCode, undefined)
  assert.equal(stored.participantId, body.participantId)
  assert.match(stored.participantId, /^[a-f0-9]{16}$/)
})

test('research measurement requires complete ratings and consent', async () => {
  const response = await handler(event('submitMeasurement', {
    measurement: {
      participantCode: 'ST-014', stage: 'T1', consentConfirmed: false, answers: {},
    },
  }, 'POST', teamToken))

  assert.equal(response.statusCode, 400)
  assert.equal(calls.length, 0)
})

test('curator can retrieve research measurements', async () => {
  const record = {
    id: 'kvant-01:abc123:T1', teamCode: 'kvant-01', participantId: 'abc123',
    stage: 'T1', previousPractice: null, answers: { processClarity: 4 }, createdAt: '2026-09-15T10:00:00.000Z',
  }
  sendResult = { Items: [{ id: record.id, data: JSON.stringify(record) }] }

  const response = await handler(event('getMeasurements', undefined, 'GET', curatorToken))
  const body = JSON.parse(response.body)

  assert.equal(response.statusCode, 200)
  assert.deepEqual(body.measurements, [record])
  assert.equal(calls[0].input.TableName, 'research_measurements')
})

test('student cannot retrieve the research dataset', async () => {
  const response = await handler(event('getMeasurements', undefined, 'GET', teamToken))

  assert.equal(response.statusCode, 401)
  assert.equal(calls.length, 0)
})

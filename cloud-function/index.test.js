'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const Module = require('node:module')

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

function event(action, body, method = 'POST') {
  return {
    httpMethod: method,
    queryStringParameters: { action },
    body: body === undefined ? undefined : JSON.stringify(body),
  }
}

test.beforeEach(() => {
  calls.length = 0
  sendResult = {}
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
  }))

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
  }))

  assert.equal(response.statusCode, 400)
  assert.equal(calls.length, 0)
})

test('deleteCatalog removes the requested entry', async () => {
  const response = await handler(event('deleteCatalog', { id: 101 }))

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
  }))

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
  }))

  assert.equal(response.statusCode, 400)
  assert.equal(calls.length, 0)
})

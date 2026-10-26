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
      projectExperience: 'some',
      digitalConfidence: 4,
      consentConfirmed: true,
      answers: {
        processClarity: 4,
        goalClarity: 4,
        feedbackUse: 3,
        selfOrganization: 3,
        reflection: 4,
        responsibility: 5,
        teamwork: 5,
        communication: 4,
        coordination: 4,
        psychologicalSafety: 5,
        materialsAccess: 3,
        usefulness: 4,
        usability: 5,
        projectResult: 4,
        autonomySupport: 4,
        intentionToUse: 5,
      },
      qualitative: { support: 'План работы', barrier: 'Сроки', suggestion: 'Больше примеров' },
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
  assert.equal(stored.instrumentVersion, '2.0')
  assert.equal(stored.projectExperience, 'some')
  assert.equal(stored.digitalConfidence, 4)
  assert.equal(stored.qualitative.barrier, 'Сроки')
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

test('student can record a privacy-safe research event', async () => {
  const response = await handler(event('trackResearchEvent', {
    event: {
      type: 'task_status_changed',
      entityId: 'task-7',
      metadata: { from: 'inprogress', to: 'done', dueDate: '2026-11-10' },
    },
  }, 'POST', teamToken))
  const body = JSON.parse(response.body)

  assert.equal(response.statusCode, 200)
  assert.equal(calls.length, 1)
  assert.ok(calls[0] instanceof PutCommand)
  assert.equal(calls[0].input.TableName, 'research_events')
  const stored = JSON.parse(calls[0].input.Item.data)
  assert.equal(stored.teamCode, 'kvant-01')
  assert.equal(stored.type, 'task_status_changed')
  assert.equal(stored.metadata.to, 'done')
  assert.equal(body.ok, true)
})

test('curator can retrieve research events and students cannot', async () => {
  const record = {
    id: 'kvant-01:event-1', teamCode: 'kvant-01', type: 'peer_review_submitted',
    entityId: 'project-2', metadata: { targetTeamCode: 'kvant-02' }, createdAt: '2026-10-22T08:00:00.000Z',
  }
  sendResult = { Items: [{ id: record.id, data: JSON.stringify(record) }] }
  const curatorResponse = await handler(event('getResearchEvents', undefined, 'GET', curatorToken))
  assert.equal(curatorResponse.statusCode, 200)
  assert.deepEqual(JSON.parse(curatorResponse.body).events, [record])

  calls.length = 0
  const studentResponse = await handler(event('getResearchEvents', undefined, 'GET', teamToken))
  assert.equal(studentResponse.statusCode, 401)
  assert.equal(calls.length, 0)
})

test('community project feed exposes progress but not private project materials', async () => {
  sendResult = {
    Items: [{
      id: 'project-2',
      data: JSON.stringify({
        id: 'project-2',
        teamCode: 'kvant-02',
        teamName: 'Команда 2',
        projectName: 'Умная теплица',
        projectBlock: 'Исследовательский проект',
        projectDesc: 'Подробное техническое описание',
        files: [{ name: 'secret.dxf' }],
        track: 'А2',
        status: 'review',
        submittedAt: '2026-10-01T10:00:00.000Z',
        teamProfile: {
          themeColor: '#0f766e',
          icon: 'research',
          competencies: ['Анализ данных', 'Прототипирование'],
          helpRequest: 'Нужна помощь с формулировкой критериев.',
          memberRoles: [{ member: 'Иванов Иван', role: 'Исследователь' }],
        },
        workspaceSnapshot: {
          tasks: [
            { id: '1', status: 'done' },
            { id: '2', status: 'inprogress' },
          ],
        },
      }),
    }],
  }

  const response = await handler({
    httpMethod: 'GET',
    queryStringParameters: { action: 'getCommunityProjects' },
    headers: { Authorization: `Bearer ${teamToken}` },
  })
  const body = JSON.parse(response.body)

  assert.equal(response.statusCode, 200)
  assert.equal(body.projects.length, 1)
  assert.equal(body.projects[0].progressPercent, 50)
  assert.equal(body.projects[0].projectDesc, undefined)
  assert.equal(body.projects[0].files, undefined)
  assert.equal(body.projects[0].teamProfile.icon, 'research')
  assert.equal(body.projects[0].teamProfile.memberRoles[0].member, '')
  assert.equal(JSON.stringify(body.projects[0]).includes('Иванов Иван'), false)
  assert.match(body.projects[0].publicSummary, /исходные файлы не опубликованы/)
})

test('student can submit one structured peer review for another team project', async () => {
  sendResult = (command) => command instanceof GetCommand
    ? { Item: { id: 'project-2', data: JSON.stringify({ id: 'project-2', teamCode: 'kvant-02', status: 'review' }) } }
    : {}

  const response = await handler(event('submitPeerReview', {
    review: {
      projectId: 'project-2',
      scores: { problemClarity: 4, resultQuality: 3, applicability: 5, presentation: 4 },
      comment: 'Понятен текущий этап. Советуем уточнить критерий успешной апробации.',
    },
  }, 'POST', teamToken))
  const body = JSON.parse(response.body)

  assert.equal(response.statusCode, 200)
  assert.equal(body.review.reviewerTeamCode, 'kvant-01')
  assert.equal(calls.length, 2)
  assert.ok(calls[1] instanceof PutCommand)
  assert.equal(calls[1].input.TableName, 'peer_reviews')
})

test('student cannot review the project of their own team', async () => {
  sendResult = (command) => command instanceof GetCommand
    ? { Item: { id: 'project-1', data: JSON.stringify({ id: 'project-1', teamCode: 'kvant-01', status: 'review' }) } }
    : {}

  const response = await handler(event('submitPeerReview', {
    review: {
      projectId: 'project-1',
      scores: { problemClarity: 4, resultQuality: 4, applicability: 4, presentation: 4 },
      comment: 'Комментарий достаточной длины для проверки ограничения.',
    },
  }, 'POST', teamToken))

  assert.equal(response.statusCode, 403)
  assert.equal(calls.length, 1)
})

test('student can ask a previous team a structured question', async () => {
  sendResult = (command) => command instanceof GetCommand
    ? { Item: { id: 'archive-1', data: JSON.stringify({ id: 'archive-1', teamCode: 'kvant-old', openToQuestions: true }) } }
    : {}

  const response = await handler(event('submitCommunityMessage', {
    message: {
      projectId: 'archive-1',
      text: 'Как вы организовали первую апробацию результата?',
    },
  }, 'POST', teamToken))
  const body = JSON.parse(response.body)

  assert.equal(response.statusCode, 200)
  assert.equal(body.message.authorTeamCode, 'kvant-01')
  assert.equal(calls.length, 2)
  assert.ok(calls[1] instanceof PutCommand)
  assert.equal(calls[1].input.TableName, 'community_messages')
})


const {validate: validateSurvey, schema: surveySchema} = require('./methodology-survey')
const sampleSurvey = (stage = 'T0', answers = {}) => ({instrumentVersion:'4.0',stage,participantCode:'ABC234',consentConfirmed:true,submissionId:'b54ef489-7d6c-47c0-a344-5917949b90d3',answers})
test('v4 preserves zero, uncertainty and omission and prunes novice history', () => {
  const result = validateSurvey(sampleSurvey('T0', {'V2':'none','V5':'own','V6':'0','V10.1':'NP','V10.2':'ZO'}))
  assert.deepEqual(result.answers, {'V2':'none','V10.1':'NP','V10.2':'ZO'})
  const final = validateSurvey(sampleSurvey('T1', {'I3':0,'I5.1':'0','I9.1':'NI'}))
  assert.deepEqual(final.answers, {'I3':0,'I5.1':'0','I9.1':'NI'})
})
test('v4 rejects invalid codes, consent, limits, conflicting choices and ranges', () => {
  for (const input of [
    {...sampleSurvey(),participantCode:''}, {...sampleSurvey(),participantCode:'12'},
    {...sampleSurvey(),consentConfirmed:false}, {...sampleSurvey(),instrumentVersion:'3.0'},
    {...sampleSurvey(),name:'Alice'}, sampleSurvey('T0',{'V8':['none','time']}),
    sampleSurvey('T0',{'V8':['problem','result','tasks','time']}),
    sampleSurvey('T1',{'I3':8}), sampleSurvey('T1',{'I3':3,'I3.periodDays':2}),
    sampleSurvey('T1',{'I3.from':'2026-02-30'}), sampleSurvey('T1',{'I3': '0'}),
    sampleSurvey('T0',{'unknown':'x'})
  ]) assert.throws(()=>validateSurvey(input))
  assert.equal(validateSurvey({...sampleSurvey('T1'),participantCode:''}).participantCode,'')
})
test('v4 six paired statements have identical wording and response scales', () => {
  const qs = stage => surveySchema.stages[stage].sections.flatMap(s=>s.questions)
  for(let i=1;i<=6;i++) {
    const before=qs('T0').find(q=>q.id===`V10.${i}`), after=qs('T1').find(q=>q.id===`I11.${i}`)
    assert.equal(before.label,after.label);assert.deepEqual(before.options,after.options)
  }
})
test('v4 submits without team login and stores no raw code or account association', async () => {
  const res=await handler(event('submitHypothesisSurvey',{survey:sampleSurvey()}))
  assert.equal(res.statusCode,200)
  const stored=calls[0].input
  assert.equal(stored.TableName,'methodology_surveys')
  assert.equal(stored.ConditionExpression,'attribute_not_exists(id)')
  assert.equal(stored.Item.instrumentVersion,'4.0')
  assert.equal(stored.Item.participantCode,undefined)
  assert.equal(stored.Item.teamCode,undefined)
  assert.match(stored.Item.participantId,/^[a-f0-9]{64}$/)
  assert.equal(JSON.stringify(stored.Item).includes('ABC234'),false)
})
test('v4 same code pairs independently of stage and unpaired final is allowed', async () => {
  await handler(event('submitHypothesisSurvey',{survey:sampleSurvey('T0')}))
  const first=calls[0].input.Item
  await handler(event('submitHypothesisSurvey',{survey:{...sampleSurvey('T1'),submissionId:crypto.randomUUID()}}))
  assert.equal(first.participantId,calls[1].input.Item.participantId)
  await handler(event('submitHypothesisSurvey',{survey:{...sampleSurvey('T1'),participantCode:''}}))
  assert.equal(calls[2].input.Item.paired,false)
})
test('v4 idempotent retry succeeds but changed answers cannot overwrite a record', async () => {
  await handler(event('submitHypothesisSurvey',{survey:sampleSurvey()}))
  const saved=calls[0].input.Item
  sendResult=command=>{if(command instanceof PutCommand){const e=new Error('exists');e.name='ConditionalCheckFailedException';throw e}return {Item:saved}}
  assert.equal((await handler(event('submitHypothesisSurvey',{survey:sampleSurvey()}))).statusCode,200)
  assert.equal((await handler(event('submitHypothesisSurvey',{survey:sampleSurvey('T0',{'V2':'none'})}))).statusCode,409)
})
test('v4 validates before writing and restricts reads to curator', async () => {
  assert.equal((await handler(event('submitHypothesisSurvey',{survey:{...sampleSurvey(),consentConfirmed:false}}))).statusCode,400)
  assert.equal(calls.length,0)
  assert.equal((await handler(event('getHypothesisSurveys',undefined,'GET'))).statusCode,401)
  assert.equal((await handler(event('getHypothesisSurveys',undefined,'GET',teamToken))).statusCode,401)
})
test('v4 curator export follows pagination and excludes internal hashes', async () => {
  let n=0
  sendResult=()=>++n===1?{Items:[{id:'one',instrumentVersion:'4.0',payloadHash:'secret'}],LastEvaluatedKey:{id:'one'}}:{Items:[{id:'two',instrumentVersion:'4.0'},{id:'old',instrumentVersion:'3.0'}]}
  const response=await handler(event('getHypothesisSurveys',undefined,'GET',curatorToken))
  assert.equal(response.statusCode,200)
  assert.deepEqual(JSON.parse(response.body).surveys,[{id:'one',instrumentVersion:'4.0'},{id:'two',instrumentVersion:'4.0'}])
  assert.deepEqual(calls[1].input.ExclusiveStartKey,{id:'one'})
})

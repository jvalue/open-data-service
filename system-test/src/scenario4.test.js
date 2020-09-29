const request = require('supertest')
const {
  STORAGE_URL,
  ADAPTER_URL,
  PIPELINE_URL,
  NOTIFICATION_URL,
  MOCK_SERVER_URL,
  MOCK_SERVER_WITHIN_DOCKER
} = require('./env')
const {
  generateDataSourceConfig,
  generatePipelineConfig,
  generateSourceData, checkWebhook
} = require('./testHelper')
const { waitForServicesToBeReady } = require('./waitForServices')

const TIMEOUT = 60000

let dataSourceConfig = null

let dataSourceId = -1
let pipelineId = -1

describe('Test 4: Update periodic datasource with pipeline', () => {
  beforeAll(async () => {
    await waitForServicesToBeReady()
  }, TIMEOUT)

  afterAll(async () => {
    await Promise.all([
      request(ADAPTER_URL).delete('/').send(),
      request(PIPELINE_URL).delete('/configs').send(),
      request(MOCK_SERVER_URL).delete('/').send()
    ])
  }, TIMEOUT)

  test('Prepare mock service', async () => {
    const response = await request(MOCK_SERVER_URL).post('/data/test4').send(generateSourceData())
    expect(response.status).toEqual(201)

    const updatedSD = generateSourceData()
    updatedSD.one = 2
    const responseUpd = await request(MOCK_SERVER_URL).post('/data/test4_updated').send(updatedSD)
    expect(responseUpd.status).toEqual(201)

    dataSourceConfig = generateDataSourceConfig(MOCK_SERVER_WITHIN_DOCKER + '/data/test4', true)
  }, TIMEOUT)

  test('Create DataSource at adapter service', async () => {
    const response = await request(ADAPTER_URL).post('/datasources').send(dataSourceConfig)
    expect(response.status).toEqual(201)

    dataSourceId = response.body.id
    expect(dataSourceId).toBeGreaterThan(0)
  }, TIMEOUT)

  test('Add pipeline to DataSource', async () => {
    const pipelineConfig = generatePipelineConfig(dataSourceId)
    const response = await request(PIPELINE_URL).post('/configs').send(pipelineConfig)
    expect(response.status).toEqual(201)

    pipelineId = response.body.id
    expect(pipelineId).toBeGreaterThan(0)
  }, TIMEOUT)

  test('Create notification', async () => {
    const notificationConfig = {
      condition: 'data.one === 1',
      url: MOCK_SERVER_WITHIN_DOCKER + '/notifications/test4_1',
      pipelineId: pipelineId
    }

    const response = await request(NOTIFICATION_URL).post('/config/webhook').send(notificationConfig)
    expect(response.status).toEqual(201)

    expect(response.body.id).toBeGreaterThan(0)
  }, TIMEOUT)

  test('Check notification web hook', async () => {
    const response = await checkWebhook(MOCK_SERVER_URL + '/notifications/test4_1')
    expect(response.body.location).toEqual(expect.stringContaining('/storage/' + pipelineId))
    expect(response.body.timestamp).toBeDefined()
  }, TIMEOUT)

  test('Check stored data', async () => {
    const response = await request(STORAGE_URL).get('/' + pipelineId)
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body[0].data).toEqual(generateSourceData())
  }, TIMEOUT)

  test('Update datasource', async () => {
    dataSourceConfig.id = dataSourceId
    dataSourceConfig.protocol.parameters.location = MOCK_SERVER_WITHIN_DOCKER + '/data/test4_updated'

    const response = await request(ADAPTER_URL).put(`/datasources/${dataSourceId}`).send(dataSourceConfig)
    expect(response.status).toEqual(204)
  })

  test('Update pipeline', async () => {
    const pipelineConfig = generatePipelineConfig(dataSourceId)
    pipelineConfig.id = pipelineId

    const updateResponse = await request(PIPELINE_URL).put(`/configs/${pipelineId}`).send(pipelineConfig)
    expect(updateResponse.status).toEqual(204)
  })

  test('Add second notification', async () => {
    const secondNotificationCfg = {
      pipelineId: pipelineId,
      condition: 'data.two === "two"',
      url: MOCK_SERVER_WITHIN_DOCKER + '/notifications/test4_2'
    }

    const response = await request(NOTIFICATION_URL).post('/config/webhook').send(secondNotificationCfg)
    expect(response.status).toEqual(201)
    expect(response.body.id).toBeGreaterThan(0)
  })

  test('Check second notification web hook', async () => {
    const response = await checkWebhook(MOCK_SERVER_URL + '/notifications/test4_2')
    expect(response.body.location).toEqual(expect.stringContaining('/storage/' + pipelineId))
    expect(response.body.timestamp).toBeDefined()
  }, TIMEOUT)

  test('Delete pipeline config', async () => {
    const response = await request(PIPELINE_URL).delete(`/configs/${pipelineId}`).send()
    expect(response.status).toEqual(204)
  }, TIMEOUT)

  test('Delete adapter config', async () => {
    const response = await request(ADAPTER_URL).delete(`/datasources/${dataSourceId}`).send()
    expect(response.status).toEqual(204)
  }, TIMEOUT)
})

import { Server } from 'http'

import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { AmqpConnection } from '@jvalue/node-dry-amqp'

import { AMQP_URL, CONNECTION_RETRIES, CONNECTION_BACKOFF } from './env'

import { PipelineExecutionEndpoint } from './api/rest/pipelineExecutionEndpoint'
import VM2SandboxExecutor from './pipeline-execution/sandbox/vm2SandboxExecutor'
import PipelineExecutor from './pipeline-execution/pipelineExecutor'
import { PipelineConfigEndpoint } from './api/rest/pipelineConfigEndpoint'
import { PipelineConfigManager } from './pipeline-config/pipelineConfigManager'
import { PipelineTransformedDataManager } from './pipeline-config/pipelineTransformedDataManager'
import { PipelineTranformedDataEndpoint } from './api/rest/pipelineTransformedDataEndpoint'
import { createDatasourceExecutionConsumer } from './api/amqp/datasourceExecutionConsumer'
import { init as initDatabase } from './pipeline-config/pipelineDatabase'
import JsonSchemaValidator from './pipeline-validator/jsonschemavalidator'

const port = 8080
let server: Server | undefined

function onAmqpConnectionLoss (error: any): never {
  console.log('Terminating because connection to AMQP lost:', error)
  process.exit(1)
}

process.on('SIGTERM', () => {
  console.info('Tramsformation-Service: SIGTERM signal received.')
  server?.close()
})

async function main (): Promise<void> {
  const sandboxExecutor = new VM2SandboxExecutor()
  const pipelineExecutor = new PipelineExecutor(sandboxExecutor)

  const postgresClient = await initDatabase(CONNECTION_RETRIES, CONNECTION_BACKOFF)

  const validator = new JsonSchemaValidator()

  const pipelineTransformedDataManager = new PipelineTransformedDataManager(
    postgresClient
  )

  const pipelineConfigManager = new PipelineConfigManager(
    postgresClient,
    pipelineExecutor,
    pipelineTransformedDataManager,
    validator
  )

  const amqpConnection = new AmqpConnection(AMQP_URL, CONNECTION_RETRIES, CONNECTION_BACKOFF, onAmqpConnectionLoss)
  await createDatasourceExecutionConsumer(amqpConnection, pipelineConfigManager)

  const pipelineExecutionEndpoint = new PipelineExecutionEndpoint(pipelineExecutor)
  const pipelineConfigEndpoint = new PipelineConfigEndpoint(pipelineConfigManager)
  const pipelineTransformedDataEndpoint = new PipelineTranformedDataEndpoint(pipelineTransformedDataManager)

  const app = express()
  app.use(cors())
  app.use(bodyParser.json({ limit: '50mb' }))
  app.use(bodyParser.urlencoded({ extended: false }))

  pipelineExecutionEndpoint.registerRoutes(app)
  pipelineConfigEndpoint.registerRoutes(app)
  pipelineTransformedDataEndpoint.registerRoutes(app)

  app.get('/', (req: express.Request, res: express.Response): void => {
    res.status(200)
      .send('I am alive!')
  })

  app.get('/version', (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain')
    res.status(200)
      .send(pipelineExecutor.getVersion())
  })

  server = app.listen(port, () => {
    console.log(`Listening on port ${port}`)
  })
}

main()
  .catch(error => {
    console.error(`Failed to start pipeline service: ${error}`)
  })

/* eslint-env jest */
import { mocked } from 'ts-jest/utils'
import { PostgresClient } from '@jvalue/node-dry-pg'

import { PipelineConfigManager } from './pipelineConfigManager'
import { PipelineTransformedDataManager } from './pipelineTransformedDataManager'
import PipelineExecutor from '../pipeline-execution/pipelineExecutor'
import { PipelineConfig, PipelineConfigDTO } from './model/pipelineConfig'
import VM2SandboxExecutor from '../pipeline-execution/sandbox/vm2SandboxExecutor'
import * as PipelineConfigRepository from './pipelineConfigRepository'
import * as OutboxEventPublisher from './outboxEventPublisher'
import JsonSchemaValidator from './../pipeline-validator/jsonschemavalidator'

jest.mock('@jvalue/node-dry-pg', () => {
  return {
    PostgresClient: jest.fn().mockImplementation(() => {
      return {
        transaction: async (fn: () => Promise<void>) => await fn()
      }
    })
  }
})

jest.mock('../pipeline-execution/pipelineExecutor')

jest.mock('./pipelineTransformedDataManager')

jest.mock('./../pipeline-validator/jsonschemavalidator')

jest.mock('./pipelineConfigRepository', () => {
  return {
    create: jest.fn().mockImplementation(async (_, config) => config),
    get: jest.fn(),
    getAll: jest.fn().mockResolvedValue([generateConfig(), generateConfig()]),
    getByDatasourceId: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn().mockResolvedValue(generateConfig()),
    deleteAll: jest.fn().mockResolvedValue([generateConfig(), generateConfig()])
  }
})

jest.mock('./pipelineTransformedDataRepository', () => {
  return {
    insertTransformedData: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    getByDatasourceId: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
    deleteAll: jest.fn()
  }
})

jest.mock('./outboxEventPublisher', () => {
  return {
    publishCreation: jest.fn(),
    publishUpdate: jest.fn(),
    publishDeletion: jest.fn(),

    publishError: jest.fn(),
    publishSuccess: jest.fn()
  }
})

function generateConfig (): PipelineConfig {
  return {
    id: 123,
    datasourceId: 456,
    transformation: {
      func: 'return data;'
    },
    metadata: {
      author: 'author',
      displayName: 'Pipeline Test',
      license: 'Test License',
      description: 'A test pipeline.',
      creationTimestamp: new Date()
    },
    schema: {}
  }
}

function pipelineConfigDTO (): PipelineConfigDTO {
  return {
    datasourceId: 456,
    transformation: {
      func: 'return data;'
    },
    metadata: {
      author: 'author',
      displayName: 'Pipeline Test',
      license: 'Test License',
      description: 'A test pipeline.'
    },
    schema: {}
  }
}

const pipelineConfigRepositoryMock = mocked(PipelineConfigRepository, true)
const outboxEventPublisherMock = mocked(OutboxEventPublisher, true)
const postgresClient = new PostgresClient()

afterEach(() => {
  jest.clearAllMocks()
})

test('Should call create and publish event', async () => {
  const config = pipelineConfigDTO()

  const manager = new PipelineConfigManager(
    postgresClient,
    new PipelineExecutor(new VM2SandboxExecutor()),
    new PipelineTransformedDataManager(postgresClient),
    new JsonSchemaValidator()
  )
  await manager.create(config)

  expect(pipelineConfigRepositoryMock.create).toHaveBeenCalledWith(undefined, config)
  expect(outboxEventPublisherMock.publishCreation).toHaveBeenCalledTimes(1)
})

test('Should call update and publish event', async () => {
  const config = pipelineConfigDTO()

  const manager = new PipelineConfigManager(
    postgresClient,
    new PipelineExecutor(new VM2SandboxExecutor()),
    new PipelineTransformedDataManager(postgresClient),
    new JsonSchemaValidator()
  )
  await manager.update(123, config)

  expect(pipelineConfigRepositoryMock.update).toHaveBeenCalledWith(undefined, 123, config)
  expect(outboxEventPublisherMock.publishUpdate).toHaveBeenCalledTimes(1)
})

test('Should call delete and publish event', async () => {
  const manager = new PipelineConfigManager(
    postgresClient,
    new PipelineExecutor(new VM2SandboxExecutor()),
    new PipelineTransformedDataManager(postgresClient),
    new JsonSchemaValidator()
  )
  await manager.delete(1234)

  expect(pipelineConfigRepositoryMock.deleteById).toHaveBeenCalledWith(undefined, 1234)
  expect(outboxEventPublisherMock.publishDeletion).toHaveBeenCalledTimes(1)
})

test('Should call delete all and publish event', async () => {
  const manager = new PipelineConfigManager(
    postgresClient,
    new PipelineExecutor(new VM2SandboxExecutor()),
    new PipelineTransformedDataManager(postgresClient),
    new JsonSchemaValidator()
  )
  await manager.deleteAll()

  expect(pipelineConfigRepositoryMock.deleteAll).toHaveBeenCalledTimes(1)
  expect(outboxEventPublisherMock.publishDeletion).toHaveBeenCalledTimes(2)
})

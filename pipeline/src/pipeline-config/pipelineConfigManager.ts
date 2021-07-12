import { PostgresClient } from '@jvalue/node-dry-pg'
import Validator from 'src/pipeline-validator/validator'

import PipelineExecutor from '../pipeline-execution/pipelineExecutor'
import { PipelineConfig, PipelineConfigDTO } from './model/pipelineConfig'
import * as EventPublisher from './outboxEventPublisher'
import * as PipelineConfigRepository from './pipelineConfigRepository'
import { PipelineTransformedDataManager } from './pipelineTransformedDataManager'

export class PipelineConfigManager {
  constructor (
    private readonly pgClient: PostgresClient,
    private readonly pipelineExecutor: PipelineExecutor,
    private readonly pipelineTransformedDataManager: PipelineTransformedDataManager,
    private readonly validator: Validator
  ) {}

  async create (config: PipelineConfigDTO): Promise<PipelineConfig> {
    return await this.pgClient.transaction(async client => {
      const savedConfig = await PipelineConfigRepository.create(client, config)
      await EventPublisher.publishCreation(client, savedConfig.id, savedConfig.metadata.displayName)
      return savedConfig
    })
  }

  async get (id: number): Promise<PipelineConfig | undefined> {
    return await this.pgClient.transaction(async client =>
      await PipelineConfigRepository.get(client, id))
  }

  async getAll (): Promise<PipelineConfig[]> {
    return await this.pgClient.transaction(async client =>
      await PipelineConfigRepository.getAll(client))
  }

  async getByDatasourceId (datasourceId: number): Promise<PipelineConfig[]> {
    return await this.pgClient.transaction(async client =>
      await PipelineConfigRepository.getByDatasourceId(client, datasourceId))
  }

  async update (id: number, config: PipelineConfigDTO): Promise<void> {
    return await this.pgClient.transaction(async client => {
      await PipelineConfigRepository.update(client, id, config)
      await EventPublisher.publishUpdate(client, id, config.metadata.displayName)
    })
  }

  async delete (id: number): Promise<void> {
    return await this.pgClient.transaction(async client => {
      const deletedPipeline = await PipelineConfigRepository.deleteById(client, id)
      await EventPublisher.publishDeletion(client, id, deletedPipeline.metadata.displayName)
    })
  }

  async deleteAll (): Promise<void> {
    return await this.pgClient.transaction(async client => {
      const deletedConfigs = await PipelineConfigRepository.deleteAll(client)
      for (const deletedConfig of deletedConfigs) {
        await EventPublisher.publishDeletion(client, deletedConfig.id, deletedConfig.metadata.displayName)
      }
    })
  }

  async triggerConfig (datasourceId: number, data: object): Promise<void> {
    const allConfigs = await this.getByDatasourceId(datasourceId)
    for (const config of allConfigs) {
      const result = this.pipelineExecutor.executeJob(config.transformation.func, data)
      if ('error' in result) {
        await this.pgClient.transaction(async client =>
          await EventPublisher.publishError(client, config.id, config.metadata.displayName, result.error.message))
      } else if ('data' in result) {
        const transformedData = this.validator.validate(config, result.data)
        await this.pipelineTransformedDataManager.insert(transformedData)

        await this.pgClient.transaction(async client =>
          await EventPublisher.publishSuccess(
            client,
            config.id,
            config.metadata.displayName,
            result.data,
            config.schema
          )
        )
      } else {
        console.error(`Pipeline ${config.id} executed with ambiguous result: no data and no error!`)
      }
    }
  }
}

import { PostgresClient } from '@jvalue/node-dry-pg'

import { PipelineTransformedData, PipelineTransformedDataDTO } from './model/pipelineTransformedData'
import * as pipelineTransformedDataRepository from './pipelineTransformedDataRepository'

export class PipelineTransformedDataManager {
  constructor (
    private readonly pgClient: PostgresClient
  ) {}

  async insert (transformedData: PipelineTransformedDataDTO): Promise<PipelineTransformedData> {
    return await this.pgClient.transaction(async client => {
      const savedConfig = await pipelineTransformedDataRepository.insertTransformedData(client, transformedData)
      return savedConfig
    })
  }

  async get (id: number): Promise<PipelineTransformedData | undefined> {
    return await this.pgClient.transaction(async client =>
      await pipelineTransformedDataRepository.get(client, id))
  }

  async getAll (): Promise<PipelineTransformedData[]> {
    return await this.pgClient.transaction(async client =>
      await pipelineTransformedDataRepository.getAll(client))
  }

  async getLatest (id: number): Promise<PipelineTransformedData | undefined> {
    return await this.pgClient.transaction(async client =>
      await pipelineTransformedDataRepository.getLatest(client, id))
  }

  async getByPipelineId (pipelineId: number): Promise<PipelineTransformedData[]> {
    return await this.pgClient.transaction(async client =>
      await pipelineTransformedDataRepository.getByPipelineId(client, pipelineId))
  }

  async update (id: number, transformedData: PipelineTransformedDataDTO): Promise<void> {
    return await this.pgClient.transaction(async client => {
      await pipelineTransformedDataRepository.update(client, id, transformedData)
    })
  }

  async delete (id: number): Promise<void> {
    return await this.pgClient.transaction(async client => {
      await pipelineTransformedDataRepository.deleteById(client, id)
    })
  }

  async deleteAll (): Promise<void> {
    return await this.pgClient.transaction(async client => {
      await pipelineTransformedDataRepository.deleteAll(client)
    })
  }
}

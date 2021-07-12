import express from 'express'

import { PipelineTransformedDataManager } from '../../pipeline-config/pipelineTransformedDataManager'
import { PipelineTransformedDataMetaData } from '../../pipeline-config/model/pipelineTransformedData'
import { asyncHandler } from './utils'

export class PipelineTranformedDataEndpoint {
  constructor (private readonly pipelineTransformedDataManager: PipelineTransformedDataManager) {}

  registerRoutes = (app: express.Application): void => {
    app.get('/transdata/:id/transforms/latest', asyncHandler(this.getLatest))
    app.get('/transdata', asyncHandler(this.getAlive))
  }

  // The following methods need arrow syntax because of javascript 'this' shenanigans
  getAlive = async (req: express.Request, res: express.Response): Promise<void> => {
    res.status(200)
      .send('I am alive!')
  }

  getLatest = async (req: express.Request, res: express.Response): Promise<void> => {
    const pipelineId = parseInt(req.params.id)
    if (Number.isNaN(pipelineId)) {
      res.status(400).send('Path parameter id is missing or is incorrect')
      return
    }
    const transformedData = await this.pipelineTransformedDataManager.getLatest(pipelineId)
    if (transformedData === undefined) {
      res.status(404).send('Config not found')
      return
    }
    const transformedDataMetaData: PipelineTransformedDataMetaData = {
      id: transformedData.id,
      healthStatus: transformedData.healthStatus,
      timestamp: transformedData.createdAt as string
    }
    res.status(200).json(transformedDataMetaData)
  }
}

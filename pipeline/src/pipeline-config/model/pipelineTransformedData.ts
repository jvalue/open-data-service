import { validators } from '@jvalue/node-dry-basics'

export interface PipelineTransformedData {
  id: number
  pipelineId: number
  healthStatus: string
  data: unknown
  schema?: object
  createdAt?: string
}

export interface PipelineTransformedDataMetaData {
  id: number
  healthStatus: string
  timestamp: string
}

export type PipelineTransformedDataDTO = Omit<PipelineTransformedData, 'id' | 'createdAt'>

export class PipelineTransformedDataDTOValidator {
  private errors: string[] = []

  validate (pipelineTransformedData: unknown): pipelineTransformedData is PipelineTransformedDataDTO {
    this.errors = []
    if (!validators.isObject(pipelineTransformedData)) {
      this.errors.push('\'PipelineTransformedData\' must be an object')
      return false
    }

    if (!validators.hasProperty(pipelineTransformedData, 'pipelineId')) {
      this.errors.push('\'datasourceId\' property is missing')
    } else if (!validators.isNumber(pipelineTransformedData.pipelineId)) {
      this.errors.push('\'pipelineId\' property must be a number')
    }

    if (!validators.hasProperty(pipelineTransformedData, 'healthStatus')) {
      this.errors.push('\'metadata.displayName\' property is missing')
    } else if (!validators.isString(pipelineTransformedData.healthStatus)) {
      this.errors.push('\'metadata.displayName\' property must be a string')
    }

    if (!validators.hasProperty(pipelineTransformedData, 'data')) {
      this.errors.push('\'data\' property is missing')
    }
    /* else if (!validators.isObject(pipelineTransformedData.data)) {
    this.errors.push('\'data\' property must be a object')
    } */

    if (validators.hasProperty(pipelineTransformedData, 'schema')) {
      if (!validators.isObject(pipelineTransformedData.schema)) {
        this.errors.push('\'schema\' property must be a object')
      }
    }

    return this.errors.length === 0
  }

  getErrors (): string[] {
    return this.errors
  }
}

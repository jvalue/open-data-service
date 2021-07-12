import { validators } from '@jvalue/node-dry-basics'

export interface PipelineConfig {
  id: number
  datasourceId: number
  transformation: TransformationConfig
  metadata: Metadata
  schema?: object
}

export interface TransformationConfig {
  func: string
}

export interface Metadata {
  author: string
  displayName: string
  license: string
  description: string
  creationTimestamp: Date
}

/**
 * PipelineConfig data transfer object that clients must use when creating or updating a PipelineConfig
 */
export interface PipelineConfigDTO {
  datasourceId: number
  transformation: TransformationConfig
  metadata: MetadataDTO
  schema?: object
}

export interface MetadataDTO {
  author: string
  displayName: string
  license: string
  description: string
}

export class PipelineConfigDTOValidator {
  private errors: string[] = []

  validate (pipelineConfig: unknown): pipelineConfig is PipelineConfigDTO {
    this.errors = []
    if (!validators.isObject(pipelineConfig)) {
      this.errors.push('\'PipelineConfig\' must be an object')
      return false
    }

    if (!validators.hasProperty(pipelineConfig, 'datasourceId')) {
      this.errors.push('\'datasourceId\' property is missing')
    } else if (!validators.isNumber(pipelineConfig.datasourceId)) {
      this.errors.push('\'datasourceId\' property must be a number')
    }

    if (!validators.hasProperty(pipelineConfig, 'transformation')) {
      // Missing transformation is not an error, assume identity transformation
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (pipelineConfig as PipelineConfigDTO).transformation = { func: 'return data;' }
    } else if (!validators.isObject(pipelineConfig.transformation)) {
      this.errors.push('\'transformation\' property must be an object')
    } else {
      if (!validators.hasProperty(pipelineConfig.transformation, 'func')) {
        this.errors.push('\'transformation.func\' property is missing')
      } else if (!validators.isString(pipelineConfig.transformation.func)) {
        this.errors.push('\'transformation.func\' property must be a string')
      }
    }

    if (!validators.hasProperty(pipelineConfig, 'metadata')) {
      this.errors.push('\'metadata\' property is missing')
    } else if (!validators.isObject(pipelineConfig.metadata)) {
      this.errors.push('\'metadata\' property must be an object')
    } else {
      if (!validators.hasProperty(pipelineConfig.metadata, 'author')) {
        this.errors.push('\'metadata.author\' property is missing')
      } else if (!validators.isString(pipelineConfig.metadata.author)) {
        this.errors.push('\'metadata.author\' property must be a string')
      }

      if (!validators.hasProperty(pipelineConfig.metadata, 'displayName')) {
        this.errors.push('\'metadata.displayName\' property is missing')
      } else if (!validators.isString(pipelineConfig.metadata.displayName)) {
        this.errors.push('\'metadata.displayName\' property must be a string')
      }

      if (!validators.hasProperty(pipelineConfig.metadata, 'license')) {
        this.errors.push('\'metadata.license\' property is missing')
      } else if (!validators.isString(pipelineConfig.metadata.license)) {
        this.errors.push('\'metadata.license\' property must be a string')
      }

      if (!validators.hasProperty(pipelineConfig.metadata, 'description')) {
        this.errors.push('\'metadata.description\' property is missing')
      } else if (!validators.isString(pipelineConfig.metadata.description)) {
        this.errors.push('\'metadata.description\' property must be a string')
      }
    }

    return this.errors.length === 0
  }

  getErrors (): string[] {
    return this.errors
  }
}

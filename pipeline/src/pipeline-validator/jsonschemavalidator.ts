import Ajv from 'ajv'
import { PipelineConfig } from 'src/pipeline-config/model/pipelineConfig'
import { PipelineTransformedDataDTO } from 'src/pipeline-config/model/pipelineTransformedData'
import Validator from './validator'

export default class JsonSchemaValidator implements Validator {
  validate (config: PipelineConfig, data: unknown): PipelineTransformedDataDTO {
    let validate: any
    let valid: boolean = true

    const transformedData: PipelineTransformedDataDTO = {
      pipelineId: config.id,
      healthStatus: 'OK',
      data: data as object
    }

    const ajv = new Ajv({ strict: false })
    if (config.schema !== undefined || config.schema !== null) {
      validate = ajv.compile(config.schema as object)
      valid = validate(data)

      const result = {
        ...transformedData,
        healthStatus: valid ? transformedData.healthStatus : 'WARNING',
        schema: config.schema
      }

      return result
    }

    return transformedData
  }
}

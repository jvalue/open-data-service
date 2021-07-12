import { PipelineConfig } from 'src/pipeline-config/model/pipelineConfig'
import { PipelineTransformedDataDTO } from 'src/pipeline-config/model/pipelineTransformedData'

export default interface Validator {
  validate: (config: PipelineConfig, data: unknown) => PipelineTransformedDataDTO
}

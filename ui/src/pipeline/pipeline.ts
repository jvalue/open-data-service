export default interface Pipeline {
  id: number
  datasourceId: number
  metadata: PipelineMetaData
  transformation: TransformationConfig
  schema: object
}

export interface PipelineMetaData {
  displayName: string
  description: string
  author: string
  license: string
}

export interface TransformationConfig {
  func: string
}

export interface TransformedDataMetaData {
  id: number
  healthStatus: HealthStatus
  timestamp: string
}

export enum HealthStatus {
  OK = 'OK',
  WARINING = 'WARNING',
  FAILED = 'FAILED'
}

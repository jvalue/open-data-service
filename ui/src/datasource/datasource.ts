export default interface Datasource {
  id: number
  format: {
    type: string
    parameters: object
  }
  protocol: {
    type: string
    parameters: object
  }
  schema?: object
  metadata: DatasourceMetaData
  trigger: Trigger
}

export interface DataimportMetaData {
  id: number
  health: HealthStatus
  timestamp: string
}

export interface DatasourceMetaData {
  displayName: string
  description: string
  author: string
  license: string
}

export interface Trigger {
  periodic: boolean
  interval: number
  firstExecution: Date
}

export interface DataLocation {
  id: number
  location: string
}

export type Data = object

export enum HealthStatus {
  OK = 'OK',
  WARINING = 'WARNING',
  FAILED = 'FAILED'
}

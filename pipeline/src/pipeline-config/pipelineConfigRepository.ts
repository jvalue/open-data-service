import { ClientBase, QueryResult } from 'pg'

import { POSTGRES_SCHEMA } from '../env'
import { PipelineConfig, PipelineConfigDTO } from './model/pipelineConfig'

const CONFIG_TABLE_NAME = 'PipelineConfigs'

const CREATE_CONFIG_TABLE_STATEMENT = `
  CREATE TABLE IF NOT EXISTS "${POSTGRES_SCHEMA}"."${CONFIG_TABLE_NAME}" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "datasourceId" bigint NOT NULL,
  "func" varchar NOT NULL,
  "schema" jsonb,
  "author" varchar,
  "displayName" varchar NOT NULL,
  "license" varchar,
  "description" varchar,
  "createdAt" timestamp,
  CONSTRAINT "Data_pk_${POSTGRES_SCHEMA}_${CONFIG_TABLE_NAME}" PRIMARY KEY (id)
)`
const INSERT_CONFIG_STATEMENT = `
  INSERT INTO "${POSTGRES_SCHEMA}"."${CONFIG_TABLE_NAME}"
  ("datasourceId", "func", "author", "displayName", "license", "description", "createdAt", "schema")
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  RETURNING *`
const UPDATE_CONFIG_STATEMENT = `
  UPDATE "${POSTGRES_SCHEMA}"."${CONFIG_TABLE_NAME}"
  SET "datasourceId"=$2, "func"=$3, "author"=$4, "displayName"=$5, "license"=$6, "description"=$7, "schema"=$8
  WHERE id=$1`
const GET_CONFIG_STATEMENT = `
  SELECT * FROM "${POSTGRES_SCHEMA}"."${CONFIG_TABLE_NAME}" WHERE "id" = $1`
const GET_ALL_CONFIGS_STATEMENT = `
  SELECT * FROM "${POSTGRES_SCHEMA}"."${CONFIG_TABLE_NAME}"`
const GET_ALL_CONFIGS_BY_DATASOURCE_ID_STATEMENT = `
  SELECT * FROM "${POSTGRES_SCHEMA}"."${CONFIG_TABLE_NAME}" WHERE "datasourceId" = $1`
const DELETE_CONFIG_STATEMENT = `
  DELETE FROM "${POSTGRES_SCHEMA}"."${CONFIG_TABLE_NAME}" WHERE "id" = $1 RETURNING *`
const DELETE_ALL_CONFIGS_STATEMENT = `
  DELETE FROM "${POSTGRES_SCHEMA}"."${CONFIG_TABLE_NAME}" RETURNING *`

interface DatabasePipeline {
  id: string
  datasourceId: string
  func: string
  author: string
  displayName: string
  license: string
  description: string
  createdAt: Date
  schema: object
}

export async function createPipelineConfigTable (client: ClientBase): Promise<void> {
  await client.query(CREATE_CONFIG_TABLE_STATEMENT)
}

export async function create (client: ClientBase, config: PipelineConfigDTO): Promise<PipelineConfig> {
  const values = [
    config.datasourceId,
    config.transformation.func,
    config.metadata.author,
    config.metadata.displayName,
    config.metadata.license,
    config.metadata.description,
    new Date(),
    config.schema
  ]
  const { rows } = await client.query(INSERT_CONFIG_STATEMENT, values)
  return toPipelineConfig(rows[0])
}

export async function get (client: ClientBase, id: number): Promise<PipelineConfig | undefined> {
  const resultSet = await client.query(GET_CONFIG_STATEMENT, [id])
  if (resultSet.rowCount === 0) {
    return undefined
  }
  const content = toPipelineConfigs(resultSet)
  return content[0]
}

export async function getAll (client: ClientBase): Promise<PipelineConfig[]> {
  const resultSet = await client.query(GET_ALL_CONFIGS_STATEMENT, [])
  return toPipelineConfigs(resultSet)
}

export async function getByDatasourceId (client: ClientBase, datasourceId: number): Promise<PipelineConfig[]> {
  const resultSet = await client.query(GET_ALL_CONFIGS_BY_DATASOURCE_ID_STATEMENT, [datasourceId])
  return toPipelineConfigs(resultSet)
}

export async function update (client: ClientBase, id: number, config: PipelineConfigDTO): Promise<void> {
  const values = [
    id,
    config.datasourceId,
    config.transformation.func,
    config.metadata.author,
    config.metadata.displayName,
    config.metadata.license,
    config.metadata.description,
    config.schema
  ]
  const result = await client.query(UPDATE_CONFIG_STATEMENT, values)
  if (result.rowCount === 0) {
    throw new Error(`Could not find config with ${id} to update`)
  }
}

export async function deleteById (client: ClientBase, id: number): Promise<PipelineConfig> {
  const result = await client.query(DELETE_CONFIG_STATEMENT, [id])
  if (result.rowCount === 0) {
    throw new Error(`Could not find config with ${id} to delete`)
  }
  const content = toPipelineConfigs(result)
  return content[0]
}

export async function deleteAll (client: ClientBase): Promise<PipelineConfig[]> {
  const result = await client.query(DELETE_ALL_CONFIGS_STATEMENT, [])
  return toPipelineConfigs(result)
}

function toPipelineConfig (dbResult: DatabasePipeline): PipelineConfig {
  return {
    id: +dbResult.id,
    datasourceId: +dbResult.datasourceId,
    schema: dbResult.schema,
    transformation: {
      func: dbResult.func
    },
    metadata: {
      author: dbResult.author,
      displayName: dbResult.displayName,
      license: dbResult.license,
      description: dbResult.description,
      creationTimestamp: dbResult.createdAt
    }
  }
}

function toPipelineConfigs (resultSet: QueryResult<DatabasePipeline>): PipelineConfig[] {
  const configs: PipelineConfig[] = []
  for (const row of resultSet.rows) {
    const config = toPipelineConfig(row)
    configs.push(config)
  }
  return configs
}

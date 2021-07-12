import { ClientBase, QueryResult } from 'pg'

import { POSTGRES_SCHEMA } from '../env'
import { PipelineTransformedData, PipelineTransformedDataDTO } from './model/pipelineTransformedData'

const TRANSFORMED_DATA_TABLE_NAME = 'transformedData'

const CREATE_TRANSFORMED_DATA_TABLE_STATEMENT = `
CREATE TABLE IF NOT EXISTS "${POSTGRES_SCHEMA}"."${TRANSFORMED_DATA_TABLE_NAME}"(
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "pipelineId" bigint NOT NULL,
  "healthStatus" varchar NOT NULL,
  "data" jsonb NOT NULL,
  "schema" jsonb,
  "createdAt" timestamp
);
`
const INSERT_TRANSFORMED_DATA_STATEMENT = `
INSERT INTO "${POSTGRES_SCHEMA}"."${TRANSFORMED_DATA_TABLE_NAME}"
  ("pipelineId", "healthStatus", "data", "schema", "createdAt")
  VALUES ($1, $2, $3, $4, $5)
  RETURNING *
`
const UPDATE_TRANDFORMED_DATA_STATEMENT = `
UPDATE "${POSTGRES_SCHEMA}"."${TRANSFORMED_DATA_TABLE_NAME}"
  SET "pipelineId"=$2, "healthStatus"=$3, "data"=$4, "schema"=$5
  WHERE "id"=$1
`

const GET_TRANSFORMED_DATA_STATEMENT = `
  SELECT * FROM "${POSTGRES_SCHEMA}"."${TRANSFORMED_DATA_TABLE_NAME}" WHERE "id" = $1`
const GET_ALL_TRANSFORMED_DATAS_STATEMENT = `
  SELECT * FROM "${POSTGRES_SCHEMA}"."${TRANSFORMED_DATA_TABLE_NAME}"`
const GET_ALL_TRANSFORMED_DATAS_BY_PIPELINE_ID_STATEMENT = `
  SELECT * FROM "${POSTGRES_SCHEMA}"."${TRANSFORMED_DATA_TABLE_NAME}" WHERE "pipelineId" = $1`
const GET_LATEST_TRANSFORMED_DATA_BY_PIPELINE_ID_STATEMENT = `
  SELECT * FROM "${POSTGRES_SCHEMA}"."${TRANSFORMED_DATA_TABLE_NAME}" 
  WHERE "pipelineId" = $1
  ORDER BY "createdAt"
  DESC LIMIT 1`
const DELETE_TRANSFORMED_DATA_STATEMENT = `
  DELETE FROM "${POSTGRES_SCHEMA}"."${TRANSFORMED_DATA_TABLE_NAME}" WHERE "id" = $1 RETURNING *`
const DELETE_ALL_TRANSFORMED_DATAS_STATEMENT = `
  DELETE FROM "${POSTGRES_SCHEMA}"."${TRANSFORMED_DATA_TABLE_NAME}" RETURNING *`

interface DatabaseTransformedData {
  id: string
  pipelineId: string
  healthStatus: string
  data: unknown
  schema: object
  createdAt?: string
}

export async function createPipelineTransormDataTable (client: ClientBase): Promise<void> {
  await client.query(CREATE_TRANSFORMED_DATA_TABLE_STATEMENT)
}

export async function insertTransformedData (
  client: ClientBase,
  transformedData: PipelineTransformedDataDTO
): Promise<PipelineTransformedData> {
  const data = Array.isArray(transformedData.data) ? JSON.stringify(transformedData.data) : transformedData.data
  const values = [
    transformedData.pipelineId,
    transformedData.healthStatus,
    data,
    transformedData.schema,
    new Date()
  ]
  const { rows } = await client.query(INSERT_TRANSFORMED_DATA_STATEMENT, values)
  return toPipelineTransformedData(rows[0])
}

export async function get (client: ClientBase, id: number): Promise<PipelineTransformedData | undefined> {
  const resultSet = await client.query(GET_TRANSFORMED_DATA_STATEMENT, [id])
  if (resultSet.rowCount === 0) {
    return undefined
  }
  const content = toPipelineTransformedDatas(resultSet)
  return content[0]
}

export async function getAll (client: ClientBase): Promise<PipelineTransformedData[]> {
  const resultSet = await client.query(GET_ALL_TRANSFORMED_DATAS_STATEMENT, [])
  return toPipelineTransformedDatas(resultSet)
}

export async function getLatest (client: ClientBase, pipelineId: number): Promise<PipelineTransformedData | undefined> {
  const resultSet = await client.query(GET_LATEST_TRANSFORMED_DATA_BY_PIPELINE_ID_STATEMENT, [pipelineId])
  if (resultSet.rowCount === 0) {
    return undefined
  }
  const content = toPipelineTransformedDatas(resultSet)
  return content[0]
}

export async function getByPipelineId (client: ClientBase, pipelineId: number): Promise<PipelineTransformedData[]> {
  const resultSet = await client.query(GET_ALL_TRANSFORMED_DATAS_BY_PIPELINE_ID_STATEMENT, [pipelineId])
  return toPipelineTransformedDatas(resultSet)
}

export async function update (
  client: ClientBase,
  id: number,
  TRANSFORMED_DATA: PipelineTransformedDataDTO
): Promise<void> {
  const values = [
    id,
    TRANSFORMED_DATA.pipelineId,
    TRANSFORMED_DATA.healthStatus,
    TRANSFORMED_DATA.data,
    TRANSFORMED_DATA.schema
  ]
  const result = await client.query(UPDATE_TRANDFORMED_DATA_STATEMENT, values)
  if (result.rowCount === 0) {
    throw new Error(`Could not find TRANSFORMED_DATA with ${id} to update`)
  }
}

export async function deleteById (client: ClientBase, id: number): Promise<PipelineTransformedData> {
  const result = await client.query(DELETE_TRANSFORMED_DATA_STATEMENT, [id])
  if (result.rowCount === 0) {
    throw new Error(`Could not find TRANSFORMED_DATA with ${id} to delete`)
  }
  const content = toPipelineTransformedDatas(result)
  return content[0]
}

export async function deleteAll (client: ClientBase): Promise<PipelineTransformedData[]> {
  const result = await client.query(DELETE_ALL_TRANSFORMED_DATAS_STATEMENT, [])
  return toPipelineTransformedDatas(result)
}

function toPipelineTransformedData (dbResult: DatabaseTransformedData): PipelineTransformedData {
  return {
    id: +dbResult.id,
    pipelineId: +dbResult.pipelineId,
    healthStatus: dbResult.healthStatus,
    data: dbResult.data,
    schema: dbResult.schema,
    createdAt: dbResult.createdAt
  }
}

function toPipelineTransformedDatas (resultSet: QueryResult<DatabaseTransformedData>): PipelineTransformedData[] {
  const transformedDates: PipelineTransformedData[] = []
  for (const row of resultSet.rows) {
    const transformedData = toPipelineTransformedData(row)
    transformedDates.push(transformedData)
  }
  return transformedDates
}

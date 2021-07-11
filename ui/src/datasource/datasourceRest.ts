import axios, { AxiosResponse } from 'axios'
import Datasource, { Data, DataLocation, DataimportMetaData } from './datasource'
import { ADAPTER_SERVICE_URL } from '@/env'

/**
 * Axios instance with default headers and base url.
 * The option transformResponse is set to an empty array
 * because of explicit JSON.parser call with custom reviver.
 */
const http = axios.create({
  baseURL: ADAPTER_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' },
  transformResponse: []
})

/**
 * This reviver function replaces firstExecution attribute with a date object
 * if the current type is string.
 */
const reviver = (key: string, value: unknown): unknown => {
  if (key === 'firstExecution' && typeof value === 'string') {
    return new Date(value)
  }

  return value
}

export async function getAllDatasources (): Promise<Datasource[]> {
  const response = await http.get('/datasources')
  return JSON.parse(response.data, reviver)
}

export async function getDatasourceById (id: number): Promise<Datasource> {
  const response = await http.get(`/datasources/${id}`)
  return JSON.parse(response.data, reviver)
}

export async function createDatasource (datasource: Datasource): Promise<Datasource> {
  const { id, ...creationDTO } = datasource
  const response = await http.post('/datasources', JSON.stringify(creationDTO))
  return JSON.parse(response.data, reviver)
}

export async function updateDatasource (datasource: Datasource): Promise<AxiosResponse> {
  return await http.put(`/datasources/${datasource.id}`, JSON.stringify(datasource))
}

export async function deleteDatasource (id: number): Promise<AxiosResponse> {
  return await http.delete(`/datasources/${id}`)
}

export async function getDatasourceData (id: number): Promise<Data> {
  const importResponse = await http.post<string>(`/datasources/${id}/trigger`)
  const jsonResponse: DataLocation = JSON.parse(importResponse.data)
  const location = jsonResponse.location
  const dataResponse = await http.get<string>(location)
  return JSON.parse(dataResponse.data)
}

export async function getLatestDataimport (id: number): Promise<DataimportMetaData> {
  const importResponse = await http.get<string>(`/datasources/${id}/imports/latest`)
  const jsonResponse: DataimportMetaData = JSON.parse(importResponse.data)
  return jsonResponse
}

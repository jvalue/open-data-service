import axios from 'axios'
import { TransformedDataMetaData } from './pipeline'
import { PIPELINE_SERVICE_URL } from '@/env'

/**
 * Axios instances with default headers and base url.
 * The option transformResponse is set to an empty array
 * because of explicit JSON.parser call with custom reviver.
 */

const http = axios.create({
  baseURL: `${PIPELINE_SERVICE_URL}/transdata`,
  headers: { 'Content-Type': 'application/json' },
  transformResponse: []
})

export async function getLatestTransformedData (id: number): Promise<TransformedDataMetaData> {
  const importResponse = await http.get<string>(`/${id}/transforms/latest`)
  const jsonResponse: TransformedDataMetaData = JSON.parse(importResponse.data)
  return jsonResponse
}

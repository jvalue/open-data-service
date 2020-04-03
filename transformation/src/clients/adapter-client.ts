import axios from 'axios'

const ADAPTER_SERVICE_URL = process.env.ADAPTER_SERVICE_URL || 'http://localhost:8082'

const http = axios.create({
  baseURL: ADAPTER_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
})

export async function fetchImportedData (location: string): Promise<object> {
  const response = await http.get(location)
  return response.data
}
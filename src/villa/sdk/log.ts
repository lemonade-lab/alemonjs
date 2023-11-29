import { type AxiosResponse } from 'axios'
export function ApiLog(res: AxiosResponse) {
  if (process.env?.VILLA_API_REQUEST == 'dev')
    console.log('api-config', res?.request)
  if (process.env?.VILLA_API_HEADERS == 'dev')
    console.log('api-config', res?.headers)
  if (process.env?.VILLA_API_CONFIG == 'dev')
    console.log('api-config', res?.config)
  if (process.env?.VILLA_API_DATA == 'dev') console.log('api-data', res?.data)
  return res?.data
}

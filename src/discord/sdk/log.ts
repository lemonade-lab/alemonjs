import { type AxiosResponse } from 'axios'
export function ApiLog(res: AxiosResponse) {
  if (process.env?.DISCORD_API_REQUEST == 'dev')
    console.info('api-config', res?.request)
  if (process.env?.DISCORD_API_HEADERS == 'dev')
    console.info('api-config', res?.headers)
  if (process.env?.DISCORD_API_CONFIG == 'dev')
    console.info('api-config', res?.config)
  if (process.env?.DISCORD_API_DATA == 'dev')
    console.info('api-data', res?.data)
  return res?.data
}

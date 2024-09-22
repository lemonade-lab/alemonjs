import { type AxiosResponse } from 'axios'
import { loger } from '../../../log.js'
export function ApiLog(res: AxiosResponse) {
  if (process.env?.DISCORD_API_REQUEST == 'dev')
    loger.info('api-config', res?.request)
  if (process.env?.DISCORD_API_HEADERS == 'dev')
    loger.info('api-config', res?.headers)
  if (process.env?.DISCORD_API_CONFIG == 'dev')
    loger.info('api-config', res?.config)
  if (process.env?.DISCORD_API_DATA == 'dev') loger.info('api-data', res?.data)
  return res?.data
}

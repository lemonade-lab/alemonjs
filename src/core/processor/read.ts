import { loger } from '../../log.js'
import { loadError } from './log.js'
export async function readScript(path: string) {
  return await import(`file://${path}`).catch(err => {
    loger.error(`file://${path}`)
    loadError('local dev', err)
  })
}

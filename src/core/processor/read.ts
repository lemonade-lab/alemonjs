import { loadError } from './log.js'
export async function readScript(path: string) {
  return await import(`file://${path}`).catch(err => {
    console.error(`file://${path}`)
    loadError('local dev', err)
  })
}

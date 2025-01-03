import { mkdirSync } from 'fs'
import { join } from 'path'
const dir = join(process.cwd(), 'public', 'config')
const messageDir = join(process.cwd(), 'public', 'message')
mkdirSync(dir, { recursive: true })
mkdirSync(messageDir, { recursive: true })

/**
 * channel.json
 */
export const channelDir = join(dir, 'channel')

/**
 * private.json
 */
export const privateDir = join(dir, 'private')

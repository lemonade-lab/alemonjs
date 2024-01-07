import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getAppPath } from '../core/index.js'
export const cache = readFileSync(
  join(getAppPath(import.meta.url), '../../resources/index.html'),
  'utf-8'
)

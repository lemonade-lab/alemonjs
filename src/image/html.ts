import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getAppPath } from '../core/index.js'
class cache {
  val: string = null
  get() {
    if (this.val == null) {
      return readFileSync(
        join(getAppPath(import.meta.url), '../../resources/index.html'),
        'utf-8'
      )
    }
    return this.val
  }
}
export const Cache = new cache()

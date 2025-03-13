#!/usr/bin/env node

import { readFileSync } from 'fs'
import { join } from 'path'

/**
 *
 * @param {*} dir
 */
export const start = () => {
  // 读取配置文件
  const dir = join(process.cwd(), 'package.json')
  const start = readFileSync(dir, 'utf-8')
  const { main } = JSON.parse(start) ?? {}
  import('../lib/index.js').then(res => {
    res.start(main)
  })
}

#!/usr/bin/env node
import { spawnSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'node:url'
const args = [...process.argv.slice(2)]
const currentFilePath = fileURLToPath(import.meta.url)
const currentDirPath = dirname(currentFilePath)
const js = join(currentDirPath, '../lib/index.js')
// 启动模式
if (args.includes('start')) {
  const msg = spawnSync('node', [js, ...args], { stdio: 'inherit' })
  if (msg.error) {
    console.error(msg.error)
    process.exit(1)
  }
} else {
  // 开发和构建模式
  const msg = spawnSync('npx', ['tsx', js, ...args], { stdio: 'inherit' })
  if (msg.error) {
    console.error(msg.error)
    process.exit(1)
  }
}

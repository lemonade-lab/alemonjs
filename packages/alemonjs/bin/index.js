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
  const argsx = args.filter(arg => arg !== 'start')
  const msg = spawnSync('node', [js, '--start', ...argsx], { stdio: 'inherit' })
  if (msg.error) {
    console.error(msg.error)
    process.exit()
  }
} else if (args.includes('build')) {
  const argsx = args.filter(arg => arg !== 'build')
  const msg = spawnSync('npx', ['tsx', js, '--build', ...argsx], {
    stdio: 'inherit'
  })
  if (msg.error) {
    console.error(msg.error)
    process.exit()
  }
} else if (args.includes('dev')) {
  const argsx = args.filter(arg => arg !== 'dev')
  const msg = spawnSync('npx', ['tsx', 'watch', '--clear-screen=false', js, '--dev', ...argsx], {
    stdio: 'inherit'
  })
  if (msg.error) {
    console.error(msg.error)
    process.exit()
  }
}

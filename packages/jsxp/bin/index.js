#!/usr/bin/env node
import { spawn } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'node:url'
const args = [...process.argv.slice(2)]
const currentFilePath = fileURLToPath(import.meta.url)
const currentDirPath = dirname(currentFilePath)
const js = join(currentDirPath, '../lib/index.js')
// 启动模式
if (args.includes('dev')) {
  let argsx = args.filter(arg => arg !== 'dev')
  const loader = args[args.indexOf('--node-options') + 1]
  if (loader) {
    const msg = spawn(
      'npx',
      ['tsx', 'watch', '--clear-screen=false', js, '--jsxp-server', ...argsx],
      {
        stdio: 'inherit',
        env: Object.assign({}, process.env, {
          NODE_OPTIONS: `--loader ${loader} --no-warnings`
        })
      }
    )
    if (msg.error) {
      console.error(msg.error)
      process.exit()
    }
  } else {
    const msg = spawn(
      'npx',
      ['tsx', 'watch', '--clear-screen=false', js, '--jsxp-server', ...argsx],
      {
        stdio: 'inherit'
      }
    )
    if (msg.error) {
      console.error(msg.error)
      process.exit()
    }
  }
}

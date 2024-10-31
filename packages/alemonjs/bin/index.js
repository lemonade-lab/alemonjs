#!/usr/bin/env node
import { spawn } from 'child_process'
import { join, dirname, relative } from 'path'
import { fileURLToPath } from 'node:url'
const args = [...process.argv.slice(2)]
const currentFilePath = fileURLToPath(import.meta.url)
const currentDirPath = dirname(currentFilePath)
const pkgFilr = join(currentDirPath, '../package.json')
// 启动模式
if (args.includes('start')) {
  // main 使用参数启动
  const jsFile = join(currentDirPath, '../lib/index.js')
  const jsdir = relative(process.cwd(), jsFile)
  const argsx = args.filter(arg => arg !== 'start')
  const msg = spawn('node', [jsdir, '--alemonjs-start', ...argsx], {
    stdio: 'inherit',
    env: Object.assign({}, process.env, {
      PKG_DIR: pkgFilr
    }),
    shell: process.platform === 'win32'
  })
  if (msg.error) {
    console.error(msg.error)
    process.exit()
  }
}

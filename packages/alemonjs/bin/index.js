#!/usr/bin/env node
import { spawnSync } from 'child_process'
import { join, dirname, relative } from 'path'
import { fileURLToPath } from 'node:url'
const args = [...process.argv.slice(2)]
const currentFilePath = fileURLToPath(import.meta.url)
const currentDirPath = dirname(currentFilePath)
// 启动模式
if (args.includes('start')) {
  const jsFile = join(currentDirPath, '../index.js')
  const jsdir = relative(process.cwd(), jsFile)
  const argsx = args.filter(arg => arg !== 'start')
  const msg = spawnSync('node', [jsdir, '--alemonjs-start', ...argsx], {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })
  if (msg.error) {
    console.error(msg.error)
    process.exit()
  }
} else if (args.includes('build')) {
  const jsFile = join(currentDirPath, '../index.js')
  const jsdir = relative(process.cwd(), jsFile)
  const argsx = args.filter(arg => arg !== 'build')
  const msg = spawnSync('npx', ['tsx', jsdir, '--alemonjs-build', ...argsx], {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })
  if (msg.error) {
    console.error(msg.error)
    process.exit()
  }
} else if (args.includes('dev')) {
  const jsFile = join(currentDirPath, '../index.js')
  const jsdir = relative(process.cwd(), jsFile)
  console.log('jsdir', jsdir)
  const argsx = args.filter(arg => arg !== 'dev')
  const msg = spawnSync(
    'npx',
    ['tsx', 'watch', '--clear-screen=false', jsdir, '--alemonjs-dev', ...argsx],
    {
      stdio: 'inherit',
      shell: process.platform === 'win32'
    }
  )
  if (msg.error) {
    console.error(msg.error)
    process.exit()
  }
}

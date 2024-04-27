#!/usr/bin/env node
import { spawn } from 'child_process'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
const argv = [...process.argv.splice(2)]
const currentFilePath = fileURLToPath(import.meta.url)
const currentDirPath = dirname(currentFilePath)
const cwd = resolve(currentDirPath)
const app = join(cwd, '../dist/run.js')
const argvs = argv.join(' ').replace(/(\S+\.js|\S+\.ts)/g, '')
/**
 * ***************
 * 启动内部运行脚本
 * ***************
 */
const child = spawn(`npx ts-node ${app}`, argvs.split(' '), {
  shell: true,
  stdio: 'inherit'
})
/**
 * *************
 * exit
 * *************
 */
process.on('SIGINT', () => {
  if (child.pid) process.kill(child.pid)
  if (process.pid) process.exit()
})

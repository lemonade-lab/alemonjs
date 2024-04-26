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
spawn(`npx ts-node ${app} ${argvs}`, {
  shell: true,
  stdio: 'inherit'
})

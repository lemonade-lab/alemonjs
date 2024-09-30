#!/usr/bin/env node
import { spawnSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'node:url'
const args = [...process.argv.slice(2)]
const currentFilePath = fileURLToPath(import.meta.url)
const currentDirPath = dirname(currentFilePath)
const js = join(currentDirPath, '../lib/index.js')
const msg = spawnSync('npx', ['tsx', js, ...args], { stdio: 'inherit' })
if (msg.error) {
  console.error(msg.error)
  process.exit(1)
}

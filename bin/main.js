#!/usr/bin/env node

import { spawn } from 'child_process'
const ars = process.argv.slice(2)
const msg = ars.join(' ')

const files = msg.match(/(\S+\.js|\S+\.ts)/g) ?? ['alemon.config.ts']

const argsWithoutFiles = msg.replace(/(\S+\.js|\S+\.ts)/g, '')

for (const item of files) {
  // 判断是  js还是ts文件
  const isTypeScript = item.endsWith('.ts')

  const command = isTypeScript ? 'npx ts-node' : 'node'

  const cmd = `${command} ${item} ${argsWithoutFiles}`

  console.log('[alemonjs]', cmd)

  const childProcess = spawn(cmd, { shell: true })

  childProcess.stdout.on('data', data => {
    process.stdout.write(data.toString())
  })

  childProcess.stderr.on('data', data => {
    process.stderr.write(data.toString())
  })
}

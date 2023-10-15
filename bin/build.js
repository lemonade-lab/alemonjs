#!/usr/bin/env node

import { existsSync, mkdirSync } from 'fs'
import { execSync, exec, spawn } from 'child_process'
import { compilationTools } from 'alemon-rollup'
import { join } from 'path'

/**
 * 执行指令
 * @param {*} cess
 * @param {*} cmd
 * @returns
 */
async function command(cess, cmd) {
  // 错误参数
  if (!cmd) process.exit()
  // 锁定位置
  const dirPath = `./`
  // 没有存在
  mkdirSync(dirPath, { recursive: true })
  console.info('\n')
  try {
    // 切换目录
    process.chdir(dirPath)
    console.info(`[command] ${cmd}`)
    if (cess == 'execSync') {
      execSync(cmd, { stdio: 'inherit' })
    } else if (cess == 'exec') {
      exec(cmd)
    }
  } catch (error) {
    console.info(`${error}`)
    return
  }
}

/**
 * 执行脚本
 * @param {*} name
 * @param {*} file
 * @param {*} ars
 */
function nodeScripts(name = 'node', file = '', ars = []) {
  const command = spawn(`${name} ${file} ${ars.join(' ')}`, { shell: true })
  command.stdout.on('data', data => {
    process.stdout.write(data.toString())
  })
  command.stderr.on('data', data => {
    process.stderr.write(data.toString())
  })
}

;(async function run() {
  /**
   * 得到配置
   */
  const ars = process.argv.slice(2)
  const msg = ars.join(' ')
  const files = msg.match(/(\S+\.js|\S+\.ts)/g) ?? ['alemon.build.js']
  /**
   * 判断是文件是否存在
   */
  let Options = {}

  if (existsSync(join(process.cwd(), files[0]))) {
    console.log('[CONFIG]', files[0])
    Options = await import(`../${files[0]}`)
  }

  /**
   * 开始打包
   */
  await compilationTools({
    aInput: Options?.input ?? 'apps/**/*.ts',
    aOutput: Options?.output ?? 'app.alemon.js'
  })

  /**
   * 附加指令
   */
  if (Options?.command) {
    for await (const item of Options.command) {
      if (item?.cmd) {
        await command(item?.cess ?? 'execSync', item?.cmd)
      }
    }
  }

  /**
   * **********
   * 附加脚本
   * **********
   */
  if (Options?.scripts) {
    for await (const item of Options.scripts) {
      const name = item?.name ?? 'node'
      nodeScripts(name, item?.file, item?.ars ?? [])
    }
  }
})()

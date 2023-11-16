import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
/**
 * 指令运行队则
 * @param ars 指令参数数组
 */
export function commandRun(ars: string[]) {
  const msg = ars.join(' ')
  const files = msg.match(/(\S+\.js|\S+\.ts)/g) ?? ['alemon.config.ts']
  const argsWithoutFiles = msg.replace(/(\S+\.js|\S+\.ts)/g, '')
  for (const item of files) {
    if (!existsSync(join(process.cwd(), item))) {
      console.info('no file', item)
      continue
    }
    const isTypeScript = item.endsWith('.ts')
    const command = isTypeScript ? 'ts-node' : 'node'
    const cmd = `${command} ${item} ${argsWithoutFiles}`
    console.info(cmd)
    const childProcess = spawn(cmd, { shell: true })
    childProcess.stdout.on('data', data => {
      process.stdout.write(data.toString())
    })
    childProcess.stderr.on('data', data => {
      process.stderr.write(data.toString())
    })
  }
}
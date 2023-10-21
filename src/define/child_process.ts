import { spawn } from 'child_process'
/**
 * 执行脚本文件
 * @param name node | ts-node
 * @param file 脚本文件
 * @param ars 执行参数
 */
export function nodeScripts(name = 'node', file = '', ars = []) {
  const command = spawn(`${name} ${file} ${ars.join(' ')}`, { shell: true })
  command.stdout.on('data', data => {
    process.stdout.write(data.toString())
  })
  command.stderr.on('data', data => {
    process.stderr.write(data.toString())
  })
}

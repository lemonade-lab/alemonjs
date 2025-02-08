import { ChildProcess, fork } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

// 当前目录
const __dirname = dirname(fileURLToPath(import.meta.url))
const runjsPath = join(__dirname, '../index.js')

/**
 * @description bot 管理
 */

/**
 * bot关闭
 * @returns
 */
export const botClose = () => {
  if (child && child.connected) {
    child.kill()
    return
  }
  return
}

let child: ChildProcess | null = null

/**
 * bot运行
 * 如果已经运行，则发送消息给渲染进程
 * @returns
 */
export const botRun = async (args: string[]) => {
  if (child && child.connected) {
    logger.info('Bot is running')
    return
  }

  const MyJS = join(runjsPath, 'index.js')
  child = fork(MyJS, args, {
    // cwd: runjsPath,
    stdio: 'pipe' // 确保使用管道来捕获输出
  })

  // 监听子进程的标准输出
  child.stdout?.on('data', data => {
    logger.info(`bot output: ${data.toString()}`)
  })

  // 监听子进程的错误输出
  child.stderr?.on('data', data => {
    logger.error(`bot error: ${data.toString()}`)
  })

  // 监听子进程退出
  child.on('exit', code => {
    logger.info(`bot exit ${code}`)
  })
}

/**
 * bot状态
 * @returns
 */
export const botStatus = () => {
  if (child && child.connected) {
    logger.info('Bot is running')
    return true
  }
  return false
}

// 监听主进程退出
// 确保 bot 退出
process.on('exit', () => {
  botClose()
})

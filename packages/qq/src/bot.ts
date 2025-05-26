import { ChildProcess, fork } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { webview } from './desktop.js'

// 当前目录
const __dirname = dirname(fileURLToPath(import.meta.url))
const runjsPath = join(__dirname, '..')

/**
 * @description bot 管理
 */

export const botState: {
  child: ChildProcess
  logged: boolean
  running: Readonly<boolean>
} = {
  child: null,
  logged: false,
  get running() {
    return this.child && this.child?.connected
  }
}

/**
 * bot运行
 * 如果已经运行，则发送消息给渲染进程
 * @returns
 */
export const botRun = (args: string[]): Promise<ChildProcess> => {
  return new Promise(resolve => {
    const MyJS = join(runjsPath, 'index.js')
    botState.child = fork(MyJS, args, {
      // cwd: runjsPath,
      stdio: 'pipe' // 确保使用管道来捕获输出
    })
    // 监听子进程的标准输出
    botState.child.stdout?.on('data', data => {
      console.info(`bot output:`, data.toString())
    })
    // 监听子进程的错误输出
    botState.child.stderr?.on('data', data => {
      console.error(`bot error:`, data.toString())
    })
    // 监听子进程退出
    botState.child.on('exit', code => {
      console.info(`bot exit ${code}`)
    })
    // 监听消息事件
    botState.child.on('message', (msg: { type: string; data: any }) => {
      // 。。。骚操作
      switch (msg.type) {
        case 'process.start':
          resolve(botState.child)
          break
        case 'qq.client':
          global.client = msg.data
          break
        case 'qq.login.qrcode':
        case 'qq.login.qrcode.expired':
        case 'qq.login.slider':
        case 'qq.device.validate':
        case 'qq.smscode.send':
        case 'qq.smscode.received':
        case 'qq.error': {
          webview &&
            webview.postMessage({
              type: msg.type,
              data: msg.data
            })
          break
        }
        case 'qq.system.online': {
          botState.logged = true
          webview &&
            webview.postMessage({
              type: msg.type,
              data: msg.data
            })
          break
        }
        case 'qq.system.offline': {
          botState.logged = false
          webview &&
            webview.postMessage({
              type: msg.type,
              data: msg.data
            })
          break
        }
        default:
      }
    })
  })
}

/**
 * bot关闭
 * @returns
 */
export const botClose = () => {
  if (botState.child && botState.child?.connected) {
    botState.child.kill()
    return
  }
  return
}

// 监听主进程退出
// 确保 bot 退出
process.on('exit', () => {
  botClose()
})

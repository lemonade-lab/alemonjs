import Yaml from 'yaml'
import { readFileSync, existsSync, rmSync, mkdirSync, writeFile, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { getConfigValue, getConfig } from 'alemonjs'
import { stopServer, startServer } from './server.js'
import { getFilesData } from './files.js'
import { botClose, botState, botRun } from './bot.js'

let webview = null

// 当前目录
const __dirname = dirname(fileURLToPath(import.meta.url))
// 被激活的时候。
const activate = context => {
  // 创建一个 webview。
  const webView = context.createSidebarWebView(context)
  // 当命令被触发的时候。
  context.onCommand('open.qq', () => {
    const dir = join(__dirname, '../', 'dist', 'index.html')
    const scriptReg = /<script.*?src="(.+?)".*?>/
    const styleReg = /<link.*?href="(.+?)".*?>/
    // 创建 webview 路径
    const styleUri = context.createExtensionDir(
      join(__dirname, '../', 'dist', 'assets', 'index.css')
    )
    const scriptUri = context.createExtensionDir(
      join(__dirname, '../', 'dist', 'assets', 'index.js')
    )
    // 确保路径存在
    const html = readFileSync(dir, 'utf-8')
      .replace(scriptReg, `<script type="module" crossorigin src="${scriptUri}"></script>`)
      .replace(styleReg, `<link rel="stylesheet" crossorigin href="${styleUri}">`)
    // 立即渲染 webview
    webView.loadWebView(html)
  })
  // 监听 webview 的消息。
  webView.onMessage(data => {
    // console.log(data)
    onMessage(data, webView, context)
  })
}
function saveConfig(cfg, name = 'qq') {
  const cfgInstance = getConfig()
  const value = cfgInstance.value ?? {}
  value[name] = cfg
  //@ts-ignore
  if (cfg.saveValue) {
    //@ts-ignore
    config.saveValue(value)
  } else {
    const cfgPath = join(process.cwd(), 'alemon.config.yaml')
    writeFileSync(cfgPath, Yaml.stringify(value), 'utf-8')
  }
}
async function onMessage(data, webView, context) {
  try {
    switch (data.type) {
      // 初始化配置
      case 'qq.init': {
        let config = getConfigValue()
        if (!config) config = {}
        webView.postMessage({
          type: 'qq.init',
          data: config['qq'] ?? {
            qq: '',
            password: '',
            device: '2',
            sign_api_addr: '',
            ver: '9.0.90',
            master_key: '',
            log_level: 'info',
            ignore_self: true,
            resend: true,
            reconn_interval: 5,
            cache_group_member: true,
            ffmpeg_path: '',
            ffprobe_path: ''
          }
        })
        if (botState.logged) {
          webView.postMessage({
            type: 'qq.online',
            data: true
          })
        }
        if (botState.running) {
          webView.postMessage({
            type: 'qq.running',
            data: true
          })
        }
        break
      }
      // 启动模块
      case 'qq.login': {
        // const status = botStatus();
        // if (status) {
        //     webView.postMessage({
        //         type: 'qq.error',
        //         data: '已经在运行中'
        //     });
        //     return;
        // }
        const qqBot = data.data
        saveConfig({
          qq: qqBot.qq ?? '',
          password: qqBot.password ?? '',
          device: qqBot.device ?? '2',
          sign_api_addr: qqBot.sign_api_addr ?? '',
          ver: qqBot.ver ?? '9.0.90',
          master_key: qqBot.master_key.split(','),
          log_level: qqBot.log_level || 'info',
          ignore_self: qqBot.ignore_self || true,
          resend: qqBot.resend || true,
          reconn_interval: qqBot.reconn_interval || 5,
          cache_group_member: qqBot.cache_group_member || true,
          ffmpeg_path: qqBot.ffmpeg_path || '',
          ffprobe_path: qqBot.ffprobe_path || ''
        })
        startServer()
        botRun(['--login', 'qq']).then(childProcess => {
          childProcess.send({
            type: 'process.webview.open',
            data: true
          })
          webview = webView
        })

        break
      }
      // 保存配置
      case 'qq.form.save': {
        const qqBot = data.data
        saveConfig({
          qq: qqBot.qq ?? '',
          password: qqBot.password ?? '',
          device: qqBot.device ?? '2',
          sign_api_addr: qqBot.sign_api_addr ?? '',
          ver: qqBot.ver ?? '9.0.90',
          master_key: qqBot.master_key.split(','),
          log_level: qqBot.log_level || 'info',
          ignore_self: qqBot.ignore_self || true,
          resend: qqBot.resend || true,
          reconn_interval: qqBot.reconn_interval || 5,
          cache_group_member: qqBot.cache_group_member || true,
          ffmpeg_path: qqBot.ffmpeg_path || '',
          ffprobe_path: qqBot.ffprobe_path || ''
        })
        context.notification('QQ 配置保存成功～')
        break
      }
      case 'qq.files.upload': {
        const icqqDir = join(process.cwd(), 'data', 'icqq')
        if (!existsSync(icqqDir)) mkdirSync(icqqDir)
        const filesPromises = data.data?.map(item => {
          return new Promise((resolve, reject) => {
            writeFile(join(icqqDir, item.name), Buffer.from(item.data, 'base64'), error => {
              if (error) reject(error)
              resolve(true)
            })
          })
        })
        Promise.all(filesPromises)
          .then(() => {
            webView.postMessage({
              type: 'qq.files.upload.success',
              data: data.data
                ?.map((item, index) => `${index + 1}: ${item.name} --${item.size}B`)
                .join('\n')
            })
          })
          .catch(error => {
            webView.postMessage({
              type: 'qq.error',
              data: error.stack ?? error.message
            })
          })
        break
      }
      // 获取删除icqq的数据列表
      case 'qq.files.list.icqq': {
        const icqqDir = join(process.cwd(), 'data', 'icqq')
        if (existsSync(icqqDir)) {
          webView.postMessage({
            type: 'qq.files.delete.list',
            data: await getFilesData(icqqDir)
          })
        } else {
          context.notification('已被删除！')
        }
        break
      }
      // 真正删除
      case 'qq.files.delete.icqq': {
        const icqqDir = join(process.cwd(), 'data', 'icqq')
        if (existsSync(icqqDir)) {
          rmSync(icqqDir, { recursive: true, force: true })
          context.notification('device和token删除成功')
        } else {
          context.notification('已被删除！')
        }
        break
      }
      // 扫码完成
      case 'qq.login.qrcode.scaned': {
        botState?.child?.send({
          type: 'qq.login.qrcode.scaned',
          data: true
        })
        break
      }
      // 接收ticket
      case 'qq.login.ticket': {
        botState?.child?.send({
          type: 'inputTicket',
          data: true
        })
        botState?.child?.send({
          type: 'qq.login.ticket',
          data: data.data?.trim()
        })
        break
      }
      // 设备锁验证选项
      case 'qq.device.validate.choice': {
        botState?.child?.send({
          type: 'qq.login.ticket',
          data: data.data
        })
        break
      }
      // 收到验证码
      case 'qq.smscode': {
        botState?.child?.send({
          type: 'qq.login.ticket',
          data: data.data
        })
        break
      }
      // 登出
      case 'qq.offline': {
        botState?.child?.send({
          type: 'process.webview.close',
          data: true
        })
        webView.postMessage({
          type: 'qq.system.offline',
          data: '[ @AlemonJS/QQ 下线]'
        })
        botClose()
        break
      }
      // 恢复普通模块加载方式
      case 'qq.desktop.unmount': {
        botState?.child?.send({
          type: 'process.webview.close',
          data: true
        })
        console.info('qqDesktopState = false')
        // ticket拦截服务
        stopServer()
        break
      }
      // 退出进程
      case 'qq.process.exit': {
        botClose()
        break
      }
      default:
    }
  } catch (err) {
    webView.postMessage({
      type: 'qq.error',
      data: err.stack ?? err.message
    })
    // 卸载模块
    console.log(err.stack)
  }
}

export { activate, webview }

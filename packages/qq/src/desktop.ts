import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, writeFile } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { getConfig, getConfigValue } from 'alemonjs'
import { startServer, stopServer } from './server'
import { getFilesData } from './files'
import Yaml from 'yaml'
import { botClose, botRun, botStatus } from './bot'

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
    // 登录状态切换到web
    global.qqDesktopStatus = true
    global.webviewAPI = webView
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
async function onMessage(data: { type: string; data: any }, webView, context) {
  try {
    switch (data.type) {
      // 初始化配置
      case 'qq.init': {
        let config = getConfigValue()
        if (!config) config = {}
        webView.postMessage({
          type: 'qq.init',
          data: config['qq'] ?? {}
        })
        if (global.client && global.client?.isOnline) {
          webView.postMessage({
            type: 'qq.online',
            data: global.client?.isOnline
          })
        }
        break
      }

      // 启动模块
      case 'qq.login': {
        const status = botStatus()
        if (status) {
          webView.postMessage({
            type: 'qq.error',
            data: '已经在运行中'
          })
          return
        }

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

        botRun(['--login', 'qq'])

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
        const res = await global.client.queryQrcodeResult()
        // 成功
        if (res.retcode === 0) {
          console.info('\n扫码成功,开始登录...\n')
          global.client.qrcodeLogin()
        } else {
          webView.postMessage({
            type: 'qq.error',
            data: '状态码：' + res.retcode
          })
        }
        break
      }
      // 接收ticket
      case 'qq.login.ticket': {
        global.inputTicket = true
        await global.client.submitSlider(data.data?.trim())
        break
      }
      // 设备锁验证选项
      case 'qq.device.validate.choice': {
        if (data.data?.choice == 0) {
          await global.client.login()
        } else if (data.data?.choice == 1) {
          // 发送短信验证码
          await global.client.sendSmsCode()
          console.info(`验证码已发送：${data.data.phone}\n`)
          webView.postMessage({
            type: 'qq.smscode.send',
            data: data.data?.phone
          })
        }
        break
      }
      // 收到验证码
      case 'qq.smscode': {
        await global.client.submitSmsCode(data.data)
        webView.postMessage({
          type: 'qq.smscode.received',
          data: 'ok'
        })
        break
      }
      // 登出
      case 'qq.offline': {
        global.qqDesktopStatus = false
        global.webviewAPI.postMessage({
          type: 'qq.system.offline',
          data: '[ @AlemonJS/QQ 下线]'
        })
        // unMount('@alemonjs/qq')
        // process.exit()

        botClose()

        break
      }
      // 恢复普通模块加载方式
      case 'qq.desktop.unmount': {
        global.qqDesktopStatus = false
        global.webviewAPI = undefined
        console.info('qqDesktopState = false')
        // ticket拦截服务
        stopServer()
        break
      }
      // 退出进程
      case 'qq.process.exit': {
        // process.exit()
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

export { activate }

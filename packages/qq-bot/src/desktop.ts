import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { getConfig, getConfigValue } from 'alemonjs'
// 当前目录
const __dirname = dirname(fileURLToPath(import.meta.url))
// 被激活的时候。
export const activate = context => {
  // 创建一个 webview。
  const webView = context.createSidebarWebView(context)

  // 当命令被触发的时候。
  context.onCommand('open.qq-bot', () => {
    const dir = join(__dirname, '../', 'dist', 'index.html')
    const scriptReg = /<script.*?src="(.+?)".*?>/
    const styleReg = /<link.*?rel="stylesheet".*?href="(.+?)".*?>/
    const iconReg = /<link.*?rel="icon".*?href="(.+?)".*?>/g
    // 创建 webview 路径
    const styleUri = context.createExtensionDir(
      join(__dirname, '../', 'dist', 'assets', 'index.css')
    )
    const scriptUri = context.createExtensionDir(
      join(__dirname, '../', 'dist', 'assets', 'index.js')
    )
    // 确保路径存在
    const html = readFileSync(dir, 'utf-8')
      .replace(iconReg, ``)
      .replace(scriptReg, `<script type="module" crossorigin src="${scriptUri}"></script>`)
      .replace(styleReg, `<link rel="stylesheet" crossorigin href="${styleUri}">`)
    // 立即渲染 webview
    webView.loadWebView(html)
  })

  // 监听 webview 的消息。
  webView.onMessage(data => {
    try {
      if (data.type === 'qq-bot.form.save') {
        const qqBot = data.data
        const config = getConfig()
        const value = config.value ?? {}
        value['qq-bot'] = {
          app_id: qqBot.app_id ?? '',
          token: qqBot.token ?? '',
          secret: qqBot.secret ?? '',
          // master_key 12121,1313,1313,13 转为数组
          master_key: qqBot.master_key.split(','),
          route: qqBot.route ?? '/webhook',
          port: qqBot.port ?? 17157,
          ws: qqBot.ws != '' && qqBot.ws ? qqBot.ws : null,
          sandbox: qqBot.sandbox ?? false
        }
        config.saveValue(value)
        context.notification('QQ Bot 配置保存成功～')
      } else if (data.type === 'qq-bot.init') {
        let config = getConfigValue()
        if (!config) config = {}
        // 发送消息
        webView.postMessage({
          type: 'qq-bot.init',
          data: config['qq-bot'] ?? {}
        })
      }
    } catch (e) {
      console.error(e)
    }
  })
}

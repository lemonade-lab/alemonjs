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
  context.onCommand('open.kook', () => {
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
    try {
      if (data.type === 'kook.form.save') {
        const CIG = data.data
        const config = getConfig()
        const value = config.value ?? {}
        value['kook'] = {
          token: CIG.token ?? '',
          // master_key 12121,1313,1313,13 转为数组
          master_key: CIG.master_key.split(',')
        }
        config.saveValue(value)
        context.notification('KOOK 配置保存成功～')
      } else if (data.type === 'kook.init') {
        let config = getConfigValue()
        if (!config) config = {}
        // 发送消息
        webView.postMessage({
          type: 'kook.init',
          data: config.qq_bot ?? {}
        })
      }
    } catch (e) {
      console.error(e)
    }
  })
}

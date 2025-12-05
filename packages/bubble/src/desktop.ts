import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getConfig, getConfigValue } from 'alemonjs';
// 当前目录
const __dirname = dirname(fileURLToPath(import.meta.url));

// 被激活的时候。
export const activate = context => {
  // 创建一个 webview。
  const webView = context.createSidebarWebView(context);

  // 当命令被触发的时候。
  context.onCommand('open.bubble', () => {
    const dir = join(__dirname, '../', 'dist', 'index.html');
    const scriptReg = /<script.*?src="(.+?)".*?>/;
    const styleReg = /<link.*?rel="stylesheet".*?href="(.+?)".*?>/;
    const iconReg = /<link.*?rel="icon".*?href="(.+?)".*?>/g;
    // 创建 webview 路径
    const styleUri = context.createExtensionDir(join(__dirname, '../', 'dist', 'assets', 'index.css'));
    const scriptUri = context.createExtensionDir(join(__dirname, '../', 'dist', 'assets', 'index.js'));
    // 确保路径存在
    const html = readFileSync(dir, 'utf-8')
      .replace(iconReg, '')
      .replace(scriptReg, `<script type="module" crossorigin src="${scriptUri}"></script>`)
      .replace(styleReg, `<link rel="stylesheet" crossorigin href="${styleUri}">`);

    // 立即渲染 webview
    webView.loadWebView(html);
  });

  // 监听 webview 的消息。
  webView.onMessage(data => {
    try {
      if (data.type === 'bubble.form.save') {
        const db = data.data;
        const config = getConfig();
        const value = config.value ?? {};

        value['bubble'] = {
          token: db.token ?? '',
          master_key: db.master_key?.split(',') ?? null
        };
        config.saveValue(value);
        context.notification('bubble 配置保存成功～');
      } else if (data.type === 'bubble.init') {
        let config = getConfigValue();

        if (!config) {
          config = {};
        }
        // 发送消息
        webView.postMessage({
          type: 'bubble.init',
          data: config.bubble ?? {}
        });
      }
    } catch (e) {
      logger.error(e);
    }
  });
};

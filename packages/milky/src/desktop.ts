import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getConfig, getConfigValue } from 'alemonjs';
import { getPublishedConnectionStatus } from './sdk/status';
// 当前目录
const __dirname = dirname(fileURLToPath(import.meta.url));

// 被激活的时候。
export const activate = context => {
  // 创建一个 webview。
  const webView = context.createSidebarWebView(context);

  // 当命令被触发的时候。
  context.onCommand('open.milky', () => {
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
      if (data.type === 'milky.form.save') {
        const db = data.data;
        const config = getConfig();
        const value = config.value ?? {};

        value['milky'] = {
          ...db,
          port: Number(db.port ?? 8080),
          http_timeout: Number(db.http_timeout ?? 15),
          heartbeat: Number(db.heartbeat ?? 30),
          reconnect_interval: Number(db.reconnect_interval ?? 10),
          webhook_port: Number(db.webhook_port ?? 17159),
          master_key: db.master_key?.split(',') ?? null,
          master_id: db.master_id?.split(',') ?? null
        };
        config.saveValue(value);
        context.notification('Milky 配置保存成功～');
      } else if (data.type === 'milky.init') {
        let config = getConfigValue();

        if (!config) {
          config = {};
        }
        // 发送消息
        webView.postMessage({
          type: 'milky.init',
          data: config.milky ?? {}
        });
        webView.postMessage({
          type: 'milky.status',
          data: getPublishedConnectionStatus() ?? null
        });
      } else if (data.type === 'milky.status') {
        webView.postMessage({
          type: 'milky.status',
          data: getPublishedConnectionStatus() ?? null
        });
      }
    } catch (e) {
      console.error(e);
    }
  });
};

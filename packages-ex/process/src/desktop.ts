import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getConfig, getConfigValue, normalizeAppsConfig } from 'alemonjs';
import { Context } from './context-pro';

// 当前目录
const __dirname = dirname(fileURLToPath(import.meta.url));

// 被激活的时候。
export const activate = (context: typeof Context.prototype) => {
  // 创建一个 webview。
  const webView = context.createSidebarWebView(context);

  // 注册命令
  // const sidebar = new Sidebar()
  // context.register(sidebar)

  // 当命令被触发的时候。
  context.onCommand('open.process', () => {
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
      if (data.type === 'process.get.apps') {
        let config = getConfigValue();

        if (!config) {
          config = {};
        }
        const d = normalizeAppsConfig(config.apps).filter(app => app.enabled).map(app => app.name);

        // 发送消息
        webView.postMessage({
          type: 'process.get.apps',
          data: d
        });
      } else if (data.type === 'process.open.apps') {
        const config = getConfig();
        let value = config.value;

        if (!value) {
          value = {};
        }
        const name = data.data;

        if (typeof name !== 'string' || !name.trim()) return;
        const apps = normalizeAppsConfig(value.apps);
        const existing = apps.find(app => app.name === name.trim());
        if (existing) existing.enabled = true;
        else apps.push({ name: name.trim(), enabled: true, order: apps.at(-1)?.order ?? 0 });
        config.saveValue({ ...value, apps: Object.fromEntries(apps.map(({ name, enabled, order }) => [name, { enabled, order }])) });
      } else if (data.type === 'process.disable.apps') {
        const config = getConfig();
        let value = config.value;

        if (!value) {
          value = {};
        }
        const name = data.data;

        const apps = normalizeAppsConfig(value.apps);
        const existing = apps.find(app => app.name === name);
        if (existing) existing.enabled = false;
        config.saveValue({ ...value, apps: Object.fromEntries(apps.map(({ name, enabled, order }) => [name, { enabled, order }])) });
      }
    } catch (e) {
      console.error(e);
    }
  });
};

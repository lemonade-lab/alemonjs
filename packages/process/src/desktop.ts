import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getConfig, getConfigValue } from 'alemonjs';
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
      if (data.type == 'process.get.apps') {
        let config = getConfigValue();

        if (!config) {
          config = {};
        }
        const d = Array.isArray(config.apps) ? config.apps : [];

        // 发送消息
        webView.postMessage({
          type: 'process.get.apps',
          data: d
        });
      } else if (data.type == 'process.open.apps') {
        const config = getConfig();
        let value = config.value;

        if (!value) {
          value = {};
        }
        const name = data.data;

        if (Array.isArray(value.apps)) {
          if (!value.apps.includes(name)) {
            value.apps.push(name);
            config.saveValue(value);
          }
        } else {
          // 确保为数组
          value.apps = [name];
          config.saveValue(value);
        }
      } else if (data.type == 'process.disable.apps') {
        const config = getConfig();
        let value = config.value;

        if (!value) {
          value = {};
        }
        const name = data.data;

        if (Array.isArray(value.apps)) {
          // 存在则删除
          if (value.apps.includes(name)) {
            value.apps = value.apps.filter((item: string) => item !== name);
            config.saveValue(value);
          }
        } else {
          // 确保为空数组
          value.apps = [];
          config.saveValue(value);
        }
      }
    } catch (e) {
      console.error(e);
    }
  });
};

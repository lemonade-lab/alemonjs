import { getConfigValue } from 'alemonjs';
import { start as startWebhook } from './index.webhook';
import { start as startWebsocket } from './index.websoket';
import { platform } from './config';
// 平台
export { platform } from './config';
// hook
export * from './hook';
// api
export { QQBotAPI as API } from './sdk/api';
// main
const main = () => {
  let value = getConfigValue();

  if (!value) {
    value = {};
  }
  const config = value[platform];

  if (config?.route || config?.port || config?.ws) {
    startWebhook();
  } else {
    startWebsocket();
  }
};

const mainProcess = () => {
  ['SIGINT', 'SIGTERM', 'SIGQUIT', 'disconnect'].forEach(sig => {
    process?.on?.(sig, () => {
      logger?.info?.(`[@alemonjs/qq-bot][${sig}] 收到信号，正在关闭...`);
      setImmediate(() => process.exit(0));
    });
  });

  process?.on?.('exit', code => {
    logger?.info?.(`[@alemonjs/qq-bot][exit] 进程退出，code=${code}`);
  });

  // 监听主进程消息
  process.on('message', msg => {
    try {
      const data = typeof msg === 'string' ? JSON.parse(msg) : msg;

      if (data?.type === 'start') {
        main();
      } else if (data?.type === 'stop') {
        process.exit(0);
      }
    } catch {}
  });

  // 主动发送 ready 消息
  if (process.send) {
    process.send(JSON.stringify({ type: 'ready' }));
  }
};

mainProcess();

export default main;

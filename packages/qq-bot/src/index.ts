import { definePlatform, getConfigValue } from 'alemonjs';
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

export default definePlatform({ main });

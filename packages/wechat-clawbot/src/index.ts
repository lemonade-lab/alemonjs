/**
 * wechat-clawbot - WeChat Platform Adapter for alemonjs
 * 微信个人号平台适配器
 */

import { definePlatform } from 'alemonjs';
import { getWechatConfig, platform } from './config.js';
import { WeChatClient, createLogger } from './client.js';
import { register } from './register.js';
export { WeChatClient as API } from './client.js';

const main = () => {
  const config = getWechatConfig();
  const logger = createLogger(config.log_level);

  const client = new WeChatClient({
    baseUrl: config.base_url,
    cdnBaseUrl: config.cdn_base_url,
    apiTimeout: config.api_timeout,
    longPollTimeout: config.long_poll_timeout,
    logger
  });

  // Register client with CBP and start polling
  register(client, logger);
};

export default definePlatform({ main });
export { platform };

import { QQBotClient } from './sdk/client.webhook';
import { register } from './register';
import { getQQBotConfig } from './config';

export const start = () => {
  const config = getQQBotConfig();
  if (config.bots && Object.keys(config.bots).length > 1) {
    throw new Error('qq-bot.bots is only supported by WebSocket mode; remove route/port/ws to use the QQ WebSocket gateway');
  }
  const { master_id: _, master_key: __, ...cfgConfig } = config;
  const client = new QQBotClient({
    ...cfgConfig
  });

  // 连接
  client.connect();
  register(client as any);
};

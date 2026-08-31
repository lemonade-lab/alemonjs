import { cbpPlatform, logger, type ConnectionLoginStatus } from 'alemonjs';
import { getQQBotBots, getQQBotConfig } from './config';
import { IntentsEnum } from './sdk/intents';
import { qrLogin, saveBotCredentials } from './sdk/qr-auth';
import { QQBotRegistry } from './sdk/registry';

let activeRegistry: QQBotRegistry | undefined;

export const getQQBotRegistry = () => activeRegistry;

/** 是否已有可用的机器人凭证（顶层 app_id+secret 或 bots 配置） */
const hasConfiguredCredentials = () => {
  const config = getQQBotConfig();

  if (config?.bots && Object.keys(config.bots).length > 0) {
    return true;
  }

  return Boolean(config?.app_id && config?.secret);
};

export const start = () => {
  void bootstrap();
};

/**
 * 未配置 app_id/secret 时进入扫码登录：
 * 引导用户扫码授权，凭证写入配置文件（保留原有注释与格式）后继续连接；
 * 扫码未完成则跳过连接，等待用户重启或手动配置
 */
const bootstrap = async () => {
  // Keep one CBP instance for both the pre-credential QR challenge and the later gateway lifecycle.
  // This makes the login events available through fork IPC, direct sockets and external WebSocket mode.
  const cbp = cbpPlatform();
  let loginStatus: ConnectionLoginStatus = {
    state: hasConfiguredCredentials() ? 'not_required' : 'awaiting_qrcode',
    updatedAt: Date.now()
  };
  const { defaultBot } = getQQBotBots();
  const registry = new QQBotRegistry(defaultBot, cbp, () => loginStatus);

  // Register the status action before QR generation so a late WS client can recover the active challenge.
  activeRegistry = registry;

  if (!hasConfiguredCredentials()) {
    logger.info('[qq-bot] 未检测到 app_id/secret 配置，进入扫码登录流程');

    const result = await qrLogin({
      onQRCode: (qrBuffer, url, _qrImagePath, loginId, refresh) => {
        loginStatus = {
          state: 'awaiting_qrcode',
          type: 'qrcode',
          loginId,
          qrcode: {
            url,
            imageBase64: qrBuffer.toString('base64'),
            format: 'png',
            refreshed: refresh > 0
          },
          updatedAt: Date.now()
        };
        cbp.send({
          name: 'login.qrcode',
          value: '',
          Platform: 'qq-bot',
          LoginId: loginId,
          LoginType: 'qrcode',
          QRCode: {
            url,
            imageBase64: qrBuffer.toString('base64'),
            format: 'png',
            refreshed: refresh > 0
          }
        });
      }
    });

    if (!result) {
      loginStatus = { state: 'failed', type: 'qrcode', updatedAt: Date.now(), lastError: '二维码登录未完成' };
      logger.warn('[qq-bot] 扫码登录未完成，已跳过 qq-bot 连接；可重启重试，或手动在配置文件中填写 app_id/secret');

      return;
    }

    if (!saveBotCredentials(result.appId, result.clientSecret)) {
      loginStatus = { state: 'failed', type: 'qrcode', loginId: result.loginId, updatedAt: Date.now(), lastError: '凭证写入失败' };
      logger.warn(`[qq-bot] 凭证写入配置失败（AppID=${result.appId}），已跳过连接；请手动补全配置`);

      return;
    }

    loginStatus = {
      state: 'authorized',
      type: 'qrcode',
      loginId: result.loginId,
      updatedAt: Date.now()
    };
    cbp.send({
      name: 'login.success',
      value: '',
      Platform: 'qq-bot',
      LoginId: result.loginId,
      LoginType: 'qrcode',
      BotId: result.appId,
      UserId: result.userOpenid
    });
    logger.info(`[qq-bot] 扫码登录成功，凭证已写入配置文件（AppID=${result.appId}）`);
  }

  try {
    connectAll(registry);
  } catch (err) {
    logger.error(`[qq-bot] 启动连接失败：${err?.message ?? err}`);
  }
};

const connectAll = (registry: QQBotRegistry) => {
  const { bots } = getQQBotBots();

  const notPrivateIntents = [
    'GUILDS', // base
    'GUILD_MEMBERS', // base
    'GUILD_MESSAGE_REACTIONS',
    'DIRECT_MESSAGE',
    'PUBLIC_GUILD_MESSAGES'
  ] as IntentsEnum[];

  const isPrivateIntents = [
    'GUILDS', // base
    'GUILD_MEMBERS', // base
    'GUILD_MESSAGES',
    'GUILD_MESSAGE_REACTIONS',
    'DIRECT_MESSAGE',
    'FORUMS_EVENT'
  ] as IntentsEnum[];

  // 群/C2C 事件，不分公私域
  const isGroupIntents = ['GROUP_AND_C2C_EVENT', 'GROUP_MEMBER_EVENT'] as IntentsEnum[];

  const pubIntents = ['INTERACTION'] as IntentsEnum[];

  const intents = [] as IntentsEnum[];

  if (getQQBotConfig()?.is_private) {
    intents.push(...isPrivateIntents, ...isGroupIntents, ...pubIntents);
  } else {
    intents.push(...notPrivateIntents, ...isGroupIntents, ...pubIntents);
  }

  for (const [botId, botConfig] of bots) {
    const client = registry.add(botId, {
      ...botConfig,
      intents: botConfig.intents || intents,
      is_private: botConfig.is_private ?? false,
      sandbox: botConfig.sandbox ?? false,
      shard: botConfig.shard ?? [0, 1]
    });

    void client.connect(botConfig.gatewayURL);
  }
};

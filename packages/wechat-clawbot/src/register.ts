import { cbpPlatform, FormatEvent, createResult, ResultCode } from 'alemonjs';
import { getWechatConfig, getMaster, platform } from './config.js';
import type { WeChatClient, WeChatMessage, Credentials, Logger } from './client.js';
import { TokenStorage, ContextStorage } from './client.js';
import { SEND_MESSAGE } from './sends.js';
import QRCode from 'qrcode';

export const register = (client: WeChatClient, logger: Logger, credentials?: Credentials) => {
  const config = getWechatConfig();
  const tokenStorage = new TokenStorage(config.storage_dir);
  const contextStorage = new ContextStorage(config.storage_dir);
  const port = process.env?.port || 17117;
  const url = `ws://127.0.0.1:${port}`;
  const cbp = cbpPlatform(url);

  let botId = '';
  let currentCredentials: Credentials | null = credentials || null;

  // Persist the sync cursor on every poll so restarts resume without gaps
  client.onSyncBufPersist = buf => {
    if (botId) {
      void contextStorage.save(botId, { syncBuf: buf });
    }
  };

  const createUserAvatar = (userId: string): string => {
    return `https://weixin.qq.com/avatar/${userId}`;
  };

  const getMessageText = (itemList: any[]): string => {
    let text = '';
    for (const item of itemList || []) {
      if (item.type === 1) {
        text += item.text_item?.text || '';
      }
    }
    return text.trim();
  };

  const extractMediaFromMessage = (itemList: any[]): any[] => {
    const media = [];
    for (const item of itemList || []) {
      if (item.type === 2) {
        media.push({
          Type: 'image',
          Url: item.image_item?.media?.encrypt_query_param,
          FileId: item.image_item?.media?.encrypt_query_param,
          FileName: 'image.jpg',
          FileSize: item.image_item?.mid_size ? Number(item.image_item.mid_size) : undefined
        });
      } else if (item.type === 3) {
        media.push({
          Type: 'audio',
          Url: item.voice_item?.media?.encrypt_query_param,
          FileId: item.voice_item?.media?.encrypt_query_param,
          FileName: 'voice.mp3',
          FileSize: item.voice_item?.playtime ? Number(item.voice_item.playtime) : undefined
        });
      } else if (item.type === 4) {
        media.push({
          Type: 'file',
          Url: item.file_item?.media?.encrypt_query_param,
          FileId: item.file_item?.media?.encrypt_query_param,
          FileName: item.file_item?.file_name || 'file',
          FileSize: item.file_item?.len ? Number(item.file_item.len) : undefined
        });
      } else if (item.type === 5) {
        media.push({
          Type: 'video',
          Url: item.video_item?.media?.encrypt_query_param,
          FileId: item.video_item?.media?.encrypt_query_param,
          FileName: 'video.mp4',
          FileSize: item.video_item?.video_size ? Number(item.video_item.video_size) : undefined
        });
      }
    }
    return media;
  };

  const processMessage = async (msg: WeChatMessage): Promise<void> => {
    const messageText = getMessageText(msg.item_list);
    const UserId = msg.from_user_id;
    const UserAvatar = createUserAvatar(UserId);
    const [isMasterUser, UserKey] = getMaster(UserId);
    const MessageId = msg.message_id ? `${msg.message_id}_${Date.now()}` : `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const MessageMedia = extractMediaFromMessage(msg.item_list);

    if (msg.context_token) {
      client.setContextToken(msg.context_token);
      if (botId) {
        await contextStorage.save(botId, { contextToken: msg.context_token });
      }
    }
    logger.debug('Raw inbound item_list:', JSON.stringify(msg.item_list));

    logger.info(`Message from ${msg.from_user_name || UserId}: ${messageText}`);

    cbp.send(
      FormatEvent.create('private.message.create')
        .addPlatform({
          Platform: platform,
          value: msg,
          BotId: botId,
          IsAtMe: false,
          IsPrivate: true
        })
        .addUser({
          UserId,
          UserKey,
          UserName: msg.from_user_name || UserId,
          UserAvatar,
          IsMaster: isMasterUser,
          IsBot: false
        })
        .addMessage({ MessageId })
        .addText({ MessageText: messageText })
        .addMedia({ MessageMedia })
        .addOpen({ OpenId: UserId })
        .add({ tag: 'private.message.create' }).value
    );
  };

  // Register message handler
  client.onMessage(processMessage);

  // Register session expired handler
  client.onSessionExpired(async () => {
    logger.warn('Session expired, attempting re-login...');
    await tokenStorage.delete();
    if (config.auto_relogin) {
      try {
        await initBot();
      } catch (error) {
        logger.error('Re-login failed:', error);
      }
    }
  });

  // Register error handler
  client.onError(error => {
    logger.error('Client error:', error);
  });

  const initBot = async (storedCredentials?: Credentials): Promise<void> => {
    if (storedCredentials?.token) {
      logger.info('Using stored credentials for:', storedCredentials.userId);
      currentCredentials = storedCredentials;
      botId = storedCredentials.accountId || storedCredentials.userId;
      client.setCredentials(storedCredentials);

      const savedContext = await contextStorage.load(botId);
      if (savedContext.syncBuf) {
        client.syncBuf = savedContext.syncBuf;
      }
      if (savedContext.contextToken) {
        client.contextToken = savedContext.contextToken;
      }
    } else {
      logger.info('Starting QR code login...');

      const qrData = await client.getQRCode();
      const qrcode = qrData.qrcode;
      const qrcodeUrl = qrData.qrcode_img_content;

      if (!qrcode || !qrcodeUrl) {
        throw new Error('Failed to get QR code');
      }

      // QR rendering belongs to CBP (terminal fallback + UI image); the adapter only emits login.qrcode.
      let imageBase64: string | undefined;
      try {
        imageBase64 = (await QRCode.toBuffer(qrcodeUrl, { type: 'png', width: 320, margin: 2 })).toString('base64');
      } catch {
        // The URL below remains usable by CBP terminal fallback and browsers.
      }

      cbp.send({
        name: 'login.qrcode',
        value: '',
        Platform: platform,
        LoginId: qrcode,
        LoginType: 'qrcode',
        QRCode: {
          url: qrcodeUrl,
          imageBase64,
          format: 'png',
          refreshed: false
        }
      });

      const startTime = Date.now();
      const maxWait = 5 * 60 * 1000;

      while (Date.now() - startTime < maxWait) {
        await new Promise(resolve => setTimeout(resolve, config.qr_poll_interval));

        try {
          const status = await client.pollQRStatus(qrcode);

          if (status.status === 'confirmed') {
            const newCredentials: Credentials = {
              token: status.bot_token,
              baseUrl: status.baseurl || config.base_url,
              accountId: status.ilink_bot_id,
              userId: status.ilink_user_id,
              nickname: status.nickname || status.ilink_user_id,
              savedAt: new Date().toISOString()
            };

            await tokenStorage.save(newCredentials);
            logger.info('Credentials saved for:', newCredentials.userId);

            client.setCredentials(newCredentials);
            currentCredentials = newCredentials;
            botId = newCredentials.accountId || newCredentials.userId;

            cbp.send({
              name: 'login.success',
              value: '',
              Platform: platform,
              LoginId: qrcode,
              LoginType: 'qrcode',
              BotId: newCredentials.accountId || newCredentials.userId,
              UserId: newCredentials.userId
            });

            break;
          } else if (status.status === 'expired') {
            throw new Error('QR code expired');
          }
        } catch (error: any) {
          if (!error.message?.includes('timeout') && error.name !== 'AbortError') {
            throw error;
          }
        }
      }

      if (!currentCredentials) {
        throw new Error('Login timeout');
      }
    }

    logger.info('Starting message polling...');
    client.startPolling().catch(err => {
      logger.error('Polling stopped with error:', err);
    });
  };

  // Register action handlers
  cbp.onactions(async (data: any, consume: any) => {
    logger.debug('Action received:', data.action);

    switch (data.action) {
      case 'me.info': {
        if (!currentCredentials) {
          return consume([createResult(ResultCode.Fail, 'Not logged in', null)]);
        }
        const UserId = currentCredentials.userId;
        const [isMasterUser, UserKey] = getMaster(UserId);
        const user = {
          UserId,
          UserName: currentCredentials.nickname || UserId,
          IsBot: true,
          IsMaster: isMasterUser,
          UserAvatar: createUserAvatar(UserId),
          UserKey
        };
        return consume([createResult(ResultCode.Ok, 'Request completed', user)]);
      }

      case 'message.send':
      case 'message.send.user': {
        try {
          if (!currentCredentials) {
            return consume([createResult(ResultCode.Fail, 'Bot not initialized', null)]);
          }

          const userId = data.action === 'message.send' ? data.payload.event.UserId : data.payload.UserId;
          const val = data.payload.params.format;

          const res = await SEND_MESSAGE(client, userId, val, logger);
          return consume(res);
        } catch (error) {
          logger.error('Failed to send message:', error);
          return consume([createResult(ResultCode.Fail, 'Failed to send message', error)]);
        }
      }

      case 'mention.get': {
        // WeChat doesn't support mentions in the same way
        return consume([createResult(ResultCode.Ok, 'Request completed', [])]);
      }

      default:
        return consume([createResult(ResultCode.Fail, 'Unknown action', null)]);
    }
  });

  // Register API handlers
  cbp.onapis(async (data: any, consume: any) => {
    const key = data.payload?.key;
    const params = data.payload?.params;
    logger.debug('API call:', key);

    try {
      const keys = key.split('.');
      let target: any = client;
      for (const k of keys) {
        if (target === null || target === undefined || !(k in target)) {
          return consume([createResult(ResultCode.Fail, 'Unknown API', null)]);
        }
        target = target[k];
      }

      if (typeof target !== 'function') {
        return consume([createResult(ResultCode.Fail, 'Target is not a function', null)]);
      }

      const res = await target.call(client, ...params);
      return consume([createResult(ResultCode.Ok, 'Request completed', res)]);
    } catch (error) {
      logger.error('API call failed:', error);
      return consume([createResult(ResultCode.Fail, 'Request failed', error)]);
    }
  });

  // Initialize bot
  tokenStorage
    .load()
    .then(stored => {
      initBot(stored).catch(console.error);
    })
    .catch(() => {
      initBot().catch(console.error);
    });
};

import {
  cbpPlatform,
  createResult,
  createUserHashKey,
  definePlatform,
  getConfigValue,
  isMaster,
  ResultCode,
  type ConnectionLoginStatus,
  type DataEnums
} from 'alemonjs';
import { WechatyBuilder } from '@juzi/wechaty';
import { FileBox } from 'file-box';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomUUID } from 'node:crypto';
import { getPublicPath } from './static';

const client = new Proxy(
  {},
  {
    get: (_, prop) => {
      const current = global.client;

      if (current && prop in current) {
        const original = current[prop];

        // 防止函数内this丢失
        return typeof original === 'function' ? original.bind(global.client) : original;
      }

      return undefined;
    }
  }
);
const platform = 'wechat';
const main = () => {
  let value = getConfigValue();

  if (!value) {
    value = {};
  }
  const config = value[platform];
  const bot = WechatyBuilder.build({
    name: config?.name ?? 'alemonjs'
  });
  let i = 0;
  let activeQRCode = '';
  let loginId = '';
  let connectionState = 'connecting';
  let loginStatus: ConnectionLoginStatus = {
    state: 'awaiting_qrcode' as const,
    updatedAt: Date.now()
  };
  let botId = '';
  let lastError: string | undefined;
  const cbp = cbpPlatform();

  const getConnectionStatus = () => ({
    Platform: platform,
    state: connectionState,
    bots: botId ? [{ BotId: botId, state: connectionState, transport: 'wechaty', lastError }] : [],
    login: loginStatus
  });

  const sendFormat = async (conversation: { say: (message: unknown) => Promise<unknown> }, format: DataEnums[] = []) => {
    const text = format
      .filter(item => item.type === 'Text' || item.type === 'Mention')
      .map(item => String(item.value))
      .join('');
    const images = format.filter(item => item.type === 'ImageFile' || item.type === 'ImageURL');
    const results: unknown[] = [];

    if (text) {
      results.push(await conversation.say(text));
    }
    for (const image of images) {
      const fileBox = image.type === 'ImageFile' ? FileBox.fromFile(image.value) : FileBox.fromUrl(image.value);

      results.push(await conversation.say(fileBox));
    }
    if (results.length === 0) {
      throw new Error('消息内容为空或包含暂不支持的格式');
    }

    return results;
  };

  const findConversation = (scope: string, targetId: string) => {
    if (scope === 'group' || scope === 'channel') {
      return bot.Room.find({ id: targetId });
    }

    return bot.Contact.find({ id: targetId });
  };

  cbp.onactions(
    (data, consume) =>
      void (async () => {
        try {
          const payload: any = data?.payload ?? {};

          if (data?.action === 'connection.status') {
            consume([createResult(ResultCode.Ok, data.action, getConnectionStatus())]);

            return;
          }
          if (data?.action === 'message.send') {
            const event = payload.event?.value ?? payload.event;
            const results = await sendFormat(event, payload.params?.format ?? []);

            consume([createResult(ResultCode.Ok, data.action, results)]);

            return;
          }
          if (data?.action === 'message.send.channel' || data?.action === 'message.send.user' || data?.action === 'message.send.target') {
            const target =
              data.action === 'message.send.target'
                ? payload.target
                : { scope: data.action === 'message.send.channel' ? 'group' : 'c2c', targetId: payload.ChannelId ?? payload.UserId };
            const conversation = target?.targetId ? await findConversation(target.scope, String(target.targetId)) : undefined;

            if (!conversation) {
              throw new Error(`未找到目标会话: ${target?.targetId ?? ''}`);
            }
            const results = await sendFormat(conversation, payload.params?.format ?? []);

            consume([createResult(ResultCode.Ok, data.action, results)]);

            return;
          }
          if (data?.action === 'mention.get') {
            const event = payload.event?.value ?? payload.event;
            const mentions = (await event?.mentionList?.()) ?? [];
            const users = mentions.map(contact => ({
              UserId: String(contact.id),
              UserName: contact.name(),
              IsBot: false,
              IsMaster: isMaster(String(contact.id), platform),
              UserKey: createUserHashKey({ Platform: platform, UserId: String(contact.id) })
            }));

            consume([createResult(ResultCode.Ok, data.action, users)]);

            return;
          }
          if (data?.action === 'me.info') {
            const self = bot.currentUser;

            consume([
              createResult(
                ResultCode.Ok,
                data.action,
                self
                  ? {
                      UserId: String(self.id),
                      UserName: self.name(),
                      UserAvatar: '',
                      IsBot: true,
                      IsMaster: false,
                      UserKey: createUserHashKey({ Platform: platform, UserId: String(self.id) })
                    }
                  : null
              )
            ]);

            return;
          }
          consume([createResult(ResultCode.FailParams, `暂不支持的 WeChat 动作: ${data?.action ?? ''}`, null)]);
        } catch (error) {
          consume([createResult(ResultCode.Fail, data?.action ?? 'unknown', error instanceof Error ? error.message : error)]);
        }
      })()
  );

  bot
    .on('scan', qrcode => {
      const qrcodeURL = `${config?.qrcode_url ?? 'https://wechaty.js.org/qrcode/'}${encodeURIComponent(qrcode)}`;
      const refreshed = Boolean(activeQRCode && qrcode !== activeQRCode);
      const changed = qrcode !== activeQRCode;

      if (changed) {
        activeQRCode = qrcode;
        loginId = randomUUID();
      }
      loginStatus = {
        state: 'awaiting_qrcode',
        type: 'qrcode',
        loginId,
        qrcode: { url: qrcodeURL, refreshed },
        updatedAt: Date.now()
      };
      if (changed) {
        cbp.send({
          name: 'login.qrcode',
          value: '',
          Platform: platform,
          LoginId: loginId,
          LoginType: 'qrcode',
          QRCode: loginStatus.qrcode
        });
      }
      if (i > 6) {
        void bot.logout().catch(error => {
          connectionState = 'offline';
          lastError = error instanceof Error ? error.message : String(error);
        });
        // 长期不扫码
        process.cwd();

        return;
      }
      i++;
    })
    .on('login', user => {
      i = 0;
      botId = String(user?.id ?? '');
      connectionState = 'ready';
      const wasQRCodeLogin = loginStatus.state === 'awaiting_qrcode' && Boolean(loginId);

      loginStatus = wasQRCodeLogin ? { state: 'authorized', type: 'qrcode', loginId, updatedAt: Date.now() } : { state: 'not_required', updatedAt: Date.now() };
      if (wasQRCodeLogin) {
        cbp.send({
          name: 'login.success',
          value: '',
          Platform: platform,
          LoginId: loginId,
          LoginType: 'qrcode',
          BotId: botId || undefined
        });
      }
      cbp.send({
        name: 'connection.ready',
        value: '',
        Platform: platform,
        BotId: botId || undefined,
        transport: 'wechaty'
      });
      console.log(`用户 ${user} 成功登录`);
    })
    .on('logout', user => {
      connectionState = 'offline';
      loginStatus = { state: 'awaiting_qrcode', updatedAt: Date.now() };
      console.log(`用户 ${user} 退出登录`);
    })
    .on('message', async event => {
      // 自己的消息
      if (event.self()) {
        return;
      }
      // 过时消息
      if (event.age() > 2 * 60) {
        console.info('由于消息太旧（超过 2 分钟）而被丢弃)');

        return;
      }
      // 14 消息卡片 6 图片 7 文字 13 撤回
      if (event.payload.type !== 7) {
        return;
      }
      //
      const value = getConfigValue();
      const masterKeys = value?.wechat?.master_key ?? [];
      const UserAvatar = {
        toBuffer: async () => {
          const contact = event.talker();
          const avatarStream = await contact.avatar();
          const dir = getPublicPath(avatarStream.name);

          if (existsSync(dir)) {
            return readFileSync(dir);
          }
          const buffer = await avatarStream.toBuffer();

          writeFileSync(dir, buffer);

          return buffer;
        },
        toURL: async () => {
          const contact = event.talker();
          const avatarStream = await contact.avatar();
          const dir = getPublicPath(avatarStream.name);

          if (existsSync(dir)) {
            return dir;
          }
          const buffer = await avatarStream.toBuffer();

          writeFileSync(dir, buffer);

          return dir;
        },
        toBase64: async () => {
          const contact = event.talker();
          const avatarStream = await contact.avatar();
          const dir = getPublicPath(avatarStream.name);

          if (existsSync(dir)) {
            return readFileSync(dir).toString('base64');
          }
          const buffer = await avatarStream.toBuffer();

          writeFileSync(dir, buffer);

          return buffer.toString('base64');
        }
      };
      // 文本消息
      const txt = event.payload.text;
      const MessageId = event.payload.id;
      const UserId = event.payload.talkerId;
      const UserKey = createUserHashKey({
        Platform: platform,
        UserId
      });

      if (event.payload?.roomId) {
        let msg = event.payload.text;

        try {
          msg = await event.mentionText();
        } catch (e) {
          console.log(e);
        }
        const roomId = event.payload?.roomId ?? '';
        // 定义消
        const e = {
          name: 'message.create',
          // 事件类型
          Platform: platform,
          /**
           * guild
           */
          GuildId: roomId,
          ChannelId: roomId,
          /**
           * user
           */
          UserId: UserId,
          UserKey: UserKey,
          UserAvatar: UserAvatar,
          IsMaster: masterKeys.includes(UserKey) || isMaster(UserId, platform),
          IsBot: false,
          // message
          MessageId: MessageId,
          MessageText: msg ?? '',
          OpenId: '',
          CreateAt: Date.now(),
          //
          tag: 'message',
          value: null
        };

        // 当访问的时候获取
        Object.defineProperty(e, 'value', {
          get() {
            return event;
          }
        });
        // 处理消息
        cbp.send(e as any);
      } else {
        const OpenId = event.payload?.listenerId ?? '';
        // 定义消
        const e = {
          name: 'private.message.create',
          // 事件类型
          Platform: platform,
          // 用户Id
          UserId: UserId,
          UserKey: UserKey,
          UserAvatar: UserAvatar,
          IsMaster: masterKeys.includes(UserKey) || isMaster(UserId, platform),
          IsBot: false,
          // message
          MessageId: MessageId,
          MessageText: txt ?? '',
          OpenId: OpenId,
          CreateAt: Date.now(),
          // 表情
          tag: 'message',
          value: null
        };

        cbp.send(e as any);
      }
    })
    .on('error', error => {
      connectionState = 'offline';
      lastError = error instanceof Error ? error.message : String(error);
    });
  //
  void bot.start().catch(error => {
    connectionState = 'offline';
    lastError = error instanceof Error ? error.message : String(error);
  });
  global.client = bot;
};

export { client, platform };
export default definePlatform({ main });

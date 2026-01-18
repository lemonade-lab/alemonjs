import { BubbleClient } from './sdk/wss';
import type { User, PublicEventMessageCreate, PrivateEventMessageCreate, DataEnums } from 'alemonjs';
import { ResultCode, cbpPlatform, createResult } from 'alemonjs';
import { getMaster, platform } from './config';
import { CDN_URL } from './sdk/api';
import { sendToRoom, sendToUser } from './send';

// pf
export { platform } from './config';

// api
export { BubbleAPI as API } from './sdk/api';
export { API_URL, CDN_URL, GATEWAY_URL } from './sdk/api';

// types
export type {
  IntentsEnum,
  User,
  Channel,
  Guild,
  Attachment,
  BaseMessage,
  MessageCreateEvent,
  DmMessageCreateEvent,
  MessageUpdateEvent,
  MessageDeleteEvent,
  GuildMemberEvent,
  BotReadyEvent,
  EventsSubscribedEvent,
  EventsUnsubscribedEvent,
  SubscribeDeniedEvent,
  BotInfo,
  SendMessagePayload,
  FileUploadResponse,
  FileQuota,
  BubbleEventMap
} from './sdk/types';

// websocket client
export { BubbleClient } from './sdk/wss';
export { OpCode } from './sdk/wss.types';
export type { BUBBLEOptions, HelloPayload, SubscribePayload } from './sdk/wss.types';

// hook
export * from './hook';

// config
export { type Options } from './config';

// main
const main = () => {
  const port = process.env?.port || 17117;
  /**
   * 连接 alemonjs 服务器。
   * 向 alemonjs 推送标准信息
   */
  const url = `ws://127.0.0.1:${port}`;
  const cbp = cbpPlatform(url);

  // 创建客户端
  const client = new BubbleClient();

  // 连接
  void client.connect();

  const createUserAvatar = (_UserId: string, avatar: string | null) => {
    return `${CDN_URL}/${avatar}`;
  };

  // 监听消息
  client.on('MESSAGE_CREATE', event => {
    // 消除bot消息
    if (event.author?.is_bot) {
      return;
    }

    // 艾特消息处理
    const atUsers: {
      id: string;
    }[] = [];

    // 获取艾特用户
    for (const item of event.mentions || []) {
      atUsers.push({
        id: String(item.id)
      });
    }

    // 清除 @ 相关的消息
    let msg = event.content;

    for (const item of atUsers) {
      msg = msg.replace(`<@${item.id}>`, '').trim();
    }

    const UserId = String(event.authorId);
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = createUserAvatar(UserId, event?.author?.avatar);
    const e: PublicEventMessageCreate = {
      name: 'message.create',
      // 事件类型
      Platform: platform,
      // guild
      GuildId: String(event.channelId || ''),
      ChannelId: String(event.channelId || ''),
      SpaceId: String(event.channelId || ''),
      // user
      UserId: UserId,
      UserKey,
      UserName: event?.author?.username,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      OpenId: UserId,
      MessageId: String(event.id),
      MessageText: msg,
      CreateAt: Date.now(),
      tag: 'message.create',
      value: event
    };

    cbp.send(e);
  });

  client.on('DM_MESSAGE_CREATE', event => {
    const UserId = String(event.authorId);
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = createUserAvatar(UserId, event?.author?.avatar);
    // 处理消息
    const e: PrivateEventMessageCreate = {
      name: 'private.message.create',
      // 事件类型
      Platform: platform,
      // user
      UserId: UserId,
      UserKey,
      UserName: event?.author?.username,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      OpenId: UserId,
      // message
      MessageId: String(event.id),
      MessageText: event.content,
      CreateAt: Date.now(),
      // other
      tag: 'private.message.create',
      value: event
    };

    cbp.send(e);
  });

  const api = {
    active: {
      send: {
        channel: async (UserId: string, val: DataEnums[]) => {
          const res = await sendToRoom(client, { channel_id: UserId }, val);

          return [createResult(ResultCode.Ok, '请求完成', res)];
        },
        user: async (OpenId: string, val: DataEnums[]) => {
          const res = await sendToUser(client, { author_id: OpenId }, val);

          return [createResult(ResultCode.Ok, '请求完成', res)];
        }
      }
    },
    use: {
      send: async (event, val: DataEnums[]) => {
        if (val.length < 0) {
          return [];
        }
        const tag = event.tag;

        if (tag === 'message.create') {
          const ChannelId = String(event.value.channelId || '');
          const res = await sendToRoom(client, { channel_id: ChannelId, message_id: String(event.value.id || '') }, val);

          return [createResult(ResultCode.Ok, '请求完成', res)];
        } else if (tag === 'private.message.create') {
          const UserId = String(event.value.authorId || '');
          const ChannelId = String(event.value.channelId || '');
          const res = await sendToUser(
            client,
            {
              channel_id: ChannelId,
              author_id: UserId,
              message_id: String(event.value.id || '')
            },
            val
          );

          return [createResult(ResultCode.Ok, '请求完成', res)];
        }

        return [];
      },
      mention: e => {
        const event = e.value;
        const MessageMention: User[] = event.mentions.map(item => {
          const UserId = item.id;
          const avatar = event.author.avatar;
          const UserAvatar = createUserAvatar(UserId, avatar);
          const [isMaster, UserKey] = getMaster(UserId);

          return {
            UserId: item.id,
            IsMaster: isMaster,
            IsBot: item.bot,
            UserAvatar,
            UserKey
          };
        });

        return new Promise<User[]>(resolve => {
          resolve(MessageMention);
        });
      }
    }
  };

  const onactions = async (data, consume) => {
    try {
      if (data.action === 'me.info') {
        const res = await client.getMe();
        const UserId = String(res.id);
        const [isMaster, UserKey] = getMaster(UserId);
        const user: User = {
          UserId: UserId,
          UserName: res.name,
          IsBot: true,
          IsMaster: isMaster,
          UserAvatar: '',
          UserKey: UserKey
        };

        consume([createResult(ResultCode.Ok, '请求完成', user)]);
      } else if (data.action === 'message.send') {
        const event = data.payload.event;
        const paramFormat = data.payload.params.format;
        const res = await api.use.send(event, paramFormat);

        consume(res);
      } else if (data.action === 'message.send.channel') {
        const channelId = data.payload.ChannelId;
        const val = data.payload.params.format;
        const res = await api.active.send.channel(channelId, val);

        consume(res);
      } else if (data.action === 'message.send.user') {
        const userId = data.payload.UserId;
        const val = data.payload.params.format;
        const res = await api.active.send.user(userId, val);

        consume(res);
      } else if (data.action === 'mention.get') {
        const event = data.payload.event;
        const res = await api.use.mention(event);

        consume([createResult(ResultCode.Ok, '请求完成', res)]);
      } else {
        consume([createResult(ResultCode.Fail, '未知请求，请尝试升级版本', null)]);
      }
    } catch (error) {
      consume([createResult(ResultCode.Fail, '请求失败', error)]);
    }
  };

  cbp.onactions((data, consume) => void onactions(data, consume));

  const onapis = async (data, consume) => {
    const key = data.payload?.key;

    if (client[key]) {
      // 如果 client 上有对应的 key，直接调用。
      const params = data.payload.params;

      try {
        const res = await client[key](...params);

        consume([createResult(ResultCode.Ok, '请求完成', res)]);
      } catch (error) {
        consume([createResult(ResultCode.Fail, '请求失败', error)]);
      }
    } else {
      consume([createResult(ResultCode.Fail, '未知请求，请尝试升级版本', null)]);
    }
  };

  cbp.onapis((data, consume) => void onapis(data, consume));
};

const mainProcess = () => {
  ['SIGINT', 'SIGTERM', 'SIGQUIT', 'disconnect'].forEach(sig => {
    process?.on?.(sig, () => {
      logger.info?.(`[alemonjs][${sig}] 收到信号，正在关闭...`);
      setImmediate(() => process.exit(0));
    });
  });

  process?.on?.('exit', code => {
    logger.info?.(`[alemonjs][exit] 进程退出，code=${code}`);
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

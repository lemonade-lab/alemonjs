import { BubbleClient } from './sdk/wss';
import type { DataEnums, User } from 'alemonjs';
import { ResultCode, cbpPlatform, createResult, definePlatform, FormatEvent } from 'alemonjs';
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

  // 机器人Id
  let botId = '';

  client
    .getMe()
    .then(res => {
      botId = String(res?.id ?? '');
    })
    .catch(() => {});

  const createUserAvatar = (_UserId: string, avatar: string | null) => {
    if (!avatar) {
      return '';
    }

    return `${CDN_URL}/${avatar}`;
  };

  // 监听消息
  client.on('MESSAGE_CREATE', event => {
    // 消除bot消息
    if (event.author?.is_bot || event.author?.isBot) {
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

    cbp.send(
      FormatEvent.create('message.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: String(event.channelId || ''), SpaceId: String(event.channelId || '') })
        .addChannel({ ChannelId: String(event.channelId || '') })
        .addUser({ UserId, UserKey, UserName: event?.author?.username, UserAvatar, IsMaster: isMaster, IsBot: false })
        .addMessage({ MessageId: String(event.id) })
        .addText({ MessageText: msg })
        .addOpen({ OpenId: UserId })
        .add({ tag: 'message.create' }).value
    );
  });

  client.on('DM_MESSAGE_CREATE', event => {
    const UserId = String(event.authorId);
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = createUserAvatar(UserId, event?.author?.avatar);

    cbp.send(
      FormatEvent.create('private.message.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addUser({ UserId, UserKey, UserName: event?.author?.username, UserAvatar, IsMaster: isMaster, IsBot: false })
        .addMessage({ MessageId: String(event.id) })
        .addText({ MessageText: event.content })
        .addOpen({ OpenId: UserId })
        .add({ tag: 'private.message.create' }).value
    );
  });

  // 消息更新
  client.on('MESSAGE_UPDATE', event => {
    const UserId = String(event.authorId);
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = createUserAvatar(UserId, event?.author?.avatar);

    cbp.send(
      FormatEvent.create('message.update')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: String(event.channelId || ''), SpaceId: String(event.channelId || '') })
        .addChannel({ ChannelId: String(event.channelId || '') })
        .addUser({ UserId, UserKey, UserName: event?.author?.username, UserAvatar, IsMaster: isMaster, IsBot: false })
        .addMessage({ MessageId: String(event.id) })
        .add({ tag: 'MESSAGE_UPDATE' }).value
    );
  });

  // 消息删除
  client.on('MESSAGE_DELETE', event => {
    cbp.send(
      FormatEvent.create('message.delete')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: String(event.guild_id || ''), SpaceId: String(event.channel_id || '') })
        .addChannel({ ChannelId: String(event.channel_id || '') })
        .addMessage({ MessageId: String(event.id) })
        .add({ tag: 'MESSAGE_DELETE' }).value
    );
  });

  // 私聊消息更新
  client.on('DM_MESSAGE_UPDATE', event => {
    const UserId = String(event.authorId);
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = createUserAvatar(UserId, event?.author?.avatar);

    cbp.send(
      FormatEvent.create('private.message.update')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addUser({ UserId, UserKey, UserName: event?.author?.username, UserAvatar, IsMaster: isMaster, IsBot: false })
        .addMessage({ MessageId: String(event.id) })
        .add({ tag: 'DM_MESSAGE_UPDATE' }).value
    );
  });

  // 私聊消息删除
  client.on('DM_MESSAGE_DELETE', event => {
    cbp.send(
      FormatEvent.create('private.message.delete')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addMessage({ MessageId: String(event.id) })
        .add({ tag: 'DM_MESSAGE_DELETE' }).value
    );
  });

  // 成员加入
  client.on('GUILD_MEMBER_ADD', event => {
    const UserId = String(event.user_id || event.user?.id || '');
    const [isMaster, UserKey] = getMaster(UserId);

    cbp.send(
      FormatEvent.create('member.add')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: String(event.guild_id || ''), SpaceId: String(event.guild_id || '') })
        .addChannel({ ChannelId: '' })
        .addUser({ UserId, UserKey, UserName: event.user?.username ?? event.nickname, IsMaster: isMaster, IsBot: false })
        .addMessage({ MessageId: '' })
        .add({ tag: 'GUILD_MEMBER_ADD' }).value
    );
  });

  // 成员移除
  client.on('GUILD_MEMBER_REMOVE', event => {
    const UserId = String(event.user_id || event.user?.id || '');
    const [isMaster, UserKey] = getMaster(UserId);

    cbp.send(
      FormatEvent.create('member.remove')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: String(event.guild_id || ''), SpaceId: String(event.guild_id || '') })
        .addChannel({ ChannelId: '' })
        .addUser({ UserId, UserKey, UserName: event.user?.username ?? event.nickname, IsMaster: isMaster, IsBot: false })
        .addMessage({ MessageId: '' })
        .add({ tag: 'GUILD_MEMBER_REMOVE' }).value
    );
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
        if (!val || val.length <= 0) {
          return [];
        }
        const tag = event._tag;

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
        const MessageMention: User[] = (event.mentions || []).map(item => {
          const UserId = item.id;
          const avatar = item.avatar;
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
        //
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
      } else if (data.action === 'media.upload') {
        // ─── 媒体上传 ───
        const params = data.payload.params;
        const fileData = params?.url ?? params?.data;

        if (!fileData) {
          consume([createResult(ResultCode.FailParams, 'Missing url or data', null)]);
        } else {
          const res = await client
            .uploadFile(fileData, params?.name)
            .then(r => createResult(ResultCode.Ok, data.action, r))
            .catch(err => createResult(ResultCode.Fail, data.action, err));

          consume([res]);
        }
      } else if (data.action === 'history.list') {
        // ─── 消息历史 ───
        const res = await client
          .getChannelMessages(data.payload.ChannelId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.search') {
        // ─── 成员搜索 ───
        const guildId = data.payload.GuildId;
        const keyword = data.payload.params?.keyword ?? '';
        const res = await client
          .listGuildMembers(guildId)
          .then(r => {
            const list = Array.isArray(r) ? r : [];
            const filtered = list.filter((m: any) => (m.name ?? '').includes(keyword) || (m.username ?? '').includes(keyword));

            return createResult(ResultCode.Ok, data.action, filtered);
          })
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
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
    const params = data.payload?.params;

    try {
      // 支持嵌套路径，如 'api.use.send'
      const keys = key.split('.');
      let parent: any = null;
      let target: any = client;

      for (const k of keys) {
        if (target === null || target === undefined || !(k in target)) {
          consume([createResult(ResultCode.Fail, '未知请求，请尝试升级版本', null)]);

          return;
        }

        parent = target;
        target = target[k];
      }

      if (typeof target !== 'function') {
        consume([createResult(ResultCode.Fail, '目标不是可调用方法', null)]);

        return;
      }

      const res = await target.call(parent, ...params);

      consume([createResult(ResultCode.Ok, '请求完成', res)]);
    } catch (error) {
      consume([createResult(ResultCode.Fail, '请求失败', error)]);
    }
  };

  cbp.onapis((data, consume) => void onapis(data, consume));
};

export default definePlatform({ main });

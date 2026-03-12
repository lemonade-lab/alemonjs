import {
  cbpPlatform,
  createResult,
  DataEnums,
  definePlatform,
  PrivateEventMessageCreate,
  PrivateEventMessageDelete,
  PrivateEventRequestFriendAdd,
  PrivateEventRequestGuildAdd,
  PublicEventMemberAdd,
  PublicEventMemberBan,
  PublicEventMemberRemove,
  PublicEventMemberUnban,
  PublicEventMessageCreate,
  PublicEventMessageDelete,
  ResultCode,
  User
} from 'alemonjs';
import { getBufferByURL } from 'alemonjs/utils';
import { readFileSync } from 'fs';
import { platform, getOneBotConfig, getMaster } from './config';
import { OneBotClient } from './sdk/wss';
import { BotMe } from './db';
import { dataEnumToText } from './format';
export { platform } from './config';
export { OneBotAPI as API } from './sdk/api';
export * from './hook';

const main = () => {
  const config = getOneBotConfig();
  const client = new OneBotClient({
    // url
    url: config?.url ?? '',
    // token
    access_token: config?.token ?? '',
    // 是否开启反向连接，正向连接失效
    reverse_enable: config?.reverse_enable ?? false,
    // 反向连接端口
    reverse_port: config?.reverse_port ?? 17158
  });

  void client.connect();

  const url = `ws://127.0.0.1:${process.env?.port || 17117}`;
  const cbp = cbpPlatform(url);

  const createUserAvatar = (id: string) => {
    return `https://q1.qlogo.cn/g?b=qq&s=0&nk=${id}`;
  };

  const getMessageText = (message: any[]) => {
    let msg = '';

    for (const item of message) {
      if (item.type === 'text') {
        msg += item.data.text;
      } else if (item.type === 'at') {
        //
      }
    }

    return msg.trim();
  };

  // 元组
  client.on('META', event => {
    if (event?.self_id) {
      BotMe.id = String(event.self_id);
    }
  });

  // 消息
  client.on('MESSAGES', event => {
    const msg = getMessageText(event.message);
    const UserId = String(event.user_id);
    const UserAvatar = createUserAvatar(UserId);

    const [isMaster, UserKey] = getMaster(UserId);

    const groupId = String(event.group_id);

    const ReplyId = event.message.find(item => item.type === 'reply')?.data?.id;

    // 定义消
    const e: PublicEventMessageCreate = {
      name: 'message.create',
      Platform: platform,
      GuildId: groupId,
      ChannelId: groupId,
      IsMaster: isMaster,
      SpaceId: groupId,
      IsBot: false,
      UserId: UserId,
      UserName: event.sender.nickname,
      UserKey,
      UserAvatar: UserAvatar,
      MessageId: String(event.message_id),
      MessageText: msg.trim(),
      OpenId: UserId,
      ReplyId,
      replyId: ReplyId,
      BotId: BotMe.id,
      _tag: 'message.create',
      value: event
    };

    cbp.send(e);
  });

  // 私聊消息
  client.on('DIRECT_MESSAGE', event => {
    const msg = getMessageText(event.message);
    const UserId = String(event.user_id);
    const UserAvatar = createUserAvatar(UserId);

    const [isMaster, UserKey] = getMaster(UserId);

    const ReplyId = event.message.find(item => item.type === 'reply')?.data?.id;

    // 定义消
    const e: PrivateEventMessageCreate = {
      name: 'private.message.create',
      Platform: platform,
      IsMaster: isMaster,
      IsBot: false,
      UserId: UserId,
      UserName: event.sender.nickname,
      UserKey,
      UserAvatar: UserAvatar,
      MessageId: String(event.message_id),
      MessageText: msg.trim(),
      OpenId: String(event.user_id),
      ReplyId,
      replyId: ReplyId,
      BotId: BotMe.id,
      _tag: 'private.message.create',
      value: event
    };

    cbp.send(e);
  });

  // 群成员增加
  client.on('NOTICE_GROUP_MEMBER_INCREASE', event => {
    const UserId = String(event.user_id);
    const UserAvatar = createUserAvatar(UserId);
    const [isMaster, UserKey] = getMaster(UserId);
    const groupId = String(event.group_id);

    const e: PublicEventMemberAdd = {
      name: 'member.add',
      Platform: platform,
      GuildId: groupId,
      ChannelId: groupId,
      SpaceId: groupId,
      UserId: UserId,
      UserKey,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      MessageId: '',
      BotId: BotMe.id,
      _tag: 'NOTICE_GROUP_MEMBER_INCREASE',
      value: event
    };

    cbp.send(e);
  });

  // 群成员减少
  client.on('NOTICE_GROUP_MEMBER_REDUCE', event => {
    const UserId = String(event.user_id);
    const UserAvatar = createUserAvatar(UserId);
    const [isMaster, UserKey] = getMaster(UserId);
    const groupId = String(event.group_id);

    const e: PublicEventMemberRemove = {
      name: 'member.remove',
      Platform: platform,
      GuildId: groupId,
      ChannelId: groupId,
      SpaceId: groupId,
      UserId: UserId,
      UserKey,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      MessageId: '',
      BotId: BotMe.id,
      _tag: 'NOTICE_GROUP_MEMBER_REDUCE',
      value: event
    };

    cbp.send(e);
  });

  // 好友添加请求
  client.on('REQUEST_ADD_FRIEND', event => {
    const UserId = String(event.user_id);
    const UserAvatar = createUserAvatar(UserId);
    const [isMaster, UserKey] = getMaster(UserId);

    const e: PrivateEventRequestFriendAdd = {
      name: 'private.friend.add',
      Platform: platform,
      UserId: UserId,
      UserKey,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      MessageId: String(event.flag ?? ''),
      BotId: BotMe.id,
      _tag: 'REQUEST_ADD_FRIEND',
      value: event
    };

    cbp.send(e);
  });

  // 入群请求
  client.on('REQUEST_ADD_GROUP', event => {
    const UserId = String(event.user_id);
    const UserAvatar = createUserAvatar(UserId);
    const [isMaster, UserKey] = getMaster(UserId);

    const e: PrivateEventRequestGuildAdd = {
      name: 'private.guild.add',
      Platform: platform,
      UserId: UserId,
      UserKey,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      MessageId: String(event.flag ?? ''),
      BotId: BotMe.id,
      _tag: 'REQUEST_ADD_GROUP',
      value: event
    };

    cbp.send(e);
  });

  // 群消息撤回
  client.on('NOTICE_GROUP_RECALL', event => {
    const groupId = String(event.group_id);

    const e: PublicEventMessageDelete = {
      name: 'message.delete',
      Platform: platform,
      GuildId: groupId,
      ChannelId: groupId,
      SpaceId: groupId,
      MessageId: String(event.message_id ?? ''),
      BotId: BotMe.id,
      _tag: 'NOTICE_GROUP_RECALL',
      value: event
    };

    cbp.send(e);
  });

  // 好友消息撤回
  client.on('NOTICE_FRIEND_RECALL', event => {
    const e: PrivateEventMessageDelete = {
      name: 'private.message.delete',
      Platform: platform,
      MessageId: String(event.message_id ?? ''),
      BotId: BotMe.id,
      _tag: 'NOTICE_FRIEND_RECALL',
      value: event
    };

    cbp.send(e);
  });

  // 群禁言
  client.on('NOTICE_GROUP_BAN', event => {
    const UserId = String(event.user_id);
    const UserAvatar = createUserAvatar(UserId);
    const [isMaster, UserKey] = getMaster(UserId);
    const groupId = String(event.group_id);

    if (event.sub_type === 'ban') {
      const e: PublicEventMemberBan = {
        name: 'member.ban',
        Platform: platform,
        GuildId: groupId,
        ChannelId: groupId,
        SpaceId: groupId,
        UserId: UserId,
        UserKey,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        MessageId: '',
        BotId: BotMe.id,
        _tag: 'NOTICE_GROUP_BAN',
        value: event
      };

      cbp.send(e);
    } else if (event.sub_type === 'lift_ban') {
      const e: PublicEventMemberUnban = {
        name: 'member.unban',
        Platform: platform,
        GuildId: groupId,
        ChannelId: groupId,
        SpaceId: groupId,
        UserId: UserId,
        UserKey,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        MessageId: '',
        BotId: BotMe.id,
        _tag: 'NOTICE_GROUP_BAN_LIFT',
        value: event
      };

      cbp.send(e);
    }
  });

  /**
   * @param val
   * @returns
   */
  const DataToMessage = async (val: DataEnums[] = []) => {
    // 空元素
    const empty = {
      type: 'text',
      data: {
        text: ''
      }
    };

    const message = await Promise.all(
      val.map(async item => {
        if (item.type === 'Text') {
          return {
            type: 'text',
            data: {
              text: item.value
            }
          };
        } else if (item.type === 'Mention') {
          const options = item.options || {};

          if (item.value === 'everyone' || item.value === 'all' || item.value === '' || typeof item.value !== 'string') {
            return {
              type: 'at',
              data: {
                qq: 'all',
                nickname: ''
              }
            };
          } else if (options.belong === 'user') {
            return {
              type: 'at',
              data: {
                qq: item.value
              }
            };
          }

          return empty;
        } else if (item.type === 'Image') {
          // 可能是 Buffer、https://、http://、base64://
          if (Buffer.isBuffer(item.value)) {
            return {
              type: 'image',
              data: {
                file: `base64://${item.value.toString('base64')}`
              }
            };
          }
          if (typeof item.value === 'string' && (item.value.startsWith('http://') || item.value.startsWith('https://'))) {
            const res = await getBufferByURL(item.value);

            return {
              type: 'image',
              data: {
                file: `base64://${res.toString('base64')}`
              }
            };
          } else if (item.value.startsWith('base64://')) {
            const base64Str = item.value.replace('base64://', '');

            return {
              type: 'image',
              data: {
                file: `base64://${base64Str}`
              }
            };
          } else if (item.value.startsWith('buffer://')) {
            const base64Str = item.value.replace('buffer://', '');

            return {
              type: 'image',
              data: {
                file: `base64://${base64Str}`
              }
            };
          } else if (item.value.startsWith('file://')) {
            const db = readFileSync(item.value.slice(7)); // 剥离 file:// 前缀

            return {
              type: 'image',
              data: {
                file: `base64://${db.toString('base64')}`
              }
            };
          }

          return {
            type: 'image',
            data: {
              file: `base64://${item.value}`
            }
          };
        } else if (item.type === 'ImageFile') {
          const db = readFileSync(item.value);

          return {
            type: 'image',
            data: {
              file: `base64://${db.toString('base64')}`
            }
          };
        } else if (item.type === 'ImageURL') {
          const db = await getBufferByURL(item.value);

          return {
            type: 'image',
            data: {
              file: `base64://${db.toString('base64')}`
            }
          };
        }

        // 降级处理：将 Markdown、Ark、Button、Link 等不支持的类型转为纯文本
        const hide = getOneBotConfig().hideUnsupported === true;
        const fallbackText = dataEnumToText(item, hide);

        if (fallbackText) {
          return {
            type: 'text',
            data: {
              text: fallbackText
            }
          };
        }

        return empty;
      })
    );

    return message;
  };

  /**
   *
   * @param ChannelId
   * @param val
   * @returns
   */
  const sendGroup = async (ChannelId: number, val: DataEnums[]) => {
    if (!val || val.length <= 0) {
      return [];
    }
    try {
      const message = await DataToMessage(val);
      const effectiveMessage = message.filter(m => !(m.type === 'text' && !m.data?.text));

      if (effectiveMessage.length <= 0) {
        if (getOneBotConfig().hideUnsupported === true) {
          logger.info('[onebot] hideUnsupported: 消息内容转换后为空，跳过发送');
        }

        return [];
      }

      const res = await client.sendGroupMessage({
        group_id: ChannelId,
        message: effectiveMessage
      });

      return [createResult(ResultCode.Ok, 'client.groupOpenMessages', res)];
    } catch (error) {
      return [createResult(ResultCode.Fail, 'client.groupOpenMessages', error)];
    }
  };

  /**
   *
   * @param UserId
   * @param val
   * @returns
   */
  const sendPrivate = async (UserId: number, val: DataEnums[]) => {
    if (!val || val.length <= 0) {
      return [];
    }
    try {
      const message = await DataToMessage(val);
      const effectiveMessage = message.filter(m => !(m.type === 'text' && !m.data?.text));

      if (effectiveMessage.length <= 0) {
        if (getOneBotConfig().hideUnsupported === true) {
          logger.info('[onebot] hideUnsupported: 消息内容转换后为空，跳过发送');
        }

        return [];
      }

      const res = await client.sendPrivateMessage({
        user_id: UserId,
        message: effectiveMessage
      });

      return [createResult(ResultCode.Ok, 'client.groupOpenMessages', res)];
    } catch (error) {
      return [createResult(ResultCode.Fail, 'client.groupOpenMessages', error)];
    }
  };

  const api = {
    active: {
      send: {
        channel: (SpaceId: string, val: DataEnums[]) => {
          return sendGroup(Number(SpaceId), val);
        },
        user: (OpenId: string, val: DataEnums[]) => {
          return sendPrivate(Number(OpenId), val);
        }
      }
    },
    use: {
      send: (
        event: {
          name: string;
          UserId?: string;
          ChannelId?: string;
        },
        val: DataEnums[]
      ) => {
        if (!val || val.length <= 0) {
          return [];
        }
        if (event['name'] === 'private.message.create') {
          const UserId = Number(event.UserId);

          return sendPrivate(UserId, val);
        } else if (event['name'] === 'message.create') {
          const GroupId = Number(event.ChannelId);

          return sendGroup(GroupId, val);
        }

        return Promise.all([]);
      },
      mention: event => {
        const e = event.value;
        const names = ['message.create', 'private.message.create'];

        if (names.includes(event.name)) {
          const Mentions: User[] = [];

          for (const item of e.message) {
            if (item.type === 'at') {
              let isBot = false;
              const UserId = String(item.data.qq);

              if (UserId === 'all') {
                continue;
              }
              if (UserId === BotMe.id) {
                isBot = true;
              }
              const [isMaster, UserKey] = getMaster(UserId);
              const avatar = createUserAvatar(UserId);

              Mentions.push({
                UserId: UserId,
                IsMaster: isMaster,
                UserKey: UserKey,
                UserName: item.data?.nickname,
                UserAvatar: avatar,
                IsBot: isBot
              });
            }
          }

          return new Promise<User[]>(resolve => resolve(Mentions));
        }

        return new Promise<User[]>(resolve => resolve([]));
      },
      delete(messageId: string) {
        return client.deleteMsg({ message_id: Number(messageId) });
      },
      file: {
        channel: client.uploadGroupFile.bind(client),
        user: client.uploadPrivateFile.bind(client)
      },
      forward: {
        channel: client.sendGroupForward.bind(client),
        user: client.sendPrivateForward.bind(client)
      }
    }
  };

  const onactions = async (data, consume) => {
    switch (data.action) {
      case 'me.info': {
        const res = await client.getLoginInfo();
        const UserId = String(res?.user_id);
        const [isMaster, UserKey] = getMaster(UserId);
        const user: User = {
          UserId: UserId,
          UserName: res?.nickname,
          IsBot: true,
          IsMaster: isMaster,
          UserAvatar: '',
          UserKey: UserKey
        };

        return consume([createResult(ResultCode.Ok, '请求完成', user)]);
      }
      case 'message.send': {
        const event = data.payload.event;
        const paramFormat = data.payload.params.format;
        const res = await api.use.send(event, paramFormat);

        return consume(res);
      }
      case 'message.send.channel': {
        const ChannelId = data.payload.ChannelId;
        const val = data.payload.params.format;
        const res = await api.active.send.channel(ChannelId, val);

        return consume(res);
      }
      case 'message.send.user': {
        const UserId = data.payload.UserId;
        const val = data.payload.params.format;
        const res = await api.active.send.user(UserId, val);

        return consume(res);
      }
      case 'mention.get': {
        const event = data.payload.event;
        const res = await api.use.mention(event);

        return consume([createResult(ResultCode.Ok, '请求完成', res)]);
      }
      case 'message.delete': {
        const res = await api.use
          .delete(data.payload.MessageId)
          .then(res => createResult(ResultCode.Ok, data.action, res))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'file.send.channel': {
        const res = await api.use.file
          .channel(data.payload.ChannelId, data.payload.params)
          .then(res => createResult(ResultCode.Ok, data.action, res))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'file.send.user': {
        const res = await api.use.file
          .user(data.payload.UserId, data.payload.params)
          .then(res => createResult(ResultCode.Ok, data.action, res))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'message.forward.channel': {
        const params = await Promise.all(
          data.payload.params.map(async i => ({
            ...i,
            content: await DataToMessage(i.content)
          }))
        );
        const res = await api.use.forward
          .channel(data.payload.ChannelId, params)
          .then(res => createResult(ResultCode.Ok, data.action, res))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'message.forward.user': {
        const params = await Promise.all(
          data.payload.params.map(async i => ({
            ...i,
            content: await DataToMessage(i.content)
          }))
        );
        const res = await api.use.forward
          .user(data.payload.UserId, params)
          .then(res => createResult(ResultCode.Ok, data.action, res))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      default: {
        return consume([createResult(ResultCode.Fail, '未知请求，请尝试升级版本', null)]);
      }
    }
  };

  cbp.onactions((data, consume) => void onactions(data, consume));

  const onapis = async (data, consume) => {
    const key = data.payload?.key;

    if (client[key]) {
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

  // 处理 api 调用
  cbp.onapis((data, consume) => void onapis(data, consume));
};

export default definePlatform({ main });

import {
  cbpPlatform,
  createResult,
  DataEnums,
  PrivateEventInteractionCreate,
  PrivateEventMessageCreate,
  PrivateEventMessageDelete,
  PrivateEventRequestFriendAdd,
  PublicEventChannelCreate,
  PublicEventChannelDelete,
  PublicEventGuildExit,
  PublicEventGuildJoin,
  PublicEventInteractionCreate,
  PublicEventMemberAdd,
  PublicEventMemberRemove,
  PublicEventMessageCreate,
  PublicEventMessageDelete,
  PublicEventMessageReactionAdd,
  PublicEventMessageReactionRemove,
  ResultCode
} from 'alemonjs';
import { QQBotClients } from './sdk/client.websoket';
import { User } from 'alemonjs';
import { AT_MESSAGE_CREATE_TYPE } from './message/AT_MESSAGE_CREATE';
import { AT_MESSAGE_CREATE, C2C_MESSAGE_CREATE, DIRECT_MESSAGE_CREATE, GROUP_AT_MESSAGE_CREATE, MESSAGE_CREATE } from './sends';
import { getMaster, getQQBotConfig } from './config';
import { platform } from './config';

export const register = (client: QQBotClients) => {
  const config = getQQBotConfig();

  // 机器人Id
  const botId = String(config?.app_id ?? '');
  /**
   * 连接 alemonjs 服务器。
   * 向 alemonjs 推送标准信息
   */
  const port = process.env?.port || config?.port || 17117;
  const url = `ws://127.0.0.1:${port}`;
  const cbp = cbpPlatform(url);

  /**
   * group
   *
   * GROUP_AT_MESSAGE_CREATE
   * C2C_MESSAGE_CREATE
   */

  const createUserAvatarURL = (authorId: string) => {
    return `https://q.qlogo.cn/qqapp/${config.app_id}/${authorId}/640`;
  };

  client.on('GROUP_ADD_ROBOT', event => {
    // 机器人加入群组
    const e: PublicEventGuildJoin = {
      name: 'guild.join',
      Platform: platform,
      GuildId: event.group_openid,
      ChannelId: event.group_openid,
      SpaceId: `GROUP:${event.group_openid}`,
      UserId: event.op_member_openid,
      UserKey: event.op_member_openid,
      UserAvatar: createUserAvatarURL(event.op_member_openid),
      IsMaster: false,
      IsBot: false,
      OpenId: `C2C:${event.op_member_openid}`,
      MessageId: '',
      BotId: botId,
      _tag: 'GROUP_ADD_ROBOT',
      value: event
    };

    cbp.send(e);
  });

  client.on('GROUP_DEL_ROBOT', event => {
    // 机器人离开群组
    const e: PublicEventGuildExit = {
      name: 'guild.exit',
      Platform: platform,
      GuildId: event.group_openid,
      ChannelId: event.group_openid,
      SpaceId: `GROUP:${event.group_openid}`,
      UserId: event.op_member_openid,
      UserKey: event.op_member_openid,
      UserAvatar: createUserAvatarURL(event.op_member_openid),
      IsMaster: false,
      IsBot: false,
      OpenId: `C2C:${event.op_member_openid}`,
      MessageId: '',
      BotId: botId,
      _tag: 'GROUP_DEL_ROBOT',
      value: event
    };

    cbp.send(e);
  });

  // 监听消息
  client.on('GROUP_AT_MESSAGE_CREATE', event => {
    const UserId = event.author.id;
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = createUserAvatarURL(event.author.id);

    // 定义消
    const e: PublicEventMessageCreate = {
      name: 'message.create',
      Platform: platform,
      // guild
      GuildId: event.group_id,
      ChannelId: event.group_id,
      SpaceId: `GROUP:${event.group_id}`,
      // 用户Id
      UserId: event.author.id,
      UserKey,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      // 格式化数据
      MessageId: event.id,
      MessageText: event.content?.trim(),
      OpenId: `C2C:${event.author.member_openid}`,
      BotId: botId,
      _tag: 'GROUP_AT_MESSAGE_CREATE',
      value: event
    };

    cbp.send(e);
  });

  client.on('C2C_MESSAGE_CREATE', event => {
    const UserId = event.author.id;
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = createUserAvatarURL(event.author.id);

    // 定义消
    const e: PrivateEventMessageCreate = {
      name: 'private.message.create',
      // 事件类型
      Platform: platform,
      // 用户Id
      UserId: event.author.id,
      UserKey,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      // 格式化数据
      MessageId: event.id,
      MessageText: event.content?.trim(),
      OpenId: `C2C:${event.author.user_openid}`,
      //
      BotId: botId,
      _tag: 'C2C_MESSAGE_CREATE',
      value: event
    };

    cbp.send(e);
  });

  /**
   * guild
   */

  client.on('DIRECT_MESSAGE_CREATE', event => {
    // 屏蔽其他机器人的消息
    if (event?.author?.bot) {
      return;
    }

    const msg = event?.content ?? '';

    const UserAvatar = event?.author?.avatar;

    const UserId = event.author.id;

    const [isMaster, UserKey] = getMaster(UserId);

    // 定义消
    const e: PrivateEventMessageCreate = {
      name: 'private.message.create',
      // 事件类型
      Platform: platform,
      // 用户Id
      UserId: event?.author?.id ?? '',
      UserKey,
      UserName: event?.author?.username ?? '',
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: event.author?.bot,
      // message
      MessageId: event.id,
      MessageText: msg?.trim(),
      OpenId: `DIRECT:${event.guild_id}`,
      //
      BotId: botId,
      _tag: 'DIRECT_MESSAGE_CREATE',
      value: event
    };

    cbp.send(e);
  });

  // 监听消息
  client.on('AT_MESSAGE_CREATE', event => {
    // 屏蔽其他机器人的消息
    if (event?.author?.bot) {
      return;
    }

    const msg = getMessageContent(event);

    const UserAvatar = event?.author?.avatar;

    const UserId = event.author.id;

    const [isMaster, UserKey] = getMaster(UserId);

    // 定义消
    const e: PublicEventMessageCreate = {
      name: 'message.create',
      // 事件类型
      Platform: platform,
      GuildId: event.guild_id,
      ChannelId: event.channel_id,
      SpaceId: `GUILD:${event.channel_id}`,
      IsMaster: isMaster,
      // 用户Id
      UserId: event?.author?.id ?? '',
      UserKey,
      UserName: event?.author?.username ?? '',
      UserAvatar: UserAvatar,
      IsBot: event.author?.bot,
      // message
      MessageId: event.id,
      MessageText: msg?.trim(),
      OpenId: `DIRECT:${event.guild_id}`,
      //
      BotId: botId,
      _tag: 'AT_MESSAGE_CREATE',
      value: event
    };

    cbp.send(e);
  });

  /**
   *
   * @param event
   * @returns
   */
  const getMessageContent = event => {
    let msg = event?.content ?? '';
    // 艾特消息处理
    const atUsers: {
      id: string;
    }[] = [];

    if (event.mentions) {
      // 去掉@ 转为纯消息
      for (const item of event.mentions) {
        atUsers.push({
          id: item.id
        });
      }
      // 循环删除文本中的at信息并去除前后空格
      atUsers.forEach(item => {
        msg = msg.replace(`<@!${item.id}>`, '').trim();
      });
    }

    return msg;
  };

  // 私域 -
  client.on('MESSAGE_CREATE', event => {
    // 屏蔽其他机器人的消息
    if (event.author?.bot) {
      return;
    }

    // 撤回消息
    if (new RegExp(/DELETE$/).test(event.eventType)) {
      return;
    }
    const UserId = event.author.id;
    const msg = getMessageContent(event);
    const UserAvatar = event?.author?.avatar;

    const [isMaster, UserKey] = getMaster(UserId);

    // 定义消
    const e: PublicEventMessageCreate = {
      name: 'message.create',
      // 事件类型
      Platform: platform,
      //
      GuildId: event.guild_id,
      ChannelId: event.channel_id,
      SpaceId: `GUILD:${event.channel_id}`,
      UserId: event?.author?.id ?? '',
      UserKey,
      UserName: event?.author?.username ?? '',
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      // message
      MessageId: event.id,
      MessageText: msg?.trim(),
      OpenId: `DIRECT:${event.guild_id}`,
      //
      BotId: botId,
      _tag: 'MESSAGE_CREATE',
      value: event
    };

    cbp.send(e);
  });

  client.on('INTERACTION_CREATE', event => {
    // try {
    //   if (event.scene === 'group' || event.scene === 'c2c') {
    //     await client.interactionResponse('group', event.id)
    //   }
    //   else if (event.scene === 'guild') {
    //     await client.interactionResponse('guild', event.id)
    //   }
    // } catch (err) {
    //   createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)
    // }

    if (event.scene === 'group') {
      const UserAvatar = createUserAvatarURL(event.group_member_openid);

      const UserId = event.group_member_openid;

      const [isMaster, UserKey] = getMaster(UserId);

      const MessageText = event.data.resolved.button_data?.trim() || '';

      const e: PublicEventInteractionCreate = {
        name: 'interaction.create',
        Platform: platform,
        // guild
        GuildId: event.group_openid,
        ChannelId: event.group_openid,
        SpaceId: `GROUP:${event.group_openid}`,
        // 用户Id
        UserId: event.group_member_openid,
        UserKey,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        // 格式化数据
        MessageId: `INTERACTION_CREATE:${event.id}`,
        MessageText: MessageText,
        OpenId: `C2C:${event.group_member_openid}`,
        BotId: botId,
        _tag: 'INTERACTION_CREATE_GROUP',
        value: event
      };

      cbp.send(e);
    } else if (event.scene === 'c2c') {
      const UserAvatar = createUserAvatarURL(event.user_openid);

      const UserId = event.user_openid;

      const [isMaster, UserKey] = getMaster(UserId);

      const MessageText = event.data.resolved.button_data?.trim() || '';

      // 处理消息
      const e: PrivateEventInteractionCreate = {
        name: 'private.interaction.create',
        Platform: platform,
        // 用户Id
        UserId: event.user_openid,
        UserKey,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        // 格式化数据
        MessageId: event.id,
        MessageText: MessageText,
        OpenId: `C2C:${event.user_openid}`,
        BotId: botId,
        _tag: 'INTERACTION_CREATE_C2C',
        value: event
      };

      cbp.send(e);
    } else if (event.scene === 'guild') {
      const UserAvatar = createUserAvatarURL(event.data.resolved.user_id);
      const UserId = event.data.resolved.user_id;

      const [isMaster, UserKey] = getMaster(UserId);

      const MessageText = event.data.resolved.button_data?.trim() || '';
      // 处理消息
      const e: PublicEventInteractionCreate = {
        name: 'interaction.create',
        Platform: platform,
        // guild
        GuildId: event.guild_id,
        ChannelId: event.channel_id,
        SpaceId: `GUILD:${event.channel_id}`,
        // 用户Id
        UserId: event.data.resolved.user_id,
        UserKey,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        // 格式化数据
        MessageId: event.data.resolved.message_id,
        MessageText: MessageText,
        OpenId: `DIRECT:${event.guild_id}`,
        BotId: botId,
        _tag: 'INTERACTION_CREATE_GUILD',
        value: event
      };

      cbp.send(e);
    } else {
      logger.warn({
        code: ResultCode.Fail,
        message: '暂未更新支持此类型的交互事件',
        data: event
      });
    }
  });

  // 频道消息删除（私域）
  client.on('MESSAGE_DELETE', event => {
    const msg = event?.message ?? event;
    const e: PublicEventMessageDelete = {
      name: 'message.delete',
      Platform: platform,
      GuildId: msg?.guild_id ?? '',
      ChannelId: msg?.channel_id ?? '',
      SpaceId: `GUILD:${msg?.channel_id ?? ''}`,
      MessageId: msg?.id ?? '',
      BotId: botId,
      _tag: 'MESSAGE_DELETE',
      value: event
    };

    cbp.send(e);
  });

  // 公域消息删除
  client.on('PUBLIC_MESSAGE_DELETE', event => {
    const msg = event.message;
    const e: PublicEventMessageDelete = {
      name: 'message.delete',
      Platform: platform,
      GuildId: msg.guild_id ?? '',
      ChannelId: msg.channel_id ?? '',
      SpaceId: `GUILD:${msg.channel_id ?? ''}`,
      MessageId: msg.id ?? '',
      BotId: botId,
      _tag: 'PUBLIC_MESSAGE_DELETE',
      value: event
    };

    cbp.send(e);
  });

  // 频道私聊消息删除
  client.on('DIRECT_MESSAGE_DELETE', event => {
    const msg = event.message;
    const e: PrivateEventMessageDelete = {
      name: 'private.message.delete',
      Platform: platform,
      MessageId: msg.id ?? '',
      BotId: botId,
      _tag: 'DIRECT_MESSAGE_DELETE',
      value: event
    };

    cbp.send(e);
  });

  // 表情表态 - 添加
  client.on('MESSAGE_REACTION_ADD', event => {
    const e: PublicEventMessageReactionAdd = {
      name: 'message.reaction.add',
      Platform: platform,
      GuildId: event.guild_id ?? '',
      ChannelId: event.channel_id ?? '',
      SpaceId: `GUILD:${event.channel_id ?? ''}`,
      MessageId: event.target?.id ?? '',
      BotId: botId,
      _tag: 'MESSAGE_REACTION_ADD',
      value: event
    };

    cbp.send(e);
  });

  // 表情表态 - 移除
  client.on('MESSAGE_REACTION_REMOVE', event => {
    const e: PublicEventMessageReactionRemove = {
      name: 'message.reaction.remove',
      Platform: platform,
      GuildId: event.guild_id ?? '',
      ChannelId: event.channel_id ?? '',
      SpaceId: `GUILD:${event.channel_id ?? ''}`,
      MessageId: event.target?.id ?? '',
      BotId: botId,
      _tag: 'MESSAGE_REACTION_REMOVE',
      value: event
    };

    cbp.send(e);
  });

  // 子频道创建
  client.on('CHANNEL_CREATE', event => {
    const e: PublicEventChannelCreate = {
      name: 'channel.create',
      Platform: platform,
      GuildId: event.guild_id ?? '',
      ChannelId: event.id ?? '',
      SpaceId: `GUILD:${event.guild_id ?? ''}`,
      MessageId: '',
      BotId: botId,
      _tag: 'CHANNEL_CREATE',
      value: event
    };

    cbp.send(e);
  });

  // 子频道删除
  client.on('CHANNEL_DELETE', event => {
    const e: PublicEventChannelDelete = {
      name: 'channel.delete',
      Platform: platform,
      GuildId: event.guild_id ?? '',
      ChannelId: event.id ?? '',
      SpaceId: `GUILD:${event.guild_id ?? ''}`,
      MessageId: '',
      BotId: botId,
      _tag: 'CHANNEL_DELETE',
      value: event
    };

    cbp.send(e);
  });

  // 服务器创建（机器人加入频道）
  client.on('GUILD_CREATE', event => {
    const e: PublicEventGuildJoin = {
      name: 'guild.join',
      Platform: platform,
      GuildId: event.id ?? '',
      ChannelId: '',
      SpaceId: `GUILD:${event.id ?? ''}`,
      UserId: event.op_user_id ?? '',
      UserKey: '',
      IsMaster: false,
      IsBot: false,
      MessageId: '',
      BotId: botId,
      _tag: 'GUILD_CREATE',
      value: event
    };

    cbp.send(e);
  });

  // 服务器删除（机器人退出频道）
  client.on('GUILD_DELETE', event => {
    const e: PublicEventGuildExit = {
      name: 'guild.exit',
      Platform: platform,
      GuildId: event.id ?? '',
      ChannelId: '',
      SpaceId: `GUILD:${event.id ?? ''}`,
      UserId: event.op_user_id ?? '',
      UserKey: '',
      IsMaster: false,
      IsBot: false,
      MessageId: '',
      BotId: botId,
      _tag: 'GUILD_DELETE',
      value: event
    };

    cbp.send(e);
  });

  // 频道成员加入
  client.on('GUILD_MEMBER_ADD', event => {
    const UserId = event.user?.id ?? '';
    const [isMaster, UserKey] = getMaster(UserId);

    const e: PublicEventMemberAdd = {
      name: 'member.add',
      Platform: platform,
      GuildId: event.guild_id ?? '',
      ChannelId: '',
      SpaceId: `GUILD:${event.guild_id ?? ''}`,
      UserId: UserId,
      UserKey,
      UserName: event.user?.username ?? '',
      UserAvatar: createUserAvatarURL(UserId),
      IsMaster: isMaster,
      IsBot: false,
      MessageId: '',
      BotId: botId,
      _tag: 'GUILD_MEMBER_ADD',
      value: event
    };

    cbp.send(e);
  });

  // 频道成员移除
  client.on('GUILD_MEMBER_REMOVE', event => {
    const UserId = event.user?.id ?? '';
    const [isMaster, UserKey] = getMaster(UserId);

    const e: PublicEventMemberRemove = {
      name: 'member.remove',
      Platform: platform,
      GuildId: event.guild_id ?? '',
      ChannelId: '',
      SpaceId: `GUILD:${event.guild_id ?? ''}`,
      UserId: UserId,
      UserKey,
      UserName: event.user?.username ?? '',
      UserAvatar: createUserAvatarURL(UserId),
      IsMaster: isMaster,
      IsBot: false,
      MessageId: '',
      BotId: botId,
      _tag: 'GUILD_MEMBER_REMOVE',
      value: event
    };

    cbp.send(e);
  });

  // 好友添加
  client.on('FRIEND_ADD', event => {
    const e: PrivateEventRequestFriendAdd = {
      name: 'private.friend.add',
      Platform: platform,
      UserId: event.openid ?? '',
      UserKey: '',
      IsMaster: false,
      IsBot: false,
      MessageId: '',
      BotId: botId,
      _tag: 'FRIEND_ADD',
      value: event
    };

    cbp.send(e);
  });

  client.on('ERROR', console.error);

  const api = {
    active: {
      send: {
        channel: async (SpaceId: string, val: DataEnums[]) => {
          if (/^GUILD:/.test(SpaceId)) {
            const id = SpaceId.replace('GUILD:', '');

            return await AT_MESSAGE_CREATE(
              client,
              {
                ChannelId: id
              },
              val
            );
          }
          if (/^GROUP:/.test(SpaceId)) {
            const id = SpaceId.replace('GROUP:', '');

            return await GROUP_AT_MESSAGE_CREATE(
              client,
              {
                ChannelId: id
              },
              val
            );
          }

          return [];
        },
        user: async (OpenId: string, val: DataEnums[]) => {
          if (/^C2C:/.test(OpenId)) {
            const id = OpenId.replace('C2C:', '');

            return await C2C_MESSAGE_CREATE(
              client,
              {
                UserId: id
              },
              val
            );
          } else if (/^DIRECT:/.test(OpenId)) {
            const id = OpenId.replace('DIRECT:', '');

            return await DIRECT_MESSAGE_CREATE(
              client,
              {
                UserId: id
              },
              val
            );
          } else if (/^GUILD:/.test(OpenId)) {
            const id = OpenId.replace('GUILD:', '');

            return await AT_MESSAGE_CREATE(
              client,
              {
                ChannelId: id
              },
              val
            );
          }

          return [];
        }
      }
    },
    use: {
      send: async (
        event: {
          _tag: string;
          ChannelId: string;
          UserId: string;
          MessageId?: string;
        },
        val: DataEnums[]
      ) => {
        if (!val || val.length <= 0) {
          return [];
        }
        // 打  tag
        const tag = event._tag;

        // 群at
        if (tag === 'GROUP_AT_MESSAGE_CREATE') {
          return await GROUP_AT_MESSAGE_CREATE(client, event, val);
        }
        // 私聊
        if (tag === 'C2C_MESSAGE_CREATE') {
          return await C2C_MESSAGE_CREATE(client, event, val);
        }
        // 频道私聊
        if (tag === 'DIRECT_MESSAGE_CREATE') {
          return await DIRECT_MESSAGE_CREATE(client, event, val);
        }
        // 频道at
        if (tag === 'AT_MESSAGE_CREATE') {
          return await AT_MESSAGE_CREATE(client, event, val);
        }
        // 频道消息
        if (tag === 'MESSAGE_CREATE') {
          return await MESSAGE_CREATE(client, event, val);
        }
        // 交互
        if (tag === 'INTERACTION_CREATE_GROUP') {
          return await GROUP_AT_MESSAGE_CREATE(client, event, val);
        }
        if (tag === 'INTERACTION_CREATE_C2C') {
          return await C2C_MESSAGE_CREATE(client, event, val);
        }
        if (tag === 'INTERACTION_CREATE_GUILD') {
          return await AT_MESSAGE_CREATE(client, event, val);
        }

        return [];
      },
      mention: event => {
        const value = event.value || {};
        const tag = event._tag;
        // const event = e.value
        const Metions: User[] = [];

        // group
        if (tag === 'GROUP_AT_MESSAGE_CREATE' || tag === 'C2C_MESSAGE_CREATE') {
          // return Metions;
          return new Promise<User[]>(resolve => resolve(Metions));
        }
        // guild
        if (value.mentions) {
          const mentions: AT_MESSAGE_CREATE_TYPE['mentions'] = event.value['mentions'];
          // 艾特消息处理
          const MessageMention: User[] = mentions.map(item => {
            const UserId = item.id;
            const [isMaster, UserKey] = getMaster(UserId);

            return {
              UserId: item.id,
              IsMaster: isMaster,
              UserName: item.username,
              IsBot: item.bot,
              UserKey: UserKey
            };
          });

          // return MessageMention;
          return new Promise<User[]>(resolve => resolve(MessageMention));
        } else {
          // return Metions;
          return new Promise<User[]>(resolve => resolve(Metions));
        }
      }
    }
  };

  const onactions = async (data, consume) => {
    try {
      // 新增action，用于获取机器人本身的信息
      if (data.action === 'me.info') {
        // TODO 当前api似乎仅适用于guilds模式
        const res = await client.usersMe();
        const UserId = res.id;
        const [isMaster, UserKey] = getMaster(UserId);

        const botInfo: User = {
          UserId: res?.id,
          UserName: res?.username,
          UserAvatar: createUserAvatarURL(res?.id),
          IsBot: true,
          IsMaster: isMaster,
          UserKey: UserKey
        };

        consume([createResult(ResultCode.Ok, '请求完成', botInfo)]);
      } else if (data.action === 'message.send') {
        // 消息发送
        const event = data.payload.event;
        const paramFormat = data.payload.params.format;
        // 消费
        const res = await api.use.send(event, paramFormat);

        consume(res);
      } else if (data.action === 'mention.get') {
        const event = data.payload.event;
        // 获取提及
        const metions = await api.use.mention(event);

        // 消费
        consume([createResult(ResultCode.Ok, '请求完成', metions)]);
      } else if (data.action === 'message.send.channel') {
        // 主动发送消息到频道
        const channelId = data.payload.ChannelId;
        const paramFormat = data.payload.params.format;
        const res = await api.active.send.channel(channelId, paramFormat);

        consume(res);
      } else if (data.action === 'message.send.user') {
        // 主动发送消息到用户
        const userId = data.payload.UserId;
        const paramFormat = data.payload.params.format;
        const res = await api.active.send.user(userId, paramFormat);

        consume(res);
      } else {
        consume([createResult(ResultCode.Fail, '未知请求，请尝试升级版本', null)]);
      }
    } catch (error) {
      consume([createResult(ResultCode.Fail, '请求失败', error)]);
    }
  };

  // 处理行为
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

import {
  cbpPlatform,
  createResult,
  DataEnums,
  PrivateEventInteractionCreate,
  PrivateEventMessageCreate,
  PrivateEventMessageDelete,
  PrivateEventNoticeCreate,
  PrivateEventRequestFriendAdd,
  PrivateEventRequestFriendRemove,
  PublicEventChannelCreate,
  PublicEventChannelDelete,
  PublicEventChannelUpdate,
  PublicEventGuildExit,
  PublicEventGuildJoin,
  PublicEventGuildUpdate,
  PublicEventInteractionCreate,
  PublicEventMemberAdd,
  PublicEventMemberRemove,
  PublicEventMemberUpdate,
  PublicEventMessageCreate,
  PublicEventMessageDelete,
  PublicEventMessageReactionAdd,
  PublicEventMessageReactionRemove,
  PublicEventNoticeCreate,
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

  // 频道成员资料变更
  client.on('GUILD_MEMBER_UPDATE', event => {
    const UserId = event.user?.id ?? '';
    const [isMaster, UserKey] = getMaster(UserId);

    const e: PublicEventMemberUpdate = {
      name: 'member.update',
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
      _tag: 'GUILD_MEMBER_UPDATE',
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

  // 好友删除
  client.on('FRIEND_DEL', event => {
    const e: PrivateEventRequestFriendRemove = {
      name: 'private.friend.remove',
      Platform: platform,
      UserId: event.openid ?? '',
      UserKey: '',
      IsMaster: false,
      IsBot: false,
      MessageId: '',
      BotId: botId,
      _tag: 'FRIEND_DEL',
      value: event
    };

    cbp.send(e);
  });

  // 子频道更新
  client.on('CHANNEL_UPDATE', event => {
    const e: PublicEventChannelUpdate = {
      name: 'channel.update',
      Platform: platform,
      GuildId: event.guild_id ?? '',
      ChannelId: event.id ?? '',
      SpaceId: `GUILD:${event.guild_id ?? ''}`,
      MessageId: '',
      BotId: botId,
      _tag: 'CHANNEL_UPDATE',
      value: event
    };

    cbp.send(e);
  });

  // 频道信息更新
  client.on('GUILD_UPDATE', event => {
    const e: PublicEventGuildUpdate = {
      name: 'guild.update',
      Platform: platform,
      GuildId: event.id ?? '',
      ChannelId: '',
      SpaceId: `GUILD:${event.id ?? ''}`,
      MessageId: '',
      BotId: botId,
      _tag: 'GUILD_UPDATE',
      value: event
    };

    cbp.send(e);
  });

  // 群消息推送开启
  client.on('GROUP_MSG_RECEIVE', event => {
    const e: PublicEventNoticeCreate = {
      name: 'notice.create',
      Platform: platform,
      GuildId: event.group_openid,
      ChannelId: event.group_openid,
      SpaceId: `GROUP:${event.group_openid}`,
      UserId: event.op_member_openid,
      UserKey: '',
      IsMaster: false,
      IsBot: false,
      MessageId: `group_msg_receive_${event.group_openid}_${event.timestamp}`,
      MessageText: '',
      OpenId: `C2C:${event.op_member_openid}`,
      BotId: botId,
      _tag: 'GROUP_MSG_RECEIVE',
      value: event
    };

    cbp.send(e);
  });

  // 群消息推送关闭
  client.on('GROUP_MSG_REJECT', event => {
    const e: PublicEventNoticeCreate = {
      name: 'notice.create',
      Platform: platform,
      GuildId: event.group_openid,
      ChannelId: event.group_openid,
      SpaceId: `GROUP:${event.group_openid}`,
      UserId: event.op_member_openid,
      UserKey: '',
      IsMaster: false,
      IsBot: false,
      MessageId: `group_msg_reject_${event.group_openid}_${event.timestamp}`,
      MessageText: '',
      OpenId: `C2C:${event.op_member_openid}`,
      BotId: botId,
      _tag: 'GROUP_MSG_REJECT',
      value: event
    };

    cbp.send(e);
  });

  // C2C消息推送开启
  client.on('C2C_MSG_RECEIVE', event => {
    const e: PrivateEventNoticeCreate = {
      name: 'private.notice.create',
      Platform: platform,
      UserId: event.openid ?? '',
      UserKey: '',
      IsMaster: false,
      IsBot: false,
      MessageId: `c2c_msg_receive_${event.openid}_${event.timestamp}`,
      BotId: botId,
      _tag: 'C2C_MSG_RECEIVE',
      value: event
    };

    cbp.send(e);
  });

  // C2C消息推送关闭
  client.on('C2C_MSG_REJECT', event => {
    const e: PrivateEventNoticeCreate = {
      name: 'private.notice.create',
      Platform: platform,
      UserId: event.openid ?? '',
      UserKey: '',
      IsMaster: false,
      IsBot: false,
      MessageId: `c2c_msg_reject_${event.openid}_${event.timestamp}`,
      BotId: botId,
      _tag: 'C2C_MSG_REJECT',
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
      } else if (data.action === 'message.delete') {
        // ─── 消息管理 ───
        const channelId = data.payload.ChannelId;
        const messageId = data.payload.MessageId;
        // 频道子频道消息撤回
        const res = await client
          .channelsMessagesDelete(channelId, messageId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'message.pin') {
        const res = await client
          .channelsPinsPut(data.payload.ChannelId, data.payload.MessageId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'message.unpin') {
        const res = await client
          .channelsPinsDelete(data.payload.ChannelId, data.payload.MessageId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'reaction.add') {
        // ─── 表情回应 ───
        // QQ Bot表情表态 type: 1=emoji, 2=emoji_id
        const res = await client
          .channelsMessagesReactionsPut(data.payload.ChannelId, data.payload.MessageId, 1, data.payload.EmojiId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'reaction.remove') {
        const res = await client
          .channelsMessagesReactionsDelete(data.payload.ChannelId, data.payload.MessageId, 1, data.payload.EmojiId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'message.get') {
        // ─── 消息获取 ───
        const res = await client
          .channelsMessagesById(data.payload.ChannelId, data.payload.MessageId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.info') {
        // ─── 成员管理 ───
        const guildId = data.payload.params?.guildId ?? data.payload.GuildId;
        const userId = data.payload.params?.userId ?? data.payload.UserId;
        const res = await client
          .guildsMembersMessage(guildId, userId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.list') {
        const guildId = data.payload.GuildId;
        const after = data.payload.params?.After ?? '0';
        const limit = data.payload.params?.Limit ?? 100;
        const res = await client
          .guildsMembers(guildId, { after, limit })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.kick') {
        const res = await client
          .guildsMembersDelete(data.payload.GuildId, data.payload.UserId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.ban') {
        // QQ频道使用禁言作为ban
        const guildId = data.payload.GuildId;
        const userId = data.payload.UserId;
        const duration = data.payload.params?.duration ?? 0;
        const mute_seconds = String(duration > 0 ? duration : 604800);
        const res = await client
          .guildsMemberMute(guildId, userId, { mute_seconds })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.unban') {
        const res = await client
          .guildsMemberMute(data.payload.GuildId, data.payload.UserId, { mute_seconds: '0' })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.mute') {
        // ─── 成员禁言 ───
        const guildId = data.payload.GuildId;
        const userId = data.payload.UserId;
        const duration = data.payload.params?.duration ?? 0;
        const mute_seconds = String(duration);
        const res = await client
          .guildsMemberMute(guildId, userId, { mute_seconds })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'guild.info') {
        // ─── 服务器 ───
        const res = await client
          .guilds(data.payload.GuildId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'guild.list') {
        const res = await client
          .usersMeGuilds({ before: '', after: '', limit: 100 })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'guild.mute') {
        // ─── 全员禁言 ───
        const guildId = data.payload.GuildId;
        const duration = data.payload.params?.duration ?? 0;
        const mute_seconds = String(duration);
        const res = await client
          .guildsMuteAll(guildId, { mute_seconds })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.info') {
        // ─── 频道管理 ───
        const res = await client
          .channels(data.payload.ChannelId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.list') {
        const res = await client
          .guildsChannels(data.payload.GuildId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.create') {
        const guildId = data.payload.GuildId;
        const params = data.payload.params;
        const res = await client
          .guildsChannelsCreate(guildId, { name: params.name, type: params.type ? Number(params.type) : 0, position: 0, parent_id: params.parentId ?? '' })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.update') {
        const channelId = data.payload.ChannelId;
        const params = data.payload.params;
        const res = await client
          .guildsChannelsUpdate(channelId, { name: params.name ?? '', position: params.position ?? 0 })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.delete') {
        const res = await client
          .guildsChannelsdelete(data.payload.ChannelId, {})
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.list') {
        // ─── 角色管理 ───
        const res = await client
          .guildsRoles(data.payload.GuildId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.create') {
        const params = data.payload.params;
        const res = await client
          .guildsRolesPost(data.payload.GuildId, { name: params.name, color: params.color })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.update') {
        const params = data.payload.params;
        const res = await client
          .guildsRolesPatch(data.payload.GuildId, data.payload.RoleId, { name: params.name, color: params.color })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.delete') {
        const res = await client
          .guildsRolesDelete(data.payload.GuildId, data.payload.RoleId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.assign') {
        // QQ Bot角色分配需要channel_id, 这里传空字符串使用默认
        const res = await client
          .guildsRolesMembersPut(data.payload.GuildId, '', data.payload.UserId, data.payload.RoleId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.remove') {
        const res = await client
          .guildsRolesMembersDelete(data.payload.GuildId, '', data.payload.UserId, data.payload.RoleId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'file.send.channel') {
        // ─── 文件发送 ───
        const res = await client
          .postRichMediaByGroup(data.payload.ChannelId, {
            file_type: data.payload.params?.file_type ?? 1,
            url: data.payload.params?.url,
            file_data: data.payload.params?.file_data,
            srv_send_msg: data.payload.params?.srv_send_msg ?? false
          })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'file.send.user') {
        const res = await client
          .postRichMediaByUser(data.payload.UserId, {
            file_type: data.payload.params?.file_type ?? 1,
            url: data.payload.params?.url,
            file_data: data.payload.params?.file_data,
            srv_send_msg: data.payload.params?.srv_send_msg ?? false
          })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'me.guilds') {
        // ─── me ───
        const res = await client
          .usersMeGuilds({ before: '', after: '', limit: 100 })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'media.send.channel') {
        // ─── 媒体 ───
        // QQ-Bot 频道暂不支持独立媒体发送，使用消息通道
        consume([createResult(ResultCode.Warn, 'media.send.channel not directly supported, use message.send with format', null)]);
      } else if (data.action === 'media.send.user') {
        const userId = data.payload.UserId;
        const params = data.payload.params;
        const fileType = params?.type === 'image' ? 1 : params?.type === 'video' ? 2 : params?.type === 'audio' ? 3 : 4;
        const res = await client
          .postRichMediaByUser(userId, { file_type: fileType as any, url: params?.url, file_data: params?.data })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'media.upload') {
        // 没有目标时仅上传不发送，QQ-Bot 不支持纯上传
        consume([createResult(ResultCode.Warn, 'media.upload not supported, use media.send.user or media.send.channel', null)]);
      } else if (data.action === 'permission.get') {
        // ─── 权限 ───
        const res = await client
          .channelsPermissions(data.payload.ChannelId, data.payload.UserId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'permission.set') {
        const params = data.payload.params;
        const res = await client
          .channelsPermissionsPut(data.payload.ChannelId, data.payload.UserId, params?.allow ?? '0', params?.deny ?? '0')
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'reaction.list') {
        // ─── 表情回应列表 ───
        const res = await client
          .channelsMessagesReactionsUsers(data.payload.ChannelId, data.payload.MessageId, 1, data.payload.EmojiId, { limit: data.payload.params?.limit ?? 20 })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.announce') {
        // ─── 频道公告 ───
        const guildId = data.payload.GuildId;
        const params = data.payload.params;

        if (params?.remove) {
          const res = await client
            .guildsAnnouncesDelete(guildId, params?.messageId ?? 'all')
            .then(r => createResult(ResultCode.Ok, data.action, r))
            .catch(err => createResult(ResultCode.Fail, data.action, err));

          consume([res]);
        } else {
          const res = await client
            .guildsAnnounces(guildId, { message_id: params?.messageId, channel_id: params?.channelId })
            .then(r => createResult(ResultCode.Ok, data.action, r))
            .catch(err => createResult(ResultCode.Fail, data.action, err));

          consume([res]);
        }
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

import { sendchannel, senduser } from './send';
import { DCClient } from './sdk/wss';
import { MESSAGE_CREATE_TYPE } from './sdk/message/MESSAGE_CREATE';
import type {
  User,
  PublicEventMessageCreate,
  PrivateEventMessageCreate,
  DataEnums,
  PrivateEventInteractionCreate,
  PublicEventInteractionCreate,
  PublicEventMessageDelete,
  PublicEventMessageUpdate,
  PublicEventMessageReactionAdd,
  PublicEventMessageReactionRemove,
  PublicEventMemberAdd,
  PublicEventMemberRemove,
  PublicEventChannelCreate,
  PublicEventChannelDelete,
  PublicEventGuildJoin,
  PublicEventGuildExit
} from 'alemonjs';
import { ResultCode, cbpPlatform, createResult, definePlatform } from 'alemonjs';
import { getMaster, platform } from './config';

// pf
export { platform } from './config';

// api
export { DCAPI as API } from './sdk/api';

// hook
export * from './hook';

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
  const client = new DCClient();

  // 连接
  void client.connect();

  // 机器人Id
  let botId = '';

  // 监听 READY 事件获取机器人信息
  client.on('READY', event => {
    if (event?.user?.id) {
      botId = String(event.user.id);
    }
  });

  /**
   * 创建用户头像
   * @param UserId
   * @param avatar
   * @returns
   */
  const createUserAvatar = (UserId: string, avatar: string) => {
    return client.userAvatar(UserId, avatar);
  };

  // 监听消息
  client.on('MESSAGE_CREATE', event => {
    // 消除bot消息
    if (event.author?.bot) {
      return;
    }

    // 艾特消息处理
    const atUsers: {
      id: string;
    }[] = [];

    // 获取艾特用户
    for (const item of event.mentions) {
      atUsers.push({
        id: item.id
      });
    }

    // 清除 @ 相关的消息
    let msg = event.content;

    for (const item of atUsers) {
      msg = msg.replace(`<@${item.id}>`, '').trim();
    }

    const UserId = event.author.id;
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = createUserAvatar(UserId, event.author.avatar);

    if (event.type === 0 && event.member) {
      const e: PublicEventMessageCreate = {
        name: 'message.create',
        // 事件类型
        Platform: platform,
        // guild
        GuildId: event.guild_id,
        ChannelId: event.channel_id,
        SpaceId: event.channel_id,
        // user
        UserId: UserId,
        UserKey,
        UserName: event.author.username,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        OpenId: UserId,
        // message
        MessageId: event.id,
        MessageText: msg,
        // other
        BotId: botId,
        _tag: 'message.create',
        value: event
      };

      cbp.send(e);
    } else if (event.type === 0 && !event.member) {
      // 处理消息
      const e: PrivateEventMessageCreate = {
        name: 'private.message.create',
        // 事件类型
        Platform: platform,
        // user
        UserId: UserId,
        UserKey,
        UserName: event.author.username,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        OpenId: UserId,
        // message
        MessageId: event.id,
        MessageText: msg,
        // other
        BotId: botId,
        _tag: 'private.message.create',
        value: event
      };

      cbp.send(e);
    } else {
      // 未知类型
    }
  });

  client.on('INTERACTION_CREATE', event => {
    const isPrivate = typeof event['user'] === 'object' ? true : false;
    const user = isPrivate ? event['user'] : event['member'].user;
    const UserId = user.id;
    const UserAvatar = createUserAvatar(UserId, user.avatar);
    const UserName = user.username;
    const [isMaster, UserKey] = getMaster(UserId);
    const MessageText = event.data.custom_id;

    if (isPrivate) {
      // 处理消息
      const e: PrivateEventInteractionCreate = {
        name: 'private.interaction.create',
        // 事件类型
        Platform: platform,
        // user
        UserId: UserId,
        UserKey,
        UserName: UserName,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        OpenId: UserId,
        // message
        MessageId: event.id,
        MessageText: MessageText,
        // other
        BotId: botId,
        _tag: 'private.interaction.create',
        value: event
      };

      cbp.send(e);
    } else {
      const e: PublicEventInteractionCreate = {
        name: 'interaction.create',
        // 事件类型
        Platform: platform,
        // guild
        GuildId: event['guild_id'],
        ChannelId: event.channel_id,
        SpaceId: event.channel_id,
        // user
        UserId: UserId,
        UserKey,
        UserName: UserName,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        // message
        MessageId: event.id,
        MessageText: MessageText,
        OpenId: UserId,
        // other
        BotId: botId,
        _tag: 'interaction.create',
        value: event
      };

      cbp.send(e);
    }

    void client.interactionsCallback(event.id, event.token, MessageText);
  });

  // 消息更新
  client.on('MESSAGE_UPDATE', event => {
    if (!event.author) {
      return;
    }
    const UserId = event.author.id;
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = createUserAvatar(UserId, event.author.avatar);

    const e: PublicEventMessageUpdate = {
      name: 'message.update',
      Platform: platform,
      GuildId: event.guild_id,
      ChannelId: event.channel_id,
      SpaceId: event.channel_id,
      UserId: UserId,
      UserKey,
      UserName: event.author.username,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: event.author.bot ?? false,
      MessageId: event.id,
      BotId: botId,
      _tag: 'MESSAGE_UPDATE',
      value: event
    };

    cbp.send(e);
  });

  // 消息删除
  client.on('MESSAGE_DELETE', event => {
    const e: PublicEventMessageDelete = {
      name: 'message.delete',
      Platform: platform,
      GuildId: event.guild_id,
      ChannelId: event.channel_id,
      SpaceId: event.channel_id,
      MessageId: event.id,
      BotId: botId,
      _tag: 'MESSAGE_DELETE',
      value: event
    };

    cbp.send(e);
  });

  // 表情添加
  client.on('MESSAGE_REACTION_ADD', event => {
    const e: PublicEventMessageReactionAdd = {
      name: 'message.reaction.add',
      Platform: platform,
      GuildId: event.guild_id,
      ChannelId: event.channel_id,
      SpaceId: event.channel_id,
      MessageId: event.message_id,
      BotId: botId,
      _tag: 'MESSAGE_REACTION_ADD',
      value: event
    };

    cbp.send(e);
  });

  // 表情移除
  client.on('MESSAGE_REACTION_REMOVE', event => {
    const e: PublicEventMessageReactionRemove = {
      name: 'message.reaction.remove',
      Platform: platform,
      GuildId: event['guild_id'],
      ChannelId: event['channel_id'],
      SpaceId: event['channel_id'],
      MessageId: event['message_id'],
      BotId: botId,
      _tag: 'MESSAGE_REACTION_REMOVE',
      value: event
    };

    cbp.send(e);
  });

  // 成员加入
  client.on('GUILD_MEMBER_ADD', event => {
    const UserId = event.user.id;
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = createUserAvatar(UserId, event.user.avatar);

    const e: PublicEventMemberAdd = {
      name: 'member.add',
      Platform: platform,
      GuildId: event.guild_id,
      ChannelId: '',
      SpaceId: event.guild_id,
      UserId: UserId,
      UserKey,
      UserName: event.user.username,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      MessageId: '',
      BotId: botId,
      _tag: 'GUILD_MEMBER_ADD',
      value: event
    };

    cbp.send(e);
  });

  // 成员移除
  client.on('GUILD_MEMBER_REMOVE', event => {
    const UserId = event.user.id;
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = createUserAvatar(UserId, event.user.avatar);

    const e: PublicEventMemberRemove = {
      name: 'member.remove',
      Platform: platform,
      GuildId: event.guild_id,
      ChannelId: '',
      SpaceId: event.guild_id,
      UserId: UserId,
      UserKey,
      UserName: event.user.username,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      MessageId: '',
      BotId: botId,
      _tag: 'GUILD_MEMBER_REMOVE',
      value: event
    };

    cbp.send(e);
  });

  // 频道创建
  client.on('CHANNEL_CREATE', event => {
    const e: PublicEventChannelCreate = {
      name: 'channel.create',
      Platform: platform,
      GuildId: event.guild_id ?? '',
      ChannelId: event.id ?? '',
      SpaceId: event.guild_id ?? '',
      MessageId: '',
      BotId: botId,
      _tag: 'CHANNEL_CREATE',
      value: event
    };

    cbp.send(e);
  });

  // 频道删除
  client.on('CHANNEL_DELETE', event => {
    const e: PublicEventChannelDelete = {
      name: 'channel.delete',
      Platform: platform,
      GuildId: event.guild_id ?? '',
      ChannelId: event.id ?? '',
      SpaceId: event.guild_id ?? '',
      MessageId: '',
      BotId: botId,
      _tag: 'CHANNEL_DELETE',
      value: event
    };

    cbp.send(e);
  });

  // 机器人加入服务器
  client.on('GUILD_CREATE', event => {
    const e: PublicEventGuildJoin = {
      name: 'guild.join',
      Platform: platform,
      GuildId: event.id ?? '',
      ChannelId: '',
      SpaceId: event.id ?? '',
      UserId: '',
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

  // 机器人离开服务器
  client.on('GUILD_DELETE', event => {
    const e: PublicEventGuildExit = {
      name: 'guild.exit',
      Platform: platform,
      GuildId: event.id ?? '',
      ChannelId: '',
      SpaceId: event.id ?? '',
      UserId: '',
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

  const api = {
    active: {
      send: {
        channel: async (UserId: string, val: DataEnums[]) => {
          const res = await sendchannel(client, { channel_id: UserId }, val);

          return [createResult(ResultCode.Ok, '请求完成', res)];
        },
        user: async (OpenId: string, val: DataEnums[]) => {
          const res = await senduser(client, { author_id: OpenId }, val);

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
          const ChannelId = event.value.channel_id;
          const res = await sendchannel(client, { channel_id: ChannelId }, val);

          return [createResult(ResultCode.Ok, '请求完成', res)];
        } else if (tag === 'private.message.create') {
          const UserId = event.value.author.id;
          const ChannelId = event.value.channel_id;
          const res = await senduser(
            client,
            {
              channel_id: ChannelId,
              author_id: UserId
            },
            val
          );

          return [createResult(ResultCode.Ok, '请求完成', res)];
        } else if (tag === 'interaction.create') {
          const ChannelId = event.value.channel_id;
          const res = await sendchannel(client, { channel_id: ChannelId }, val);

          return [createResult(ResultCode.Ok, '请求完成', res)];
        } else if (tag === 'private.interaction.create') {
          const UserId = event.value.user.id;
          const ChannelId = event.value.channel_id;
          const res = await senduser(
            client,
            {
              channel_id: ChannelId,
              author_id: UserId
            },
            val
          );

          return [createResult(ResultCode.Ok, '请求完成', res)];
        }

        return [];
      },
      mention: e => {
        const event: MESSAGE_CREATE_TYPE = e.value;

        if (!event?.mentions) {
          return new Promise<User[]>(resolve => resolve([]));
        }
        const MessageMention: User[] = event.mentions.map(item => {
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
      if (data.action === 'message.send') {
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
      } else if (data.action === 'me.info') {
        // ─── me ───
        const res = await client
          .usersMe()
          .then(r => {
            const [isMaster, UserKey] = getMaster(r?.id);

            return createResult(ResultCode.Ok, data.action, {
              UserId: r?.id,
              UserName: r?.username,
              UserAvatar: r?.avatar ? client.userAvatar(r.id, r.avatar) : '',
              IsBot: true,
              IsMaster: isMaster,
              UserKey
            });
          })
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'me.guilds') {
        const res = await client
          .usersMeGuilds(null)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'message.delete') {
        // ─── 消息管理 ───
        const channelId = data.payload.ChannelId;
        const messageId = data.payload.MessageId;
        const res = await client
          .deleteMessage(channelId, messageId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'message.pin') {
        const res = await client
          .pinMessage(data.payload.ChannelId, data.payload.MessageId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'message.unpin') {
        const res = await client
          .deletepinMessage(data.payload.ChannelId, data.payload.MessageId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'message.edit') {
        const format = data.payload.params?.format;
        const content = format?.map(i => i.value).join('') ?? '';
        const res = await client
          .editMessage(data.payload.ChannelId, data.payload.MessageId, { content })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'reaction.add') {
        // ─── 表情回应 ───
        const res = await client
          .createareaction(data.payload.ChannelId, data.payload.MessageId, data.payload.EmojiId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'reaction.remove') {
        const res = await client
          .deleteownreaction(data.payload.ChannelId, data.payload.MessageId, data.payload.EmojiId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.info') {
        // ─── 成员管理 ───
        const guildId = data.payload.params?.guildId ?? data.payload.GuildId;
        const userId = data.payload.params?.userId ?? data.payload.UserId;
        const res = await client
          .getGuildMember(guildId, userId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.list') {
        const res = await client
          .guildsMembers(data.payload.GuildId)
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
        const res = await client
          .guildsBansCreateByUserId(data.payload.GuildId, data.payload.UserId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.unban') {
        const res = await client
          .guildsBansDeleteByUserId(data.payload.GuildId, data.payload.UserId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'guild.info') {
        // ─── 服务器 ───
        const res = await client
          .guild(data.payload.GuildId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'guild.list') {
        const res = await client
          .usersMeGuilds(null)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.info') {
        // ─── 频道管理 ───
        const res = await client
          .guildsChannels(data.payload.ChannelId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.list') {
        const res = await client
          .guildsanyChannels(data.payload.GuildId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.delete') {
        const res = await client
          .guildsChannelsDELETE(data.payload.ChannelId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.create') {
        const params = data.payload.params;
        const res = await client
          .guildsChannelsCreate(data.payload.GuildId, { name: params.name, type: params.type ? Number(params.type) : 0 })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.update') {
        const params = data.payload.params;
        const res = await client
          .guildsChannelsUpdate(data.payload.ChannelId, { name: params.name, topic: params.topic })
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
      } else if (data.action === 'role.delete') {
        const res = await client
          .guildsRolesDelete(data.payload.GuildId, data.payload.RoleId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.create') {
        const params = data.payload.params;
        const res = await client
          .guildsRolesCreate(data.payload.GuildId, {
            name: params.name,
            color: params.color ? Number(params.color) : undefined,
            permissions: params.permissions
          })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.update') {
        const params = data.payload.params;
        const res = await client
          .guildsRolesUpdateById(data.payload.GuildId, data.payload.RoleId, {
            name: params.name,
            color: params.color ? Number(params.color) : undefined,
            permissions: params.permissions
          })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.assign') {
        const res = await client
          .guildsMEmbersRolesAdd(data.payload.GuildId, data.payload.UserId, data.payload.RoleId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.remove') {
        const res = await client
          .guildsMembersRolesDelete(data.payload.GuildId, data.payload.UserId, data.payload.RoleId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'message.get') {
        // ─── 消息获取 ───
        const res = await client
          .guildsChannelsmessages(data.payload.ChannelId, data.payload.MessageId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'guild.update') {
        // ─── 服务器管理 ───
        const res = await client
          .guildsUpdate(data.payload.GuildId, data.payload.params)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'guild.leave') {
        const res = await client
          .usersMeGuildsDelete(data.payload.GuildId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.card') {
        // ─── 成员扩展 ───
        const res = await client
          .guildsMembersUpdate(data.payload.GuildId, data.payload.UserId, { nick: data.payload.params?.card })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.mute') {
        const duration = data.payload.params?.duration ?? 0;
        const until = duration > 0 ? new Date(Date.now() + duration * 1000).toISOString() : null;
        const res = await client
          .guildsMembersUpdate(data.payload.GuildId, data.payload.UserId, { communication_disabled_until: until })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'user.info') {
        // ─── 用户信息 ───
        const res = await client
          .userMessage(data.payload.UserId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'history.list') {
        // ─── 消息历史 ───
        const res = await client
          .guildsChannelsanymessages(data.payload.ChannelId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.search') {
        // ─── 成员搜索 ───
        const res = await client
          .guildsMembersSearch(data.payload.GuildId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
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

export default definePlatform({ main });

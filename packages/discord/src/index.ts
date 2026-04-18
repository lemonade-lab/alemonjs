import { sendchannel, senduser } from './send';
import { DCClient } from './sdk/wss';
import { MESSAGE_CREATE_TYPE } from './sdk/message/MESSAGE_CREATE';
import type { User, DataEnums } from 'alemonjs';
import { ResultCode, cbpPlatform, createResult, definePlatform, FormatEvent } from 'alemonjs';
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
      cbp.send(
        FormatEvent.create('message.create')
          .addPlatform({ Platform: platform, value: event, BotId: botId })
          .addGuild({ GuildId: event.guild_id, SpaceId: event.channel_id })
          .addChannel({ ChannelId: event.channel_id })
          .addUser({ UserId, UserKey, UserName: event.author.username, UserAvatar: UserAvatar, IsMaster: isMaster, IsBot: false })
          .addMessage({ MessageId: event.id })
          .addText({ MessageText: msg })
          .addOpen({ OpenId: UserId })
          .add({ tag: 'message.create' }).value
      );
    } else if (event.type === 0 && !event.member) {
      // 处理消息
      cbp.send(
        FormatEvent.create('private.message.create')
          .addPlatform({ Platform: platform, value: event, BotId: botId })
          .addUser({ UserId, UserKey, UserName: event.author.username, UserAvatar: UserAvatar, IsMaster: isMaster, IsBot: false })
          .addMessage({ MessageId: event.id })
          .addText({ MessageText: msg })
          .addOpen({ OpenId: UserId })
          .add({ tag: 'private.message.create' }).value
      );
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

    const isCustom = !!event.data?.custom_id;
    const customId = isCustom ? event.data.custom_id : '';
    const notAutoConfirmation = isCustom ? /^autoConfirmation:/.test(customId) : false;
    const currentMessageText = notAutoConfirmation ? customId.replace(/^autoConfirmation:/, '') : customId;

    if (isPrivate) {
      // 处理消息
      cbp.send(
        FormatEvent.create('private.interaction.create')
          .addPlatform({ Platform: platform, value: event, BotId: botId })
          .addUser({ UserId, UserKey, UserName: UserName, UserAvatar: UserAvatar, IsMaster: isMaster, IsBot: false })
          .addMessage({ MessageId: event.id })
          .addText({ MessageText: currentMessageText })
          .addOpen({ OpenId: UserId })
          .add({ tag: 'private.interaction.create' }).value
      );
    } else {
      cbp.send(
        FormatEvent.create('interaction.create')
          .addPlatform({ Platform: platform, value: event, BotId: botId })
          .addGuild({ GuildId: event['guild_id'], SpaceId: event.channel_id })
          .addChannel({ ChannelId: event.channel_id })
          .addUser({ UserId, UserKey, UserName: UserName, UserAvatar: UserAvatar, IsMaster: isMaster, IsBot: false })
          .addMessage({ MessageId: event.id })
          .addText({ MessageText: currentMessageText })
          .addOpen({ OpenId: UserId })
          .add({ tag: 'interaction.create' }).value
      );
    }

    // 不是 非自动确认，则自动发起确认
    if (!notAutoConfirmation) {
      void client.interactionsCallbackEphemeral(event.id, event.token, '正在处理...');
    }
  });

  // 消息更新
  client.on('MESSAGE_UPDATE', event => {
    if (!event.author) {
      return;
    }
    const UserId = event.author.id;
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = createUserAvatar(UserId, event.author.avatar);

    cbp.send(
      FormatEvent.create('message.update')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.guild_id, SpaceId: event.channel_id })
        .addChannel({ ChannelId: event.channel_id })
        .addUser({ UserId, UserKey, UserName: event.author.username, UserAvatar: UserAvatar, IsMaster: isMaster, IsBot: event.author.bot ?? false })
        .addMessage({ MessageId: event.id })
        .add({ tag: 'MESSAGE_UPDATE' }).value
    );
  });

  // 消息删除
  client.on('MESSAGE_DELETE', event => {
    cbp.send(
      FormatEvent.create('message.delete')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.guild_id, SpaceId: event.channel_id })
        .addChannel({ ChannelId: event.channel_id })
        .addMessage({ MessageId: event.id })
        .add({ tag: 'MESSAGE_DELETE' }).value
    );
  });

  // 表情添加
  client.on('MESSAGE_REACTION_ADD', event => {
    cbp.send(
      FormatEvent.create('message.reaction.add')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.guild_id, SpaceId: event.channel_id })
        .addChannel({ ChannelId: event.channel_id })
        .addMessage({ MessageId: event.message_id })
        .add({ tag: 'MESSAGE_REACTION_ADD' }).value
    );
  });

  // 表情移除
  client.on('MESSAGE_REACTION_REMOVE', event => {
    cbp.send(
      FormatEvent.create('message.reaction.remove')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event['guild_id'], SpaceId: event['channel_id'] })
        .addChannel({ ChannelId: event['channel_id'] })
        .addMessage({ MessageId: event['message_id'] })
        .add({ tag: 'MESSAGE_REACTION_REMOVE' }).value
    );
  });

  // 成员加入
  client.on('GUILD_MEMBER_ADD', event => {
    const UserId = event.user.id;
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = createUserAvatar(UserId, event.user.avatar);

    cbp.send(
      FormatEvent.create('member.add')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.guild_id, SpaceId: event.guild_id })
        .addChannel({ ChannelId: '' })
        .addUser({ UserId, UserKey, UserName: event.user.username, UserAvatar: UserAvatar, IsMaster: isMaster, IsBot: false })
        .addMessage({ MessageId: '' })
        .add({ tag: 'GUILD_MEMBER_ADD' }).value
    );
  });

  // 成员移除
  client.on('GUILD_MEMBER_REMOVE', event => {
    const UserId = event.user.id;
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = createUserAvatar(UserId, event.user.avatar);

    cbp.send(
      FormatEvent.create('member.remove')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.guild_id, SpaceId: event.guild_id })
        .addChannel({ ChannelId: '' })
        .addUser({ UserId, UserKey, UserName: event.user.username, UserAvatar: UserAvatar, IsMaster: isMaster, IsBot: false })
        .addMessage({ MessageId: '' })
        .add({ tag: 'GUILD_MEMBER_REMOVE' }).value
    );
  });

  // 频道创建
  client.on('CHANNEL_CREATE', event => {
    cbp.send(
      FormatEvent.create('channel.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.guild_id ?? '', SpaceId: event.guild_id ?? '' })
        .addChannel({ ChannelId: event.id ?? '' })
        .addMessage({ MessageId: '' })
        .add({ tag: 'CHANNEL_CREATE' }).value
    );
  });

  // 频道删除
  client.on('CHANNEL_DELETE', event => {
    cbp.send(
      FormatEvent.create('channel.delete')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.guild_id ?? '', SpaceId: event.guild_id ?? '' })
        .addChannel({ ChannelId: event.id ?? '' })
        .addMessage({ MessageId: '' })
        .add({ tag: 'CHANNEL_DELETE' }).value
    );
  });

  // 机器人加入服务器
  client.on('GUILD_CREATE', event => {
    cbp.send(
      FormatEvent.create('guild.join')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.id ?? '', SpaceId: event.id ?? '' })
        .addChannel({ ChannelId: '' })
        .addUser({ UserId: '', UserKey: '', IsMaster: false, IsBot: false })
        .addMessage({ MessageId: '' })
        .add({ tag: 'GUILD_CREATE' }).value
    );
  });

  // 机器人离开服务器
  client.on('GUILD_DELETE', event => {
    cbp.send(
      FormatEvent.create('guild.exit')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.id ?? '', SpaceId: event.id ?? '' })
        .addChannel({ ChannelId: '' })
        .addUser({ UserId: '', UserKey: '', IsMaster: false, IsBot: false })
        .addMessage({ MessageId: '' })
        .add({ tag: 'GUILD_DELETE' }).value
    );
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

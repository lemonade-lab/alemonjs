import type { DataEnums, User } from 'alemonjs';
import { cbpPlatform, createResult, ResultCode, FormatEvent } from 'alemonjs';
import { QQBotClients } from './sdk/client.websoket';
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
    cbp.send(
      FormatEvent.create('guild.join')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.group_openid, SpaceId: `GROUP:${event.group_openid}` })
        .addChannel({ ChannelId: event.group_openid })
        .addUser({
          UserId: event.op_member_openid,
          UserKey: event.op_member_openid,
          UserAvatar: createUserAvatarURL(event.op_member_openid),
          IsMaster: false,
          IsBot: false
        })
        .addMessage({ MessageId: '' })
        .add({ tag: 'GROUP_ADD_ROBOT' }).value
    );
  });

  client.on('GROUP_DEL_ROBOT', event => {
    // 机器人离开群组
    cbp.send(
      FormatEvent.create('guild.exit')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.group_openid, SpaceId: `GROUP:${event.group_openid}` })
        .addChannel({ ChannelId: event.group_openid })
        .addUser({
          UserId: event.op_member_openid,
          UserKey: event.op_member_openid,
          UserAvatar: createUserAvatarURL(event.op_member_openid),
          IsMaster: false,
          IsBot: false
        })
        .addMessage({ MessageId: '' })
        .add({ tag: 'GROUP_DEL_ROBOT' }).value
    );
  });

  // 监听消息
  client.on('GROUP_AT_MESSAGE_CREATE', event => {
    const UserId = event.author.id;
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = createUserAvatarURL(event.author.id);

    // 定义消
    cbp.send(
      FormatEvent.create('message.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.group_id, SpaceId: `GROUP:${event.group_id}` })
        .addChannel({ ChannelId: event.group_id })
        .addUser({ UserId: event.author.id, UserKey, UserAvatar: UserAvatar, IsMaster: isMaster, IsBot: false })
        .addMessage({ MessageId: event.id })
        .addText({ MessageText: event.content?.trim() })
        .addOpen({ OpenId: `C2C:${event.author.member_openid}` })
        .add({ tag: 'GROUP_AT_MESSAGE_CREATE' }).value
    );
  });

  client.on('C2C_MESSAGE_CREATE', event => {
    const UserId = event.author.id;
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = createUserAvatarURL(event.author.id);

    // 定义消
    cbp.send(
      FormatEvent.create('private.message.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addUser({ UserId: event.author.id, UserKey, UserAvatar: UserAvatar, IsMaster: isMaster, IsBot: false })
        .addMessage({ MessageId: event.id })
        .addText({ MessageText: event.content?.trim() })
        .addOpen({ OpenId: `C2C:${event.author.user_openid}` })
        .add({ tag: 'C2C_MESSAGE_CREATE' }).value
    );
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
    cbp.send(
      FormatEvent.create('private.message.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addUser({
          UserId: event?.author?.id ?? '',
          UserKey,
          UserName: event?.author?.username ?? '',
          UserAvatar: UserAvatar,
          IsMaster: isMaster,
          IsBot: event.author?.bot
        })
        .addMessage({ MessageId: event.id })
        .addText({ MessageText: msg?.trim() })
        .addOpen({ OpenId: `DIRECT:${event.guild_id}` })
        .add({ tag: 'DIRECT_MESSAGE_CREATE' }).value
    );
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
    cbp.send(
      FormatEvent.create('message.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.guild_id, SpaceId: `GUILD:${event.channel_id}` })
        .addChannel({ ChannelId: event.channel_id })
        .addUser({
          UserId: event?.author?.id ?? '',
          UserKey,
          UserName: event?.author?.username ?? '',
          UserAvatar: UserAvatar,
          IsMaster: isMaster,
          IsBot: event.author?.bot
        })
        .addMessage({ MessageId: event.id })
        .addText({ MessageText: msg?.trim() })
        .addOpen({ OpenId: `DIRECT:${event.guild_id}` })
        .add({ tag: 'AT_MESSAGE_CREATE' }).value
    );
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
    cbp.send(
      FormatEvent.create('message.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.guild_id, SpaceId: `GUILD:${event.channel_id}` })
        .addChannel({ ChannelId: event.channel_id })
        .addUser({
          UserId: event?.author?.id ?? '',
          UserKey,
          UserName: event?.author?.username ?? '',
          UserAvatar: UserAvatar,
          IsMaster: isMaster,
          IsBot: false
        })
        .addMessage({ MessageId: event.id })
        .addText({ MessageText: msg?.trim() })
        .addOpen({ OpenId: `DIRECT:${event.guild_id}` })
        .add({ tag: 'MESSAGE_CREATE' }).value
    );
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

      const e = FormatEvent.create('interaction.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.group_openid, SpaceId: `GROUP:${event.group_openid}` })
        .addChannel({ ChannelId: event.group_openid })
        .addUser({ UserId: event.group_member_openid, UserKey, UserAvatar: UserAvatar, IsMaster: isMaster, IsBot: false })
        .addMessage({ MessageId: `INTERACTION_CREATE:${event.id}` })
        .addText({ MessageText: MessageText })
        .addOpen({ OpenId: `C2C:${event.group_member_openid}` })
        .add({ tag: 'INTERACTION_CREATE_GROUP' }).value;

      cbp.send(e);
    } else if (event.scene === 'c2c') {
      const UserAvatar = createUserAvatarURL(event.user_openid);

      const UserId = event.user_openid;

      const [isMaster, UserKey] = getMaster(UserId);

      const MessageText = event.data.resolved.button_data?.trim() || '';

      // 处理消息
      const e = FormatEvent.create('private.interaction.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addUser({ UserId: event.user_openid, UserKey, UserAvatar: UserAvatar, IsMaster: isMaster, IsBot: false })
        .addMessage({ MessageId: event.id })
        .addText({ MessageText: MessageText })
        .addOpen({ OpenId: `C2C:${event.user_openid}` })
        .add({ tag: 'INTERACTION_CREATE_C2C' }).value;

      cbp.send(e);
    } else if (event.scene === 'guild') {
      const UserAvatar = createUserAvatarURL(event.data.resolved.user_id);
      const UserId = event.data.resolved.user_id;

      const [isMaster, UserKey] = getMaster(UserId);

      const MessageText = event.data.resolved.button_data?.trim() || '';
      // 处理消息
      const e = FormatEvent.create('interaction.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.guild_id, SpaceId: `GUILD:${event.channel_id}` })
        .addChannel({ ChannelId: event.channel_id })
        .addUser({ UserId: event.data.resolved.user_id, UserKey, UserAvatar: UserAvatar, IsMaster: isMaster, IsBot: false })
        .addMessage({ MessageId: event.data.resolved.message_id })
        .addText({ MessageText: MessageText })
        .addOpen({ OpenId: `DIRECT:${event.guild_id}` })
        .add({ tag: 'INTERACTION_CREATE_GUILD' }).value;

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

    cbp.send(
      FormatEvent.create('message.delete')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: msg?.guild_id ?? '', SpaceId: `GUILD:${msg?.channel_id ?? ''}` })
        .addChannel({ ChannelId: msg?.channel_id ?? '' })
        .addMessage({ MessageId: msg?.id ?? '' })
        .add({ tag: 'MESSAGE_DELETE' }).value
    );
  });

  // 公域消息删除
  client.on('PUBLIC_MESSAGE_DELETE', event => {
    const msg = event.message;

    cbp.send(
      FormatEvent.create('message.delete')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: msg.guild_id ?? '', SpaceId: `GUILD:${msg.channel_id ?? ''}` })
        .addChannel({ ChannelId: msg.channel_id ?? '' })
        .addMessage({ MessageId: msg.id ?? '' })
        .add({ tag: 'PUBLIC_MESSAGE_DELETE' }).value
    );
  });

  // 频道私聊消息删除
  client.on('DIRECT_MESSAGE_DELETE', event => {
    const msg = event.message;

    cbp.send(
      FormatEvent.create('private.message.delete')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addMessage({ MessageId: msg.id ?? '' })
        .add({ tag: 'DIRECT_MESSAGE_DELETE' }).value
    );
  });

  // 表情表态 - 添加
  client.on('MESSAGE_REACTION_ADD', event => {
    cbp.send(
      FormatEvent.create('message.reaction.add')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.guild_id ?? '', SpaceId: `GUILD:${event.channel_id ?? ''}` })
        .addChannel({ ChannelId: event.channel_id ?? '' })
        .addMessage({ MessageId: event.target?.id ?? '' })
        .add({ tag: 'MESSAGE_REACTION_ADD' }).value
    );
  });

  // 表情表态 - 移除
  client.on('MESSAGE_REACTION_REMOVE', event => {
    cbp.send(
      FormatEvent.create('message.reaction.remove')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.guild_id ?? '', SpaceId: `GUILD:${event.channel_id ?? ''}` })
        .addChannel({ ChannelId: event.channel_id ?? '' })
        .addMessage({ MessageId: event.target?.id ?? '' })
        .add({ tag: 'MESSAGE_REACTION_REMOVE' }).value
    );
  });

  // 子频道创建
  client.on('CHANNEL_CREATE', event => {
    cbp.send(
      FormatEvent.create('channel.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.guild_id ?? '', SpaceId: `GUILD:${event.guild_id ?? ''}` })
        .addChannel({ ChannelId: event.id ?? '' })
        .addMessage({ MessageId: '' })
        .add({ tag: 'CHANNEL_CREATE' }).value
    );
  });

  // 子频道删除
  client.on('CHANNEL_DELETE', event => {
    cbp.send(
      FormatEvent.create('channel.delete')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.guild_id ?? '', SpaceId: `GUILD:${event.guild_id ?? ''}` })
        .addChannel({ ChannelId: event.id ?? '' })
        .addMessage({ MessageId: '' })
        .add({ tag: 'CHANNEL_DELETE' }).value
    );
  });

  // 服务器创建（机器人加入频道）
  client.on('GUILD_CREATE', event => {
    cbp.send(
      FormatEvent.create('guild.join')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.id ?? '', SpaceId: `GUILD:${event.id ?? ''}` })
        .addChannel({ ChannelId: '' })
        .addUser({ UserId: event.op_user_id ?? '', UserKey: '', IsMaster: false, IsBot: false })
        .addMessage({ MessageId: '' })
        .add({ tag: 'GUILD_CREATE' }).value
    );
  });

  // 服务器删除（机器人退出频道）
  client.on('GUILD_DELETE', event => {
    cbp.send(
      FormatEvent.create('guild.exit')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.id ?? '', SpaceId: `GUILD:${event.id ?? ''}` })
        .addChannel({ ChannelId: '' })
        .addUser({ UserId: event.op_user_id ?? '', UserKey: '', IsMaster: false, IsBot: false })
        .addMessage({ MessageId: '' })
        .add({ tag: 'GUILD_DELETE' }).value
    );
  });

  // 频道成员加入
  client.on('GUILD_MEMBER_ADD', event => {
    const UserId = event.user?.id ?? '';
    const [isMaster, UserKey] = getMaster(UserId);

    cbp.send(
      FormatEvent.create('member.add')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.guild_id ?? '', SpaceId: `GUILD:${event.guild_id ?? ''}` })
        .addChannel({ ChannelId: '' })
        .addUser({ UserId: UserId, UserKey, UserName: event.user?.username ?? '', UserAvatar: createUserAvatarURL(UserId), IsMaster: isMaster, IsBot: false })
        .addMessage({ MessageId: '' })
        .add({ tag: 'GUILD_MEMBER_ADD' }).value
    );
  });

  // 频道成员移除
  client.on('GUILD_MEMBER_REMOVE', event => {
    const UserId = event.user?.id ?? '';
    const [isMaster, UserKey] = getMaster(UserId);

    cbp.send(
      FormatEvent.create('member.remove')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.guild_id ?? '', SpaceId: `GUILD:${event.guild_id ?? ''}` })
        .addChannel({ ChannelId: '' })
        .addUser({ UserId: UserId, UserKey, UserName: event.user?.username ?? '', UserAvatar: createUserAvatarURL(UserId), IsMaster: isMaster, IsBot: false })
        .addMessage({ MessageId: '' })
        .add({ tag: 'GUILD_MEMBER_REMOVE' }).value
    );
  });

  // 频道成员资料变更
  client.on('GUILD_MEMBER_UPDATE', event => {
    const UserId = event.user?.id ?? '';
    const [isMaster, UserKey] = getMaster(UserId);

    cbp.send(
      FormatEvent.create('member.update')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.guild_id ?? '', SpaceId: `GUILD:${event.guild_id ?? ''}` })
        .addChannel({ ChannelId: '' })
        .addUser({ UserId: UserId, UserKey, UserName: event.user?.username ?? '', UserAvatar: createUserAvatarURL(UserId), IsMaster: isMaster, IsBot: false })
        .addMessage({ MessageId: '' })
        .add({ tag: 'GUILD_MEMBER_UPDATE' }).value
    );
  });

  // 好友添加
  client.on('FRIEND_ADD', event => {
    cbp.send(
      FormatEvent.create('private.friend.add')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addUser({ UserId: event.openid ?? '', UserKey: '', IsMaster: false, IsBot: false })
        .addMessage({ MessageId: '' })
        .add({ tag: 'FRIEND_ADD' }).value
    );
  });

  // 好友删除
  client.on('FRIEND_DEL', event => {
    cbp.send(
      FormatEvent.create('private.friend.remove')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addUser({ UserId: event.openid ?? '', UserKey: '', IsMaster: false, IsBot: false })
        .addMessage({ MessageId: '' })
        .add({ tag: 'FRIEND_DEL' }).value
    );
  });

  // 子频道更新
  client.on('CHANNEL_UPDATE', event => {
    cbp.send(
      FormatEvent.create('channel.update')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.guild_id ?? '', SpaceId: `GUILD:${event.guild_id ?? ''}` })
        .addChannel({ ChannelId: event.id ?? '' })
        .addMessage({ MessageId: '' })
        .add({ tag: 'CHANNEL_UPDATE' }).value
    );
  });

  // 频道信息更新
  client.on('GUILD_UPDATE', event => {
    cbp.send(
      FormatEvent.create('guild.update')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.id ?? '', SpaceId: `GUILD:${event.id ?? ''}` })
        .addChannel({ ChannelId: '' })
        .addMessage({ MessageId: '' })
        .add({ tag: 'GUILD_UPDATE' }).value
    );
  });

  // 群消息推送开启
  client.on('GROUP_MSG_RECEIVE', event => {
    cbp.send(
      FormatEvent.create('notice.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.group_openid, SpaceId: `GROUP:${event.group_openid}` })
        .addChannel({ ChannelId: event.group_openid })
        .addUser({ UserId: event.op_member_openid, UserKey: '', IsMaster: false, IsBot: false })
        .addMessage({ MessageId: `group_msg_receive_${event.group_openid}_${event.timestamp}` })
        .add({ tag: 'GROUP_MSG_RECEIVE' }).value
    );
  });

  // 群消息推送关闭
  client.on('GROUP_MSG_REJECT', event => {
    cbp.send(
      FormatEvent.create('notice.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.group_openid, SpaceId: `GROUP:${event.group_openid}` })
        .addChannel({ ChannelId: event.group_openid })
        .addUser({ UserId: event.op_member_openid, UserKey: '', IsMaster: false, IsBot: false })
        .addMessage({ MessageId: `group_msg_reject_${event.group_openid}_${event.timestamp}` })
        .add({ tag: 'GROUP_MSG_REJECT' }).value
    );
  });

  // C2C消息推送开启
  client.on('C2C_MSG_RECEIVE', event => {
    cbp.send(
      FormatEvent.create('private.notice.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addUser({ UserId: event.openid ?? '', UserKey: '', IsMaster: false, IsBot: false })
        .addMessage({ MessageId: `c2c_msg_receive_${event.openid}_${event.timestamp}` })
        .add({ tag: 'C2C_MSG_RECEIVE' }).value
    );
  });

  // C2C消息推送关闭
  client.on('C2C_MSG_REJECT', event => {
    cbp.send(
      FormatEvent.create('private.notice.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addUser({ UserId: event.openid ?? '', UserKey: '', IsMaster: false, IsBot: false })
        .addMessage({ MessageId: `c2c_msg_reject_${event.openid}_${event.timestamp}` })
        .add({ tag: 'C2C_MSG_REJECT' }).value
    );
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
    const params = data.payload?.params;

    try {
      // 支持嵌套路径，如 'api.use.send'
      const keys = key.split('.');
      let target: any = client;

      for (const k of keys) {
        if (target === null || target === undefined || !(k in target)) {
          consume([createResult(ResultCode.Fail, '未知请求，请尝试升级版本', null)]);

          return;
        }

        target = target[k];
      }

      if (typeof target !== 'function') {
        consume([createResult(ResultCode.Fail, '目标不是可调用方法', null)]);

        return;
      }

      const res = await target(...params);

      consume([createResult(ResultCode.Ok, '请求完成', res)]);
    } catch (error) {
      consume([createResult(ResultCode.Fail, '请求失败', error)]);
    }
  };

  // 处理 api 调用
  cbp.onapis((data, consume) => void onapis(data, consume));
};

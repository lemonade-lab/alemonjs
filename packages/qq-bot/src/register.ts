import {
  cbpPlatform,
  createResult,
  DataEnums,
  PrivateEventInteractionCreate,
  PrivateEventMessageCreate,
  PublicEventGuildExit,
  PublicEventGuildJoin,
  PublicEventInteractionCreate,
  PublicEventMessageCreate,
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

  const createUserAvatarURL = (author_id: string) => {
    return `https://q.qlogo.cn/qqapp/${config.app_id}/${author_id}/640`;
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
      CreateAt: Date.now(),
      tag: 'GROUP_DEL_ROBOT',
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
      CreateAt: Date.now(),
      tag: 'GROUP_DEL_ROBOT',
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
      CreateAt: Date.now(),
      tag: 'GROUP_AT_MESSAGE_CREATE',
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
      CreateAt: Date.now(),
      OpenId: `C2C:${event.author.user_openid}`,
      //
      tag: 'C2C_MESSAGE_CREATE',
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
      CreateAt: Date.now(),
      //
      tag: 'DIRECT_MESSAGE_CREATE',
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
      CreateAt: Date.now(),
      //
      tag: 'AT_MESSAGE_CREATE',
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
      CreateAt: Date.now(),
      //
      tag: 'MESSAGE_CREATE',
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
        tag: 'INTERACTION_CREATE_GROUP',
        CreateAt: Date.now(),
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
        CreateAt: Date.now(),
        tag: 'INTERACTION_CREATE_C2C',
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
        CreateAt: Date.now(),
        tag: 'INTERACTION_CREATE_GUILD',
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
          tag: string;
          ChannelId: string;
          UserId: string;
          MessageId?: string;
        },
        val: DataEnums[]
      ) => {
        if (val.length < 0) {
          return [];
        }
        // 打  tag
        const tag = event.tag;

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
        const tag = event.tag;
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
      const channel_id = data.payload.ChannelId;
      const paramFormat = data.payload.params.format;
      const res = await api.active.send.channel(channel_id, paramFormat);

      consume(res);
    } else if (data.action === 'message.send.user') {
      // 主动发送消息到用户
      const user_id = data.payload.UserId;
      const paramFormat = data.payload.params.format;
      const res = await api.active.send.user(user_id, paramFormat);

      consume(res);
    } else {
      consume([createResult(ResultCode.Fail, '未知请求，请尝试升级版本', null)]);
    }
  };

  // 处理行为
  cbp.onactions((data, consume) => void onactions(data, consume));

  const onapis = async (data, consume) => {
    const key = data.payload?.key;

    if (client[key]) {
      // 如果 client 上有对应的 key，直接调用。
      const params = data.payload.params;
      const res = await client[key](...params);

      consume([createResult(ResultCode.Ok, '请求完成', res)]);
    } else {
      consume([createResult(ResultCode.Fail, '未知请求，请尝试升级版本', null)]);
    }
  };

  // 处理 api 调用
  cbp.onapis((data, consume) => void onapis(data, consume));
};

import {
  PrivateEventMessageCreate,
  PublicEventMessageCreate,
  PublicEventMessageReactionAdd,
  PublicEventMessageReactionRemove,
  PublicEventMessageUpdate,
  PublicEventMessageDelete,
  PublicEventMessagePin,
  PublicEventMemberAdd,
  PublicEventMemberRemove,
  PublicEventGuildJoin,
  PublicEventGuildExit,
  PublicEventChannelCreate,
  PublicEventChannelDelete,
  PublicEventChannelUpdate,
  User,
  DataEnums,
  cbpPlatform,
  createResult,
  ResultCode,
  definePlatform
} from 'alemonjs';
import { KOOKClient } from './sdk/index';
import { readFileSync } from 'fs';
import { getKOOKConfig, getMaster } from './config.js';
import { getBufferByURL } from 'alemonjs/utils';
import { platform } from './config.js';
import { dataEnumToKMarkdown } from './format';

export * from './hook.js';

export { platform } from './config.js';

export { KOOKAPI as API } from './sdk/api.js';

export { type Options } from './config.js';

const main = () => {
  const config = getKOOKConfig();

  // 创建客户端
  const client = new KOOKClient({
    token: config.token
  });

  // 连接
  void client.connect();

  // 机器人Id
  let botId = '';

  client
    .userMe()
    .then(res => {
      botId = String(res?.data?.id ?? '');
    })
    .catch(() => {});

  const port = process.env?.port || 17117;
  const url = `ws://127.0.0.1:${port}`;
  const cbp = cbpPlatform(url);

  client.on('MESSAGES_DIRECT', async event => {
    // 过滤机器人
    if (event.extra?.author?.bot) {
      return false;
    }

    // 创建私聊标记
    const data = await client.userChatCreate(event.extra.author.id).then(res => res?.data);

    // 头像
    const avatar = event.extra.author.avatar;

    // 获取消息
    const msg = event.content;

    const url = avatar.substring(0, avatar.indexOf('?'));
    const UserAvatar = url;

    const UserId = event.author_id;

    const [isMaster, UserKey] = getMaster(UserId);

    // 定义消
    const e: PrivateEventMessageCreate = {
      name: 'private.message.create',
      // 事件类型
      Platform: platform,
      // 用户Id
      UserId: UserId,
      UserKey,
      UserName: event.extra.author.username,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      // message
      MessageId: event.msg_id,
      MessageText: msg,
      OpenId: data?.code,
      //
      BotId: botId,
      _tag: 'MESSAGES_DIRECT',
      value: event
    };

    cbp.send(e);
  });

  // 监听消息
  client.on('MESSAGES_PUBLIC', async event => {
    // 过滤机器人
    if (event.extra?.author?.bot) {
      return false;
    }

    // 创建私聊标记
    const data = await client.userChatCreate(event.extra.author.id).then(res => res?.data);

    // 头像
    const avatar = event.extra.author.avatar;

    // 获取消息
    let msg = event.content;

    /**
     * 艾特类型所得到的
     * 包括机器人在内
     */
    const mentionRolePart = event.extra.kmarkdown?.mention_role_part ?? [];

    for (const item of mentionRolePart) {
      msg = msg.replace(`(rol)${item.role_id}(rol)`, '').trim();
    }

    /**
     * 艾特用户所得到的
     */
    const mentionPart = event.extra.kmarkdown?.mention_part ?? [];

    for (const item of mentionPart) {
      msg = msg.replace(`(met)${item.id}(met)`, '').trim();
    }

    const UserAvatar = avatar.substring(0, avatar.indexOf('?'));
    const UserId = event.author_id;
    const [isMaster, UserKey] = getMaster(UserId);

    // 定义消
    const e: PublicEventMessageCreate = {
      name: 'message.create',
      // 事件类型
      Platform: platform,
      //
      GuildId: event.extra.guild_id,
      ChannelId: event.target_id,
      SpaceId: event.target_id,
      // 用户Id
      UserId: UserId,
      UserKey,
      UserName: event.extra.author.username,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      // message
      MessageId: event.msg_id,
      MessageText: msg,
      OpenId: data?.code,
      //
      BotId: botId,
      _tag: 'MESSAGES_PUBLIC',
      value: event
    };

    cbp.send(e);
  });

  // 发送错误时
  client.on('ERROR', msg => {
    console.error(msg);
  });

  // 表情表态事件
  client.on('REACTIONS', event => {
    const reactionType = event.extra?.type;
    const body = event.extra?.body as any;

    if (!body) {
      return;
    }

    if (reactionType === 'added_reaction') {
      const e: PublicEventMessageReactionAdd = {
        name: 'message.reaction.add',
        Platform: platform,
        GuildId: body.channel_id ?? '',
        ChannelId: body.channel_id ?? '',
        SpaceId: body.channel_id ?? '',
        MessageId: body.msg_id ?? '',
        BotId: botId,
        _tag: 'REACTIONS_ADD',
        value: event
      };

      cbp.send(e);
    } else if (reactionType === 'deleted_reaction') {
      const e: PublicEventMessageReactionRemove = {
        name: 'message.reaction.remove',
        Platform: platform,
        GuildId: body.channel_id ?? '',
        ChannelId: body.channel_id ?? '',
        SpaceId: body.channel_id ?? '',
        MessageId: body.msg_id ?? '',
        BotId: botId,
        _tag: 'REACTIONS_REMOVE',
        value: event
      };

      cbp.send(e);
    }
  });

  // 成员加入服务器
  client.on('MEMBER_ADD', event => {
    const body = event.extra?.body as any;

    if (!body) {
      return;
    }

    const UserId = body.user_id ?? event.author_id;
    const [isMaster, UserKey] = getMaster(UserId);

    const e: PublicEventMemberAdd = {
      name: 'member.add',
      Platform: platform,
      GuildId: event.target_id ?? '',
      ChannelId: '',
      SpaceId: event.target_id ?? '',
      UserId: UserId,
      UserKey,
      IsMaster: isMaster,
      IsBot: false,
      MessageId: event.msg_id ?? '',
      BotId: botId,
      _tag: 'MEMBER_ADD',
      value: event
    };

    cbp.send(e);
  });

  // 成员离开服务器
  client.on('MEMBER_REMOVE', event => {
    const body = event.extra?.body as any;

    if (!body) {
      return;
    }

    const UserId = body.user_id ?? event.author_id;
    const [isMaster, UserKey] = getMaster(UserId);

    const e: PublicEventMemberRemove = {
      name: 'member.remove',
      Platform: platform,
      GuildId: event.target_id ?? '',
      ChannelId: '',
      SpaceId: event.target_id ?? '',
      UserId: UserId,
      UserKey,
      IsMaster: isMaster,
      IsBot: false,
      MessageId: event.msg_id ?? '',
      BotId: botId,
      _tag: 'MEMBER_REMOVE',
      value: event
    };

    cbp.send(e);
  });

  // 消息更新
  client.on('MESSAGES_UPDATE', event => {
    const body = event.extra?.body;

    if (!body) {
      return;
    }

    const e: PublicEventMessageUpdate = {
      name: 'message.update',
      Platform: platform,
      GuildId: body.channel_id ?? event.target_id ?? '',
      ChannelId: body.channel_id ?? event.target_id ?? '',
      SpaceId: body.channel_id ?? event.target_id ?? '',
      UserId: body.author_id ?? event.author_id ?? '',
      UserKey: '',
      IsMaster: false,
      IsBot: false,
      MessageId: body.msg_id ?? event.msg_id ?? '',
      BotId: botId,
      _tag: 'MESSAGES_UPDATE',
      value: event
    };

    cbp.send(e);
  });

  // 消息删除
  client.on('MESSAGES_DELETE', event => {
    const body = event.extra?.body;

    if (!body) {
      return;
    }

    const e: PublicEventMessageDelete = {
      name: 'message.delete',
      Platform: platform,
      GuildId: body.channel_id ?? event.target_id ?? '',
      ChannelId: body.channel_id ?? event.target_id ?? '',
      SpaceId: body.channel_id ?? event.target_id ?? '',
      MessageId: body.msg_id ?? event.msg_id ?? '',
      BotId: botId,
      _tag: 'MESSAGES_DELETE',
      value: event
    };

    cbp.send(e);
  });

  // 消息置顶
  client.on('MESSAGES_PIN', event => {
    const body = event.extra?.body;

    if (!body) {
      return;
    }

    const e: PublicEventMessagePin = {
      name: 'message.pin',
      Platform: platform,
      GuildId: body.channel_id ?? event.target_id ?? '',
      ChannelId: body.channel_id ?? event.target_id ?? '',
      SpaceId: body.channel_id ?? event.target_id ?? '',
      MessageId: body.msg_id ?? event.msg_id ?? '',
      BotId: botId,
      _tag: 'MESSAGES_PIN',
      value: event
    };

    cbp.send(e);
  });

  // 机器人加入服务器
  client.on('GUILD_JOIN', event => {
    const body = event.extra?.body;

    const e: PublicEventGuildJoin = {
      name: 'guild.join',
      Platform: platform,
      GuildId: body?.guild_id ?? event.target_id ?? '',
      ChannelId: '',
      SpaceId: body?.guild_id ?? event.target_id ?? '',
      UserId: event.author_id ?? '',
      UserKey: '',
      IsMaster: false,
      IsBot: true,
      MessageId: event.msg_id ?? '',
      BotId: botId,
      _tag: 'GUILD_JOIN',
      value: event
    };

    cbp.send(e);
  });

  // 机器人退出服务器
  client.on('GUILD_EXIT', event => {
    const body = event.extra?.body;

    const e: PublicEventGuildExit = {
      name: 'guild.exit',
      Platform: platform,
      GuildId: body?.guild_id ?? event.target_id ?? '',
      ChannelId: '',
      SpaceId: body?.guild_id ?? event.target_id ?? '',
      UserId: event.author_id ?? '',
      UserKey: '',
      IsMaster: false,
      IsBot: true,
      MessageId: event.msg_id ?? '',
      BotId: botId,
      _tag: 'GUILD_EXIT',
      value: event
    };

    cbp.send(e);
  });

  // 频道创建
  client.on('CHANNEL_CREATE', event => {
    const body = event.extra?.body;

    if (!body) {
      return;
    }

    const e: PublicEventChannelCreate = {
      name: 'channel.create',
      Platform: platform,
      GuildId: body.guild_id ?? event.target_id ?? '',
      ChannelId: body.id ?? '',
      SpaceId: body.guild_id ?? event.target_id ?? '',
      MessageId: event.msg_id ?? '',
      BotId: botId,
      _tag: 'CHANNEL_CREATE',
      value: event
    };

    cbp.send(e);
  });

  // 频道删除
  client.on('CHANNEL_DELETE', event => {
    const body = event.extra?.body;

    if (!body) {
      return;
    }

    const e: PublicEventChannelDelete = {
      name: 'channel.delete',
      Platform: platform,
      GuildId: body.guild_id ?? event.target_id ?? '',
      ChannelId: body.id ?? '',
      SpaceId: body.guild_id ?? event.target_id ?? '',
      MessageId: event.msg_id ?? '',
      BotId: botId,
      _tag: 'CHANNEL_DELETE',
      value: event
    };

    cbp.send(e);
  });

  // 频道更新
  client.on('CHANNEL_UPDATE', event => {
    const body = event.extra?.body;

    if (!body) {
      return;
    }

    const e: PublicEventChannelUpdate = {
      name: 'channel.update',
      Platform: platform,
      GuildId: body.guild_id ?? event.target_id ?? '',
      ChannelId: body.id ?? '',
      SpaceId: body.guild_id ?? event.target_id ?? '',
      MessageId: event.msg_id ?? '',
      BotId: botId,
      _tag: 'CHANNEL_UPDATE',
      value: event
    };

    cbp.send(e);
  });

  /**
   * 将 DataEnums 中的 Mention/Text 转为 KOOK KMarkdown 格式文本
   */
  const formatKookContent = (val: DataEnums[]): string => {
    // 已原生支持的类型
    const nativeItems = val.filter(item => item.type === 'Mention' || item.type === 'Text' || item.type === 'Link');
    // 未原生支持的类型（排除图片类，图片单独处理）
    const unsupportedItems = val.filter(
      item =>
        item.type !== 'Mention' &&
        item.type !== 'Text' &&
        item.type !== 'Link' &&
        item.type !== 'Image' &&
        item.type !== 'ImageURL' &&
        item.type !== 'ImageFile'
    );

    const nativeText = nativeItems
      .map(item => {
        if (item.type === 'Link') {
          return `[${item.value}](${item?.options?.link ?? item.value})`;
        } else if (item.type === 'Mention') {
          if (item.value === 'everyone' || item.value === 'all' || item.value === '' || typeof item.value !== 'string') {
            return '(met)all(met)';
          }
          if (item.options?.belong === 'user') {
            return `(met)${item.value}(met)`;
          } else if (item.options?.belong === 'channel') {
            return `(chn)${item.value}(chn)`;
          }

          return '';
        } else if (item.type === 'Text') {
          if (item.options?.style === 'block') {
            return `\`${item.value}\``;
          } else if (item.options?.style === 'italic') {
            return `*${item.value}*`;
          } else if (item.options?.style === 'bold') {
            return `**${item.value}**`;
          } else if (item.options?.style === 'strikethrough') {
            return `~~${item.value}~~`;
          } else if (item.options?.style === 'boldItalic') {
            return `***${item.value}***`;
          }

          return item.value;
        }

        return '';
      })
      .join('');

    // 降级处理：将 Markdown、Ark、Button 等不支持的类型转为 KMarkdown
    const hide = getKOOKConfig().hideUnsupported;
    const fallbackText =
      unsupportedItems.length > 0
        ? unsupportedItems
            .map(item => dataEnumToKMarkdown(item, hide))
            .filter(Boolean)
            .join('')
        : '';

    return [nativeText, fallbackText]
      .filter(Boolean)
      .join('')
      .replace(/^[^\S\n\r]+|[^\S\n\r]+$/g, '');
  };

  /**
   * 解析 Image/ImageURL/ImageFile 为 Buffer
   */
  const resolveImageBuffer = async (val: DataEnums[]): Promise<Buffer | null> => {
    const images = val.filter(item => item.type === 'Image' || item.type === 'ImageFile' || item.type === 'ImageURL');

    for (const item of images) {
      if (item.type === 'Image') {
        if (Buffer.isBuffer(item.value)) {
          return item.value;
        } else if (typeof item.value === 'string') {
          if (item.value.startsWith('http://') || item.value.startsWith('https://')) {
            return await getBufferByURL(item.value);
          } else if (item.value.startsWith('base64://')) {
            return Buffer.from(item.value.slice(9), 'base64');
          } else if (item.value.startsWith('file://')) {
            return readFileSync(item.value.slice(7));
          } else {
            return Buffer.from(item.value, 'base64');
          }
        }
      } else if (item.type === 'ImageURL') {
        return await getBufferByURL(item.value);
      } else if (item.type === 'ImageFile') {
        return readFileSync(item.value);
      }
    }

    return null;
  };

  /**
   * 上传图片并获取 URL
   */
  const uploadAndGetImageUrl = async (val: DataEnums[]): Promise<string | null> => {
    const bufferData = await resolveImageBuffer(val);

    if (!bufferData) {
      return null;
    }
    const imageRes = await client.postImage(bufferData);

    if (!imageRes || typeof imageRes === 'boolean') {
      return null;
    }
    const url = imageRes.data?.url;

    return url || null;
  };

  /**
   *
   * @param channel_id
   * @param val
   * @returns
   */
  const sendChannel = async (targetId: string, val: DataEnums[]) => {
    if (!val || val.length <= 0) {
      return [];
    }
    const content = formatKookContent(val);

    try {
      const imageUrl = await uploadAndGetImageUrl(val);

      // hideUnsupported 模式：检查转换后内容是否为空
      if (getKOOKConfig().hideUnsupported && !content && !imageUrl) {
        logger.info('[kook] hideUnsupported: 消息内容转换后为空，跳过发送');

        return [];
      }

      if (imageUrl && content) {
        // 先发图片，再发文本
        const imgRes = await client.createMessage({
          type: 2,
          target_id: targetId,
          content: imageUrl
        });
        const txtRes = await client.createMessage({
          type: 9,
          target_id: targetId,
          content: content
        });

        return [createResult(ResultCode.Ok, 'client.createMessage', imgRes), createResult(ResultCode.Ok, 'client.createMessage', txtRes)];
      }

      if (content) {
        const res = await client.createMessage({
          type: 9,
          target_id: targetId,
          content: content
        });

        return [createResult(ResultCode.Ok, 'client.createMessage', res)];
      }

      if (imageUrl) {
        const res = await client.createMessage({
          type: 2,
          target_id: targetId,
          content: imageUrl
        });

        return [createResult(ResultCode.Ok, 'client.createMessage', res)];
      }

      return [];
    } catch (error) {
      return [createResult(ResultCode.Fail, 'client.createMessage', error)];
    }
  };

  /**
   *
   * @param channel_id
   * @param val
   * @returns
   */
  const sendUser = async (openId: string, val: DataEnums[]) => {
    if (!val || val.length <= 0) {
      return [];
    }
    const content = formatKookContent(val);

    try {
      const imageUrl = await uploadAndGetImageUrl(val);

      // hideUnsupported 模式：检查转换后内容是否为空
      if (getKOOKConfig().hideUnsupported && !content && !imageUrl) {
        logger.info('[kook] hideUnsupported: 消息内容转换后为空，跳过发送');

        return [];
      }

      if (imageUrl && content) {
        const imgRes = await client.createDirectMessage({
          type: 2,
          chat_code: openId,
          content: imageUrl
        });
        const txtRes = await client.createDirectMessage({
          type: 9,
          chat_code: openId,
          content: content
        });

        return [createResult(ResultCode.Ok, 'client.createDirectMessage', imgRes), createResult(ResultCode.Ok, 'client.createDirectMessage', txtRes)];
      }

      if (content) {
        const res = await client.createDirectMessage({
          type: 9,
          chat_code: openId,
          content: content
        });

        return [createResult(ResultCode.Ok, 'client.createDirectMessage', res)];
      }

      if (imageUrl) {
        const res = await client.createDirectMessage({
          type: 2,
          chat_code: openId,
          content: imageUrl
        });

        return [createResult(ResultCode.Ok, 'client.createDirectMessage', res)];
      }

      return [];
    } catch (error) {
      return [createResult(ResultCode.Fail, 'client.createDirectMessage', error)];
    }
  };

  /**
   *
   * @param user_id
   * @param val
   * @returns
   */
  // const sendUserByUserId = async (user_id: string, val: DataEnums[]) => {
  //   if (val.length < 0) return []
  //   // 创建私聊标记
  //   const data = await client.userChatCreate(user_id).then(res => res?.data)
  //   const open_id = data?.code
  //   return await sendUser(open_id, val)
  // }

  const api = {
    active: {
      send: {
        channel: sendChannel,
        user: sendUser
      }
    },
    use: {
      send: async (event, val: DataEnums[]) => {
        if (!val || val.length <= 0) {
          return [];
        }
        if (event.name === 'message.create') {
          return await sendChannel(event.ChannelId, val);
        } else if (event.name === 'private.message.create') {
          return await sendUser(event.OpenId, val);
        }

        return [];
      },
      mention: e => {
        const event = e.value;
        const MessageMention: User[] = [];
        const mentionRolePart = event.extra.kmarkdown?.mention_role_part ?? [];

        for (const item of mentionRolePart) {
          const UserId = item.role_id;
          const [isMaster, UserKey] = getMaster(UserId);

          MessageMention.push({
            UserId: UserId,
            UserName: item.name,
            UserKey: UserKey,
            IsMaster: isMaster,
            IsBot: true
          });
        }
        const mentionPart = event.extra.kmarkdown?.mention_part ?? [];

        for (const item of mentionPart) {
          const UserId = item.id;
          const [isMaster, UserKey] = getMaster(UserId);

          MessageMention.push({
            UserId: UserId,
            UserName: item.username,
            UserKey: UserKey,
            IsMaster: isMaster,
            IsBot: false
          });
        }

        return new Promise(resolve => {
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

        if (!res) {
          consume([createResult(ResultCode.Ok, '请求完成', null)]);

          return;
        }
        consume(res.map(item => createResult(ResultCode.Ok, '请求完成', item)));
      } else if (data.action === 'message.send.channel') {
        const channelId = data.payload.ChannelId;
        const val = data.payload.params.format;
        const res = await api.active.send.channel(channelId, val);

        if (!res) {
          consume([createResult(ResultCode.Ok, '请求完成', null)]);

          return;
        }
        consume(res.map(item => createResult(ResultCode.Ok, '请求完成', item)));
      } else if (data.action === 'message.send.user') {
        const userId = data.payload.UserId;
        const val = data.payload.params.format;
        const res = await api.active.send.user(userId, val);

        if (!res) {
          consume([createResult(ResultCode.Ok, '请求完成', null)]);

          return;
        }
        consume(res.map(item => createResult(ResultCode.Ok, '请求完成', item)));
      } else if (data.action === 'mention.get') {
        const event = data.payload.event;
        const res = await api.use.mention(event);

        consume([createResult(ResultCode.Ok, '请求完成', res)]);
      } else if (data.action === 'me.info') {
        const res = await client
          .userMe()
          .then(r => {
            const d = r?.data ?? r;
            const [isMaster, UserKey] = getMaster(String(d?.id));

            return createResult(ResultCode.Ok, data.action, {
              UserId: String(d?.id),
              UserName: d?.username,
              UserAvatar: d?.avatar ?? '',
              IsBot: true,
              IsMaster: isMaster,
              UserKey
            });
          })
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'message.delete') {
        // ─── 消息管理 ───
        const messageId = data.payload.MessageId;
        const res = await client
          .messageDelete(messageId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'message.edit') {
        const messageId = data.payload.MessageId;
        // 简单取文本内容
        const format = data.payload.params?.format;
        const content = format?.map(i => i.value).join('') ?? '';
        const res = await client
          .messageUpdate({ msg_id: messageId, content })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'reaction.add') {
        // ─── 表情回应 ───
        const res = await client
          .messageAddReaction({ msg_id: data.payload.MessageId, emoji: data.payload.EmojiId })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'reaction.remove') {
        const res = await client
          .messageDeleteReaction({ msg_id: data.payload.MessageId, emoji: data.payload.EmojiId, user_id: '' })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.info') {
        const guildId = data.payload.params?.guildId ?? data.payload.GuildId;
        const userId = data.payload.params?.userId ?? data.payload.UserId;
        const res = await client
          .userView(guildId, userId)
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.list') {
        const guildId = data.payload.GuildId;
        const res = await client
          .guildUserList(guildId)
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.kick') {
        const res = await client
          .guildKickout(data.payload.GuildId, data.payload.UserId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.ban') {
        const res = await client
          .blacklistCreate({ guild_id: data.payload.GuildId, target_id: data.payload.UserId, remark: data.payload.params?.reason })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.unban') {
        const res = await client
          .blacklistDelete({ guild_id: data.payload.GuildId, target_id: data.payload.UserId })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.mute') {
        const duration = data.payload.params?.duration ?? 0;

        // type: 1=麦克风禁言, 2=耳机禁言; 默认1
        if (duration > 0) {
          const res = await client
            .guildMuteCreate(data.payload.GuildId, data.payload.UserId, 1)
            .then(r => createResult(ResultCode.Ok, data.action, r))
            .catch(err => createResult(ResultCode.Fail, data.action, err));

          consume([res]);
        } else {
          const res = await client
            .guildMuteDelete(data.payload.GuildId, data.payload.UserId, 1)
            .then(r => createResult(ResultCode.Ok, data.action, r))
            .catch(err => createResult(ResultCode.Fail, data.action, err));

          consume([res]);
        }
      } else if (data.action === 'member.card') {
        const res = await client
          .guildNickname(data.payload.GuildId, data.payload.params?.card ?? '', data.payload.UserId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'guild.info') {
        const res = await client
          .guildView(data.payload.GuildId)
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'guild.list') {
        const res = await client
          .guildList()
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'me.guilds') {
        const res = await client
          .guildList()
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.info') {
        const res = await client
          .channelView(data.payload.ChannelId)
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.list') {
        const res = await client
          .channelList(data.payload.GuildId)
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.create') {
        const params = data.payload.params;
        const res = await client
          .channelCreate({ guild_id: data.payload.GuildId, name: params.name, type: params.type ? Number(params.type) : 1, parent_id: params.parentId })
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.update') {
        const params = data.payload.params;
        const res = await client
          .channelUpdate({ channel_id: data.payload.ChannelId, name: params.name, topic: params.topic })
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.delete') {
        const res = await client
          .channelDelete(data.payload.ChannelId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      }
      // ─── 角色管理 ───
      else if (data.action === 'role.list') {
        const res = await client
          .guildRoleList(data.payload.GuildId)
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.create') {
        const params = data.payload.params;
        const res = await client
          .guildRoleCreate({ guild_id: data.payload.GuildId, name: params.name })
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.update') {
        const params = data.payload.params;
        const res = await client
          .guildRoleUpdate({ guild_id: data.payload.GuildId, role_id: Number(data.payload.RoleId), name: params.name, color: params.color })
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.delete') {
        const res = await client
          .guildRoleDelete({ guild_id: data.payload.GuildId, role_id: Number(data.payload.RoleId) })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.assign') {
        const res = await client
          .guildRoleGrant({ guild_id: data.payload.GuildId, user_id: data.payload.UserId, role_id: Number(data.payload.RoleId) })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.remove') {
        const res = await client
          .guildRoleRevoke({ guild_id: data.payload.GuildId, user_id: data.payload.UserId, role_id: Number(data.payload.RoleId) })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'message.get') {
        const res = await client
          .messageView(data.payload.MessageId)
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'guild.leave') {
        const res = await client
          .guildLeave(data.payload.GuildId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'user.info') {
        const res = await client
          .userView(data.payload.GuildId ?? '', data.payload.UserId)
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
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

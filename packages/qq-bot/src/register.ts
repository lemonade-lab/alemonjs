import type { ActionTarget, DataEnums, MessageMediaItem, User } from 'alemonjs';
import { cbpPlatform, createResult, ResultCode, FormatEvent, logger } from 'alemonjs';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { basename } from 'node:path';
import { QQBotClients } from './sdk/client.websoket';
import { chunkedUpload } from './upload';
import { AT_MESSAGE_CREATE_TYPE } from './message/AT_MESSAGE_CREATE';
import { GROUP_MESSAGE_CREATE_TYPE } from './message/group/GROUP_MESSAGE_CREATE';
import { AT_MESSAGE_CREATE, C2C_MESSAGE_CREATE, DIRECT_MESSAGE_CREATE, GROUP_AT_MESSAGE_CREATE, MESSAGE_CREATE } from './sends';
import { getIdentity, getMaster, getQQBotConfig } from './config';
import { platform } from './config';

export type QQBotRegistration = {
  onAction: (data: any, consume: (result: any[]) => void) => Promise<void>;
  onApi: (data: any, consume: (result: any[]) => void) => Promise<void>;
};

/**
 * notice 事件中平台支持以 event_id 被动回复的 tag
 * （QQ 官方「发送消息」文档：群聊支持 GROUP_ADD_ROBOT / GROUP_MSG_RECEIVE，
 * 单聊支持 C2C_MSG_RECEIVE / FRIEND_ADD；event_id 取网关信封 payload.id）
 */
const GROUP_EVENT_REPLY_TAGS = new Set(['GROUP_ADD_ROBOT', 'GROUP_MSG_RECEIVE']);
const C2C_EVENT_REPLY_TAGS = new Set(['C2C_MSG_RECEIVE', 'FRIEND_ADD']);

/**
 * notice / member 类事件 tag：事件不含平台认可的被动回复 msg_id（MessageId 为合成值或缺省），
 * 消息发送统一降级为群主动消息（仅携带 ChannelId，不透传 MessageId）。
 * 事件回复 tag 也在其中：缺失 event_id 时同样落到主动消息
 */
const GROUP_NOTICE_TAGS = new Set([
  'GROUP_ADD_ROBOT',
  'GROUP_DEL_ROBOT',
  'GROUP_MEMBER_ADD',
  'GROUP_MEMBER_REMOVE',
  'GROUP_JOIN_REQUEST',
  'GROUP_MSG_RECEIVE',
  'GROUP_MSG_REJECT',
  'MESSAGE_AUDIT_PASS',
  'MESSAGE_AUDIT_REJECT'
]);

/**
 * 好友 / C2C notice 类事件 tag：同上，降级为私聊主动消息（仅携带 UserId）
 */
const C2C_NOTICE_TAGS = new Set(['C2C_MSG_RECEIVE', 'C2C_MSG_REJECT', 'FRIEND_ADD', 'FRIEND_DEL']);

export const register = (
  client: QQBotClients,
  options?: {
    botId?: string;
    cbp?: ReturnType<typeof cbpPlatform>;
    bindActions?: boolean;
  }
): QQBotRegistration => {
  // QQ's rich-media API accepts at most 100 MiB.  Keeping the guard here
  // makes every legacy and scoped media action fail before buffering a file
  // that can never be uploaded.
  const MAX_MEDIA_SIZE = 100 * 1024 * 1024;
  const config = getQQBotConfig();

  // Nested multi-bot config has no top-level app_id. The registry owns the
  // stable identity and passes it here for every event and action.
  const botId = String(options?.botId ?? config?.app_id ?? '');
  /**
   * 连接 alemonjs 服务器。
   * 向 alemonjs 推送标准信息
   */
  const port = process.env?.port || config?.port || 17117;
  const url = `ws://127.0.0.1:${port}`;
  const cbp = options?.cbp ?? cbpPlatform(url);

  /**
   * group
   *
   * GROUP_AT_MESSAGE_CREATE
   * C2C_MESSAGE_CREATE
   */

  const createUserAvatarURL = (authorId: string) => {
    return `https://q.qlogo.cn/qqapp/${botId}/${authorId}/640`;
  };

  const getGroupMessageMeta = (event: GROUP_MESSAGE_CREATE_TYPE) => {
    const author = event?.author;
    const UserId = author?.id ?? '';
    const memberOpenId = author?.member_openid ?? '';
    const groupId = event?.group_id ?? event?.group_openid ?? '';
    const messageId = event?.id ?? '';
    const [isMaster, UserKey] = UserId ? getMaster(UserId) : [false, ''];

    return {
      UserId,
      UserKey,
      isMaster,
      UserName: author?.username ?? '',
      UserAvatar: UserId ? createUserAvatarURL(UserId) : '',
      groupId,
      messageId,
      openId: memberOpenId ? `C2C:${memberOpenId}` : ''
    };
  };

  const getGroupAuditMeta = (event: { audit_id?: string; audit_time?: string; group_openid?: string; message_id?: string }) => {
    const groupId = event?.group_openid ?? '';
    const messageId = event?.message_id ?? event?.audit_id ?? '';
    const auditTime = event?.audit_time ?? '';

    return {
      groupId,
      messageId,
      auditTime
    };
  };

  const getMediaItems = (attachments?: Array<{ url?: string; content_type?: string; filename?: string; size?: number }>): MessageMediaItem[] => {
    return (attachments || []).flatMap(attachment => {
      if (!attachment?.url) {
        return [];
      }
      const mimeType = attachment.content_type || '';
      const Type: MessageMediaItem['Type'] = mimeType.startsWith('image/')
        ? 'image'
        : mimeType.startsWith('audio/')
        ? 'audio'
        : mimeType.startsWith('video/')
        ? 'video'
        : 'file';

      return [
        {
          Type,
          Url: attachment.url,
          ...(attachment.filename && { FileName: attachment.filename }),
          ...(typeof attachment.size === 'number' && { FileSize: attachment.size }),
          ...(mimeType && { MimeType: mimeType })
        }
      ];
    });
  };

  const normalizeTarget = (target?: ActionTarget): ActionTarget | undefined => {
    if (!target?.targetId || !target.scope) {
      return undefined;
    }

    return target;
  };

  const validateTargetBot = (target: ActionTarget) => {
    return !target.BotId || target.BotId === botId;
  };

  const mediaCache = new Map<string, { fileId: string; expiresAt?: number }>();
  const mediaType = (type: string) => (type === 'image' ? 1 : type === 'video' ? 2 : type === 'audio' ? 3 : 4);

  const prepareMedia = async (target: ActionTarget, params: any) => {
    const sources = [params?.url, params?.data, params?.filePath, params?.fileId].filter(value => value !== undefined && value !== '').length;

    if (sources !== 1) {
      throw new Error('Provide exactly one media source: url, data, filePath, or fileId');
    }
    if (params.fileId) {
      return { fileId: String(params.fileId), reused: true };
    }

    let data = params.data as string | undefined;
    let buffer: Buffer | undefined;
    let filePath: string | undefined;
    let fileSize: number | undefined;
    let hashes: Awaited<ReturnType<typeof client.getMediaFileHashes>> | undefined;
    let name = params.name as string | undefined;
    let hashSource: string | Buffer = String(params.url || '');

    if (params.filePath) {
      const metadata = await stat(String(params.filePath));

      if (!metadata.isFile()) {
        throw new Error('media filePath must point to a regular file');
      }
      if (metadata.size > MAX_MEDIA_SIZE) {
        throw new Error('QQ media files must not exceed 100 MiB');
      }
      filePath = String(params.filePath);
      fileSize = metadata.size;
      hashes = await client.getMediaFileHashes(filePath);
      hashSource = hashes.sha256;
      name ||= basename(filePath);
      // QQ's direct endpoint still needs base64 for small local files. Large
      // files remain on disk and the chunked uploader streams each part.
      if (fileSize < 5 * 1024 * 1024) {
        buffer = await readFile(filePath);
        data = `base64://${buffer.toString('base64')}`;
      }
    } else if (data) {
      hashSource = data;
      const value = data.replace(/^base64:\/\//, '');

      buffer = Buffer.from(value, 'base64');
      if (buffer.length > MAX_MEDIA_SIZE) {
        throw new Error('QQ media files must not exceed 100 MiB');
      }
    }
    const key = [botId, target.scope, target.targetId, params.type, createHash('sha256').update(hashSource).digest('hex')].join(':');
    const cached = mediaCache.get(key);

    if (cached && (!cached.expiresAt || cached.expiresAt > Date.now())) {
      return { fileId: cached.fileId, expiresAt: cached.expiresAt, reused: true };
    }

    return { key, url: params.url, data, buffer, filePath, fileSize, hashes, name, reused: false };
  };

  const uploadMedia = async (target: ActionTarget, params: any) => {
    if (!validateTargetBot(target)) {
      throw new Error(`BotId ${target.BotId} is not active`);
    }
    if (target.scope !== 'group' && target.scope !== 'c2c') {
      throw new Error('QQ media upload only supports group and c2c targets');
    }
    const prepared = await prepareMedia(target, params);

    if (prepared.fileId) {
      return prepared;
    }
    const fileType = mediaType(params.type);
    const value =
      prepared.filePath && prepared.fileSize && prepared.fileSize >= 5 * 1024 * 1024
        ? await client.postChunkedRichMedia({
            scope: target.scope,
            targetId: target.targetId,
            fileType,
            filePath: prepared.filePath,
            size: prepared.fileSize,
            hashes: prepared.hashes,
            name: prepared.name
          })
        : prepared.buffer && prepared.buffer.length >= 5 * 1024 * 1024
        ? await client.postChunkedRichMedia({ scope: target.scope, targetId: target.targetId, fileType, data: prepared.buffer, name: prepared.name })
        : target.scope === 'group'
        ? await client.postRichMediaByGroup(target.targetId, { file_type: fileType, url: prepared.url, file_data: prepared.data, srv_send_msg: false })
        : await client.postRichMediaByUser(target.targetId, { file_type: fileType, url: prepared.url, file_data: prepared.data, srv_send_msg: false });
    const expiresAt = value.ttl ? Date.now() + value.ttl * 1000 : undefined;

    if (prepared.key) {
      mediaCache.set(prepared.key, { fileId: value.file_info, expiresAt });
    }

    return { fileId: value.file_info, expiresAt, reused: false };
  };

  const createUserMeta = (UserId: string, extra: Partial<User> = {}): User => {
    const [IsMaster, UserKey] = getIdentity(UserId);

    return {
      UserId,
      UserKey,
      IsMaster,
      IsBot: false,
      ...extra
    };
  };

  client.on('GROUP_ADD_ROBOT', event => {
    // 机器人加入群组
    cbp.send(
      FormatEvent.create('guild.join')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.group_openid, SpaceId: `GROUP:${event.group_openid}` })
        .addChannel({ ChannelId: event.group_openid })
        .addUser(createUserMeta(event.op_member_openid, { UserAvatar: createUserAvatarURL(event.op_member_openid) }))
        .addMessage({ MessageId: event.id })
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
        .addUser(createUserMeta(event.op_member_openid, { UserAvatar: createUserAvatarURL(event.op_member_openid) }))
        .add({ tag: 'GROUP_DEL_ROBOT' }).value
    );
  });

  // 监听消息
  client.on('GROUP_MESSAGE_CREATE', event => {
    if (event?.author?.bot) {
      return;
    }

    const msg = getMessageContent(event);
    const meta = getGroupMessageMeta(event);

    // 定义消息
    cbp.send(
      FormatEvent.create('message.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId, IsAtMe: false, IsPrivate: false })
        .addGuild({ GuildId: meta.groupId, SpaceId: `GROUP:${meta.groupId}` })
        .addChannel({ ChannelId: meta.groupId })
        .addUser({
          UserId: meta.UserId,
          UserKey: meta.UserKey,
          UserAvatar: meta.UserAvatar,
          UserName: meta.UserName,
          IsMaster: meta.isMaster,
          IsBot: false
        })
        .addMessage({ MessageId: meta.messageId })
        .addText({ MessageText: msg?.trim() })
        .addMedia({ MessageMedia: getMediaItems(event.attachments) })
        .addOpen({ OpenId: meta.openId })
        .add({ tag: 'GROUP_MESSAGE_CREATE' }).value
    );
  });

  client.on('GROUP_MEMBER_ADD', event => {
    const UserId = event.op_member_openid ?? event.member_openid ?? '';
    const [isMaster, UserKey] = getMaster(UserId);

    cbp.send(
      FormatEvent.create('member.add')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.group_openid ?? '', SpaceId: `GROUP:${event.group_openid ?? ''}` })
        .addChannel({ ChannelId: event.group_openid ?? '' })
        .addUser({ UserId: UserId, UserKey, UserName: event?.username ?? '', UserAvatar: createUserAvatarURL(UserId), IsMaster: isMaster, IsBot: false })
        .add({ tag: 'GROUP_MEMBER_ADD' }).value
    );
  });
  client.on('GROUP_MEMBER_REMOVE', event => {
    const UserId = event.op_member_openid ?? event.member_openid ?? '';
    const [isMaster, UserKey] = getMaster(UserId);

    cbp.send(
      FormatEvent.create('member.remove')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.group_openid ?? '', SpaceId: `GROUP:${event.group_openid ?? ''}` })
        .addChannel({ ChannelId: event.group_openid ?? '' })
        .addUser({ UserId: UserId, UserKey, UserName: event?.username ?? '', UserAvatar: createUserAvatarURL(UserId), IsMaster: isMaster, IsBot: false })
        .add({ tag: 'GROUP_MEMBER_REMOVE' }).value
    );
  });

  // 用户申请加群
  client.on('GROUP_JOIN_REQUEST', event => {
    const UserId = event.member_openid ?? '';
    const [isMaster, UserKey] = getMaster(UserId);

    cbp.send(
      FormatEvent.create('notice.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.group_openid ?? '', SpaceId: `GROUP:${event.group_openid ?? ''}` })
        .addChannel({ ChannelId: event.group_openid ?? '' })
        .addUser({
          UserId: UserId,
          UserKey,
          UserName: event?.username ?? '',
          UserAvatar: createUserAvatarURL(UserId),
          IsMaster: isMaster,
          IsBot: event.bot ?? false
        })
        .addMessage({ MessageId: `group_join_request_${event.group_openid}_${event.join_request_id}` })
        .add({ tag: 'GROUP_JOIN_REQUEST' }).value
    );
  });

  // 监听消息
  client.on('GROUP_AT_MESSAGE_CREATE', event => {
    if (event?.author?.bot) {
      return;
    }

    const msg = getMessageContent(event);
    const meta = getGroupMessageMeta(event);

    // 定义消
    cbp.send(
      FormatEvent.create('message.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId, IsAtMe: true, IsPrivate: false })
        .addGuild({ GuildId: meta.groupId, SpaceId: `GROUP:${meta.groupId}` })
        .addChannel({ ChannelId: meta.groupId })
        .addUser({
          UserId: meta.UserId,
          UserKey: meta.UserKey,
          UserAvatar: meta.UserAvatar,
          UserName: meta.UserName,
          IsMaster: meta.isMaster,
          IsBot: false
        })
        .addMessage({ MessageId: meta.messageId })
        .addText({ MessageText: msg?.trim() })
        .addMedia({ MessageMedia: getMediaItems(event.attachments) })
        .addOpen({ OpenId: meta.openId })
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
        .addPlatform({ Platform: platform, value: event, BotId: botId, IsAtMe: false, IsPrivate: true })
        .addUser({
          UserId: event.author.id,
          UserKey,
          UserAvatar: UserAvatar,
          UserName: event?.author?.username,
          IsMaster: isMaster,
          IsBot: false
        })
        .addMessage({ MessageId: event.id })
        .addText({ MessageText: event.content?.trim() })
        .addMedia({ MessageMedia: getMediaItems(event.attachments) })
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
        .addPlatform({ Platform: platform, value: event, BotId: botId, IsAtMe: false, IsPrivate: true })
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
        .addMedia({ MessageMedia: getMediaItems(event.attachments) })
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
        .addPlatform({ Platform: platform, value: event, BotId: botId, IsAtMe: true, IsPrivate: false })
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
        .addMedia({ MessageMedia: getMediaItems(event.attachments) })
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

    if (event?.mentions) {
      // 去掉@ 转为纯消息
      for (const item of event.mentions) {
        // TODO sb tx
        if (item?.id) {
          msg = msg.replace(`<@!${item.id}>`, '').trim();
          msg = msg.replace(`<@${item.id}>`, '').trim();
        }
        if (item?.username) {
          msg = msg.replace(`[${item.username}]`, '').trim();
        }
      }
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
        .addPlatform({ Platform: platform, value: event, BotId: botId, IsAtMe: false, IsPrivate: false })
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
        .addMedia({ MessageMedia: getMediaItems(event.attachments) })
        .addOpen({ OpenId: `DIRECT:${event.guild_id}` })
        .add({ tag: 'MESSAGE_CREATE' }).value
    );
  });

  client.on('INTERACTION_CREATE', async event => {
    // 立即回应互动事件，解除客户端按钮 loading；指令按钮需 3 秒内响应
    try {
      await client.interactionResponse('group', event.id, 0);
    } catch (err) {
      createResult(ResultCode.Fail, 'interactionResponse failed', err?.response?.data ?? err?.message ?? err);
    }

    if (event.scene === 'group') {
      const UserAvatar = createUserAvatarURL(event.group_member_openid);

      const UserId = event.group_member_openid;

      const [isMaster, UserKey] = getMaster(UserId);

      const MessageText = event.data.resolved.button_data?.trim() || '';

      const e = FormatEvent.create('interaction.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId, IsAtMe: false, IsPrivate: false })
        .addGuild({ GuildId: event.group_openid, SpaceId: `GROUP:${event.group_openid}` })
        .addChannel({ ChannelId: event.group_openid })
        .addUser({
          UserId: event.group_member_openid,
          UserKey,
          UserAvatar: UserAvatar,
          // UserName: event?.author?.username ?? '',
          IsMaster: isMaster,
          IsBot: false
        })
        .addMessage({ MessageId: event.id })
        .addText({ MessageText: MessageText })
        .addInteraction({
          InteractionId: event.id,
          InteractionData: JSON.stringify(event.data.resolved),
          Target: { scope: 'group', targetId: event.group_openid, BotId: botId }
        })
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
        .addPlatform({ Platform: platform, value: event, BotId: botId, IsAtMe: false, IsPrivate: true })
        .addUser({
          UserId: event.user_openid,
          UserKey,
          UserAvatar: UserAvatar,
          // UserName: event?.author?.username ?? '',
          IsMaster: isMaster,
          IsBot: false
        })
        .addMessage({ MessageId: event.id })
        .addText({ MessageText: MessageText })
        .addInteraction({
          InteractionId: event.id,
          InteractionData: JSON.stringify(event.data.resolved),
          Target: { scope: 'c2c', targetId: event.user_openid, BotId: botId }
        })
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
        .addPlatform({ Platform: platform, value: event, BotId: botId, IsAtMe: false, IsPrivate: false })
        .addGuild({ GuildId: event.guild_id, SpaceId: `GUILD:${event.channel_id}` })
        .addChannel({ ChannelId: event.channel_id })
        .addUser({ UserId: event.data.resolved.user_id, UserKey, UserAvatar: UserAvatar, IsMaster: isMaster, IsBot: false })
        .addMessage({ MessageId: event.data.resolved.message_id })
        .addText({ MessageText: MessageText })
        .addInteraction({
          InteractionId: event.id,
          InteractionData: JSON.stringify(event.data.resolved),
          Target: { scope: 'channel', targetId: event.channel_id, BotId: botId }
        })
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
        .add({ tag: 'CHANNEL_DELETE' }).value
    );
  });

  // 服务器创建（机器人加入频道）
  client.on('GUILD_CREATE', event => {
    cbp.send(
      FormatEvent.create('guild.join')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.id ?? '', SpaceId: `GUILD:${event.id ?? ''}` })
        .addUser({ UserId: event.op_user_id ?? '', UserKey: '', IsMaster: false, IsBot: false })
        .add({ tag: 'GUILD_CREATE' }).value
    );
  });

  // 服务器删除（机器人退出频道）
  client.on('GUILD_DELETE', event => {
    cbp.send(
      FormatEvent.create('guild.exit')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.id ?? '', SpaceId: `GUILD:${event.id ?? ''}` })
        .addUser({ UserId: event.op_user_id ?? '', UserKey: '', IsMaster: false, IsBot: false })
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
        .addUser({ UserId: UserId, UserKey, UserName: event.user?.username ?? '', UserAvatar: createUserAvatarURL(UserId), IsMaster: isMaster, IsBot: false })
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
        .addUser({ UserId: UserId, UserKey, UserName: event.user?.username ?? '', UserAvatar: createUserAvatarURL(UserId), IsMaster: isMaster, IsBot: false })
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
        .addUser({ UserId: UserId, UserKey, UserName: event.user?.username ?? '', UserAvatar: createUserAvatarURL(UserId), IsMaster: isMaster, IsBot: false })
        .add({ tag: 'GUILD_MEMBER_UPDATE' }).value
    );
  });

  // 好友添加
  client.on('FRIEND_ADD', event => {
    cbp.send(
      FormatEvent.create('private.friend.add')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addUser(createUserMeta(event.openid ?? ''))
        .addMessage({ MessageId: event.id })
        .add({ tag: 'FRIEND_ADD' }).value
    );
  });

  // 好友删除
  client.on('FRIEND_DEL', event => {
    cbp.send(
      FormatEvent.create('private.friend.remove')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addUser(createUserMeta(event.openid ?? ''))
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
        .add({ tag: 'CHANNEL_UPDATE' }).value
    );
  });

  // 频道信息更新
  client.on('GUILD_UPDATE', event => {
    cbp.send(
      FormatEvent.create('guild.update')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: event.id ?? '', SpaceId: `GUILD:${event.id ?? ''}` })
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
        .addUser(createUserMeta(event.op_member_openid))
        .addMessage({ MessageId: event.id })
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
        .addUser(createUserMeta(event.op_member_openid))
        .addMessage({ MessageId: `group_msg_reject_${event.group_openid}_${event.timestamp}` })
        .add({ tag: 'GROUP_MSG_REJECT' }).value
    );
  });

  // 群消息审核通过
  client.on('MESSAGE_AUDIT_PASS', event => {
    const meta = getGroupAuditMeta(event);

    cbp.send(
      FormatEvent.create('notice.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: meta.groupId, SpaceId: `GROUP:${meta.groupId}` })
        .addChannel({ ChannelId: meta.groupId })
        .addMessage({ MessageId: meta.messageId })
        .add({ tag: 'MESSAGE_AUDIT_PASS' }).value
    );
  });

  // 群消息审核不通过
  client.on('MESSAGE_AUDIT_REJECT', event => {
    const meta = getGroupAuditMeta(event);

    cbp.send(
      FormatEvent.create('notice.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addGuild({ GuildId: meta.groupId, SpaceId: `GROUP:${meta.groupId}` })
        .addChannel({ ChannelId: meta.groupId })
        .addMessage({ MessageId: meta.messageId })
        .add({ tag: 'MESSAGE_AUDIT_REJECT' }).value
    );
  });

  // C2C消息推送开启
  client.on('C2C_MSG_RECEIVE', event => {
    cbp.send(
      FormatEvent.create('private.notice.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addUser(createUserMeta(event.openid ?? ''))
        .addMessage({ MessageId: event.id })
        .add({ tag: 'C2C_MSG_RECEIVE' }).value
    );
  });

  // C2C消息推送关闭
  client.on('C2C_MSG_REJECT', event => {
    cbp.send(
      FormatEvent.create('private.notice.create')
        .addPlatform({ Platform: platform, value: event, BotId: botId })
        .addUser(createUserMeta(event.openid ?? ''))
        .addMessage({ MessageId: `c2c_msg_reject_${event.openid}_${event.timestamp}` })
        .add({ tag: 'C2C_MSG_REJECT' }).value
    );
  });

  client.on('ERROR', console.error);

  const api = {
    active: {
      send: {
        target: async (target: ActionTarget, val: DataEnums[], replyId?: string) => {
          if (!validateTargetBot(target)) {
            return [createResult(ResultCode.FailParams, `BotId ${target.BotId} is not active`, null)];
          }
          if (target.scope === 'group') {
            return GROUP_AT_MESSAGE_CREATE(client, { ChannelId: target.targetId, MessageId: replyId }, val);
          }
          if (target.scope === 'c2c') {
            return C2C_MESSAGE_CREATE(client, { UserId: target.targetId, MessageId: replyId }, val);
          }
          if (target.scope === 'channel') {
            return AT_MESSAGE_CREATE(client, { ChannelId: target.targetId, MessageId: replyId }, val);
          }
          if (target.scope === 'direct') {
            return DIRECT_MESSAGE_CREATE(client, { UserId: target.targetId, MessageId: replyId }, val);
          }

          return [createResult(ResultCode.FailParams, `Unsupported target scope: ${target.scope}`, null)];
        },
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
        val: DataEnums[],
        options?: { forceVerifyImageResource?: boolean }
      ) => {
        if (!val || val.length <= 0) {
          return [];
        }
        // 打  tag
        const tag = event._tag;

        // 群at
        if (tag === 'GROUP_AT_MESSAGE_CREATE') {
          return await GROUP_AT_MESSAGE_CREATE(client, event, val, options);
        }
        if (tag === 'GROUP_MESSAGE_CREATE') {
          return await GROUP_AT_MESSAGE_CREATE(client, event, val, options);
        }
        // 私聊
        if (tag === 'C2C_MESSAGE_CREATE') {
          return await C2C_MESSAGE_CREATE(client, event, val, options);
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
          return await GROUP_AT_MESSAGE_CREATE(client, event, val, options);
        }
        if (tag === 'INTERACTION_CREATE_C2C') {
          return await C2C_MESSAGE_CREATE(client, event, val, options);
        }
        if (tag === 'INTERACTION_CREATE_GUILD') {
          return await AT_MESSAGE_CREATE(client, event, val);
        }

        // notice 事件中平台支持事件回复的 tag：透传事件对象走 event_id 被动回复链路；
        // 缺失 event_id 时落到下方主动消息降级
        if (GROUP_EVENT_REPLY_TAGS.has(tag) && event.MessageId) {
          return await GROUP_AT_MESSAGE_CREATE(client, event, val, options);
        }
        if (C2C_EVENT_REPLY_TAGS.has(tag) && event.MessageId) {
          return await C2C_MESSAGE_CREATE(client, event, val, options);
        }

        // 其余 notice / member 事件：无被动回复 msg_id，降级为主动消息。
        // 构造仅含目标 ID 的新事件，避免合成 MessageId 被平台当作无效 msg_id 拒绝
        if (GROUP_NOTICE_TAGS.has(tag) && event.ChannelId) {
          return await GROUP_AT_MESSAGE_CREATE(client, { ChannelId: event.ChannelId }, val, options);
        }
        if (C2C_NOTICE_TAGS.has(tag) && event.UserId) {
          return await C2C_MESSAGE_CREATE(client, { UserId: event.UserId }, val, options);
        }

        // 未覆盖的 tag 显式失败，调用方通过 code 感知，而非静默空数组
        return [createResult(ResultCode.Fail, `message.send: unsupported event tag "${tag}"`, null)];
      },
      mention: event => {
        const value = event.value || {};
        const Metions: User[] = [];

        if (value.mentions) {
          const mentions = (event.value['mentions'] || []) as NonNullable<AT_MESSAGE_CREATE_TYPE['mentions'] | GROUP_MESSAGE_CREATE_TYPE['mentions']>;
          const MessageMention: User[] = mentions.map(item => {
            const UserId = item.id;
            const [isMaster, UserKey] = getMaster(UserId);

            return {
              UserId: item.id,
              IsMaster: isMaster,
              UserName: item.username,
              IsBot: item.bot ?? false,
              UserKey: UserKey
            };
          });

          return new Promise<User[]>(resolve => resolve(MessageMention));
        } else {
          return new Promise<User[]>(resolve => resolve(Metions));
        }
      }
    }
  };

  const onactions = async (data, consume) => {
    // 来源事件上下文：调用方透传 payload.event（与 message.send 一致）后，
    // 未显式传 ChannelId/UserId/GuildId 时自动从事件推断，减少参数提交
    const event = data.payload.event ?? {};
    // 群 openid 取值：事件转发时 group_openid 落在 ChannelId
    const getGroupOpenId = () => data.payload.ChannelId ?? data.payload.params?.groupOpenId ?? data.payload.GuildId ?? event.ChannelId ?? event.GuildId ?? '';
    // 群成员 openid 取值
    const getMemberOpenId = () => data.payload.params?.memberOpenId ?? data.payload.UserId ?? event.UserId ?? '';
    // 频道/用户 id 兜底：未显式传参时从来源事件推断
    const getGuildId = () => data.payload.GuildId ?? event.GuildId ?? '';
    const getUserId = () => data.payload.UserId ?? event.UserId ?? '';
    const getChannelId = () => data.payload.ChannelId ?? event.ChannelId ?? '';

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
        const options =
          data.payload.params?.forceVerifyImageResource !== undefined ? { forceVerifyImageResource: data.payload.params.forceVerifyImageResource } : undefined;
        // 消费
        const res = await api.use.send(event, paramFormat, options);

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
      } else if (data.action === 'message.send.target') {
        const target = normalizeTarget(data.payload.target);

        if (!target) {
          consume([createResult(ResultCode.FailParams, 'message.send.target 缺少 target', null)]);

          return;
        }
        const res = await api.active.send.target(target, data.payload.params?.format || [], data.payload.params?.replyId);

        consume(res);
      } else if (data.action === 'message.delete') {
        // ─── 消息管理 ───
        const messageId = data.payload.MessageId;
        const params = data.payload.params ?? {};
        const target = normalizeTarget(data.payload.target);

        if (target && !validateTargetBot(target)) {
          consume([createResult(ResultCode.FailParams, `BotId ${target.BotId} is not active`, null)]);

          return;
        }
        const scope = target?.scope ?? params.scope ?? params.messageType;
        const request =
          scope === 'group'
            ? client.grouMessageDelte(String(target?.targetId ?? params.groupId ?? data.payload.GroupId ?? data.payload.ChannelId), messageId)
            : scope === 'user' || scope === 'c2c'
            ? client.userMessageDelete(String(target?.targetId ?? params.userId ?? data.payload.UserId), messageId)
            : scope === 'direct'
            ? client.dmsMessageDelete(String(target?.targetId ?? params.guildId ?? data.payload.GuildId ?? data.payload.ChannelId), messageId)
            : client.channelsMessagesDelete(target?.targetId ?? data.payload.ChannelId, messageId);
        const res = await request.then(r => createResult(ResultCode.Ok, data.action, r)).catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'interaction.ack') {
        const params = data.payload.params ?? {};
        const interactionId = String(params.interactionId ?? data.payload.InteractionId ?? '');
        const mode = data.payload.target?.scope === 'channel' || data.payload.target?.scope === 'direct' || params.mode === 'guild' ? 'guild' : 'group';

        if (!interactionId) {
          consume([createResult(ResultCode.Fail, 'interaction.ack 缺少 InteractionId', null)]);

          return;
        }
        const res = await client
          .interactionResponse(mode, interactionId, params.code)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);

        consume([res]);
      } else if (data.action === 'message.pin') {
        const res = await client
          .channelsPinsPut(getChannelId(), data.payload.MessageId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'message.unpin') {
        const res = await client
          .channelsPinsDelete(getChannelId(), data.payload.MessageId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'reaction.add') {
        // ─── 表情回应 ───
        // QQ Bot表情表态 type: 1=emoji, 2=emoji_id
        const res = await client
          .channelsMessagesReactionsPut(getChannelId(), data.payload.MessageId, 1, data.payload.EmojiId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'reaction.remove') {
        const res = await client
          .channelsMessagesReactionsDelete(getChannelId(), data.payload.MessageId, 1, data.payload.EmojiId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'message.get') {
        // ─── 消息获取 ───
        const res = await client
          .channelsMessagesById(getChannelId(), data.payload.MessageId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'interaction.response') {
        // ─── 互动回应 ───
        const interactionId = data.payload.interaction_id;
        const code = data.payload.code ?? 0;
        const res = await client
          .interactionResponse('group', interactionId, code)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err?.response?.data ?? err?.message ?? err));

        consume([res]);
      } else if (data.action === 'member.info') {
        // ─── 成员管理 ───
        const guildId = data.payload.params?.guildId ?? getGuildId();
        const userId = data.payload.params?.userId ?? getUserId();
        const res = await client
          .guildsMembersMessage(guildId, userId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.list') {
        const guildId = getGuildId();
        const after = data.payload.params?.After ?? '0';
        const limit = data.payload.params?.Limit ?? 100;
        const res = await client
          .guildsMembers(guildId, { after, limit })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.kick') {
        const res = await client
          .guildsMembersDelete(getGuildId(), getUserId())
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.ban') {
        // QQ频道使用禁言作为ban
        const guildId = getGuildId();
        const userId = getUserId();
        const duration = data.payload.params?.duration ?? 0;
        const mute_seconds = String(duration > 0 ? duration : 604800);
        const res = await client
          .guildsMemberMute(guildId, userId, { mute_seconds })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.unban') {
        const res = await client
          .guildsMemberMute(getGuildId(), getUserId(), { mute_seconds: '0' })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.mute') {
        // ─── 成员禁言 ───
        const guildId = getGuildId();
        const userId = getUserId();
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
          .guilds(getGuildId())
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
        const guildId = getGuildId();
        const duration = data.payload.params?.duration ?? 0;
        const mute_seconds = String(duration);
        const res = await client
          .guildsMuteAll(guildId, { mute_seconds })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'group.info') {
        // ─── 群管理 ───
        const res = await client
          .groupsInfo(getGroupOpenId())
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'group.botState') {
        const res = await client
          .groupsBotState(getGroupOpenId())
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'group.member.info') {
        const res = await client
          .groupsMembersMessage(getGroupOpenId(), getMemberOpenId())
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'group.joinRequest.list') {
        const params = data.payload.params ?? {};
        const res = await client
          .groupsJoinRequestList(getGroupOpenId(), { cursor: params.cursor, limit: params.limit })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'group.joinRequest.approve') {
        const params = data.payload.params ?? {};
        const res = await client
          .groupsApprovalJoinRequest(getGroupOpenId(), getMemberOpenId(), {
            op: params.op,
            join_request_id: params.joinRequestId,
            reject_reason: params.rejectReason,
            add_to_member_blacklist: params.addToMemberBlacklist
          })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'group.mute.setting') {
        const res = await client
          .groupsRestrictChatSetting(getGroupOpenId())
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'group.mute.set') {
        const res = await client
          .groupsRestrictChatSettingPost(getGroupOpenId(), { members: data.payload.params?.members })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'group.strategy.list') {
        // ─── 入群自动审批策略 ───
        const params = data.payload.params ?? {};
        const res = await client
          .groupsJoinApprovalStrategies({ cursor: params.cursor, limit: params.limit })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'group.strategy.create') {
        const params = data.payload.params ?? {};
        const res = await client
          .groupsJoinApprovalStrategyCreate({
            group_openids: params.groupOpenIds,
            group_ids: params.groupIds,
            is_enable: params.isEnable,
            expire_at: params.expireAt,
            remark: params.remark
          })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'group.strategy.update') {
        const params = data.payload.params ?? {};
        const res = await client
          .groupsJoinApprovalStrategyPatch(data.payload.StrategyId, {
            is_enable: params.isEnable,
            expire_at: params.expireAt,
            group_action: params.groupAction,
            remark: params.remark
          })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'group.strategy.delete') {
        const res = await client
          .groupsJoinApprovalStrategyDelete(data.payload.StrategyId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'group.strategy.execute') {
        const res = await client
          .groupsJoinApprovalStrategyExecute(data.payload.StrategyId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'group.strategy.whitelist') {
        const params = data.payload.params ?? {};
        const res = await client
          .groupsJoinApprovalStrategyWhitelistUsers(data.payload.StrategyId, { op: params.op, whitelist_users: params.whitelistUsers })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.info') {
        // ─── 频道管理 ───
        const res = await client
          .channels(getChannelId())
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.list') {
        const res = await client
          .guildsChannels(getGuildId())
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.create') {
        const guildId = getGuildId();
        const params = data.payload.params;
        const res = await client
          .guildsChannelsCreate(guildId, { name: params.name, type: params.type ? Number(params.type) : 0, position: 0, parent_id: params.parentId ?? '' })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.update') {
        const channelId = getChannelId();
        const params = data.payload.params;
        const res = await client
          .guildsChannelsUpdate(channelId, { name: params.name ?? '', position: params.position ?? 0 })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.delete') {
        const res = await client
          .guildsChannelsdelete(getChannelId(), {})
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.list') {
        // ─── 角色管理 ───
        const res = await client
          .guildsRoles(getGuildId())
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.create') {
        const params = data.payload.params;
        const res = await client
          .guildsRolesPost(getGuildId(), { name: params.name, color: params.color })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.update') {
        const params = data.payload.params;
        const res = await client
          .guildsRolesPatch(getGuildId(), data.payload.RoleId, { name: params.name, color: params.color })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.delete') {
        const res = await client
          .guildsRolesDelete(getGuildId(), data.payload.RoleId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.assign') {
        // QQ Bot角色分配需要channel_id, 这里传空字符串使用默认
        const res = await client
          .guildsRolesMembersPut(getGuildId(), '', getUserId(), data.payload.RoleId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'role.remove') {
        const res = await client
          .guildsRolesMembersDelete(getGuildId(), '', getUserId(), data.payload.RoleId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'file.send.channel') {
        // ─── 文件发送 ───
        const res = await client
          .postRichMediaByGroup(getGroupOpenId(), {
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
          .postRichMediaByUser(getUserId(), {
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
        const userId = getUserId();
        const params = data.payload.params;
        const fileType = params?.type === 'image' ? 1 : params?.type === 'video' ? 2 : params?.type === 'audio' ? 3 : 4;
        const res = await client
          .postRichMediaByUser(userId, { file_type: fileType as any, url: params?.url, file_data: params?.data })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'media.upload') {
        const target = normalizeTarget(data.payload.target);

        if (!target) {
          consume([createResult(ResultCode.Warn, 'QQ media.upload requires target', null)]);

          return;
        }
        const res = await uploadMedia(target, data.payload.params || {})
          .then(value => createResult(ResultCode.Ok, data.action, value))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'media.send') {
        const target = normalizeTarget(data.payload.target);

        if (!target) {
          consume([createResult(ResultCode.FailParams, 'media.send 缺少 target', null)]);

          return;
        }
        if (!validateTargetBot(target)) {
          consume([createResult(ResultCode.FailParams, `BotId ${target.BotId} is not active`, null)]);

          return;
        }
        const params = data.payload.params || {};

        if (params.fileId) {
          const send =
            target.scope === 'group'
              ? client.groupOpenMessages(target.targetId, { msg_type: 7, content: params.content || '', media: { file_info: params.fileId } })
              : target.scope === 'c2c'
              ? client.usersOpenMessages(target.targetId, { msg_type: 7, content: params.content || '', media: { file_info: params.fileId } })
              : null;

          if (!send) {
            consume([createResult(ResultCode.Warn, 'QQ media.send only supports group and c2c targets', null)]);

            return;
          }
          const res = await send
            .then(value => createResult(ResultCode.Ok, data.action, { id: value.id }))
            .catch(err => createResult(ResultCode.Fail, data.action, err));

          consume([res]);

          return;
        }
        const upload = await uploadMedia(target, params)
          .then(value => value.fileId)
          .catch(error => {
            consume([createResult(ResultCode.Fail, data.action, error)]);

            return null;
          });

        if (!upload) {
          return;
        }
        await onactions(
          { action: 'media.send', payload: { target, params: { ...params, fileId: upload, url: undefined, data: undefined, filePath: undefined } } },
          consume
        );
      } else if (data.action === 'connection.status') {
        const status = client.getConnectionStatus();

        consume([
          createResult(ResultCode.Ok, data.action, {
            Platform: platform,
            state: status.state,
            bots: [{ BotId: botId, ...status }]
          })
        ]);
      } else if (data.action === 'media.upload.prepare') {
        // ─── 分片上传 ───
        const userId = getUserId();
        const groupId = getGroupOpenId();
        const res = await (userId ? client.usersUploadPrepare(userId, data.payload.params) : client.groupUploadPrepare(groupId, data.payload.params))
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err?.response?.data ?? err?.message ?? err));

        consume([res]);
      } else if (data.action === 'media.upload.part.finish') {
        const userId = getUserId();
        const groupId = getGroupOpenId();
        const res = await (userId ? client.usersUploadPartFinish(userId, data.payload.params) : client.groupUploadPartFinish(groupId, data.payload.params))
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err?.response?.data ?? err?.message ?? err));

        consume([res]);
      } else if (data.action === 'media.upload.chunked') {
        // 全流程编排：prepare → COS 直传 → finish → 合并
        const userId = getUserId();
        const groupId = getGroupOpenId();
        const params = data.payload.params ?? {};
        const res = await chunkedUpload(client, userId ? 'user' : 'group', userId || groupId, params.file ?? params.file_path, {
          file_type: params.file_type ?? 1,
          file_name: params.file_name,
          srv_send_msg: params.srv_send_msg
        })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err?.response?.data ?? err?.message ?? err));

        consume([res]);
      } else if (data.action === 'stream.message.send') {
        // ─── 流式消息（仅单聊）───
        const res = await client
          .streamMessages(getUserId(), data.payload.params ?? {})
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err?.response?.data ?? err?.message ?? err));

        consume([res]);
      } else if (data.action === 'message.input.notify') {
        // ─── 输入状态通知（msg_type=6，仅单聊）───
        const params = data.payload.params ?? {};
        const res = await client
          .usersOpenMessages(getUserId(), {
            msg_type: 6,
            input_notify: { input_type: params.input_type ?? 1, input_second: params.input_second ?? 60 },
            msg_seq: params.msg_seq,
            msg_id: params.msg_id
          })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err?.response?.data ?? err?.message ?? err));

        consume([res]);
      } else if (data.action === 'permission.get') {
        // ─── 权限 ───
        const res = await client
          .channelsPermissions(getChannelId(), getUserId())
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'permission.set') {
        const params = data.payload.params;
        const res = await client
          .channelsPermissionsPut(getChannelId(), getUserId(), params?.allow ?? '0', params?.deny ?? '0')
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'reaction.list') {
        // ─── 表情回应列表 ───
        const res = await client
          .channelsMessagesReactionsUsers(getChannelId(), data.payload.MessageId, 1, data.payload.EmojiId, { limit: data.payload.params?.limit ?? 20 })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'channel.announce') {
        // ─── 频道公告 ───
        const guildId = getGuildId();
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

  if (options?.bindActions !== false) {
    cbp.onactions((data, consume) => void onactions(data, consume));
    cbp.onapis((data, consume) => void onapis(data, consume));
  }

  return { onAction: onactions, onApi: onapis };
};

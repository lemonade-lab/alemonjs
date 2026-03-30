import {
  cbpPlatform,
  createResult,
  DataEnums,
  definePlatform,
  MessageMediaItem,
  PrivateEventMessageCreate,
  PublicEventMemberAdd,
  PublicEventMemberRemove,
  PublicEventMessageCreate,
  PublicEventMessageUpdate,
  PrivateEventMessageUpdate,
  PublicEventInteractionCreate,
  PrivateEventInteractionCreate,
  ResultCode
} from 'alemonjs';
import { getBufferByURL } from 'alemonjs/utils';
import TelegramClient from 'node-telegram-bot-api';
import { platform, getTGConfig, getMaster } from './config';
import { readFileSync } from 'fs';
import { dataEnumToText } from './format';
export { platform } from './config';
export { type Options } from './config';
export const API = TelegramClient;
export * from './hook';

const main = () => {
  const config = getTGConfig();
  const client = new TelegramClient(config.token, {
    polling: true,
    baseApiUrl: config?.base_api_url ?? '',
    request: {
      url: config?.request_url ?? '',
      proxy: config?.proxy ?? ''
    }
  });
  const url = `ws://127.0.0.1:${process.env?.port || 17117}`;
  const cbp = cbpPlatform(url);

  // 机器人Id（Telegram token 格式为 botId:hash）
  const botId = config.token ? config.token.split(':')[0] : '';

  /**
   *
   * @param UserId
   * @returns
   */
  const getUserProfilePhotosUrl = async (UserId: number): Promise<string> => {
    if (!UserId) {
      return '';
    }

    try {
      const profilePhotos = await client.getUserProfilePhotos(UserId);

      if (profilePhotos.total_count > 0) {
        const fileId = profilePhotos.photos[0][0].file_id;
        const file = await client.getFile(fileId);

        return `https://api.telegram.org/file/bot${config.token}/${file.file_path}`;
      }
    } catch {
      // 获取头像失败不应阻断事件处理
    }

    return '';
  };

  client.on('text', async event => {
    const UserId = String(event?.from?.id);
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = await getUserProfilePhotosUrl(event?.from?.id);

    if (event?.chat.type === 'channel' || event?.chat.type === 'supergroup') {
      // 机器人消息不处理
      if (event?.from?.is_bot) {
        return;
      }
      // 定义消息
      const e: PublicEventMessageCreate = {
        // 事件类型
        Platform: platform,
        name: 'message.create',
        // 频道
        GuildId: String(event?.chat.id),
        ChannelId: String(event?.chat.id),
        SpaceId: String(event?.chat.id),
        // user
        UserId: UserId,
        UserKey: UserKey,
        UserName: event?.from?.username,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        // message
        MessageId: String(event?.message_id),
        MessageText: event?.text,
        OpenId: String(event?.chat?.id),
        // other
        BotId: botId,
        _tag: 'txt',
        value: event
      };

      // 发送消息
      cbp.send(e);

      //
    } else if (event?.chat.type === 'private') {
      // 定义消
      const e: PrivateEventMessageCreate = {
        name: 'private.message.create',
        // 事件类型
        Platform: platform,
        // 用户Id
        UserId: String(event?.from.id),
        UserKey: UserKey,
        UserName: event?.from?.username,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        // message
        MessageId: String(event?.message_id),
        MessageText: event?.text,
        OpenId: String(event?.chat?.id),
        // other
        BotId: botId,
        _tag: 'txt',
        value: event
      };

      cbp.send(e);
    }
  });

  /**
   * 从 Telegram 消息中提取媒体信息
   */
  const extractMediaFromEvent = (event: any): MessageMediaItem[] => {
    const media: MessageMediaItem[] = [];

    if (event?.photo && event.photo.length > 0) {
      // 取最大分辨率的图片
      const photo = event.photo[event.photo.length - 1];

      media.push({
        Type: 'image',
        FileId: photo.file_id,
        FileSize: photo.file_size
      });
    }

    if (event?.audio) {
      media.push({
        Type: 'audio',
        FileId: event.audio.file_id,
        FileName: event.audio.file_name,
        FileSize: event.audio.file_size,
        MimeType: event.audio.mime_type
      });
    }

    if (event?.video) {
      media.push({
        Type: 'video',
        FileId: event.video.file_id,
        FileName: event.video.file_name,
        FileSize: event.video.file_size,
        MimeType: event.video.mime_type
      });
    }

    if (event?.document) {
      media.push({
        Type: 'file',
        FileId: event.document.file_id,
        FileName: event.document.file_name,
        FileSize: event.document.file_size,
        MimeType: event.document.mime_type
      });
    }

    if (event?.sticker) {
      media.push({
        Type: 'sticker',
        FileId: event.sticker.file_id,
        FileSize: event.sticker.file_size
      });
    }

    if (event?.voice) {
      media.push({
        Type: 'audio',
        FileId: event.voice.file_id,
        FileSize: event.voice.file_size,
        MimeType: event.voice.mime_type
      });
    }

    if (event?.animation) {
      media.push({
        Type: 'animation',
        FileId: event.animation.file_id,
        FileName: event.animation.file_name,
        FileSize: event.animation.file_size,
        MimeType: event.animation.mime_type
      });
    }

    return media;
  };

  /**
   * 通用媒体消息处理
   */
  const handleMediaMessage = async (event: any) => {
    if (!event?.from) {
      return;
    }

    const UserId = String(event?.from?.id);
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = await getUserProfilePhotosUrl(event?.from?.id);
    const MessageMedia = extractMediaFromEvent(event);
    const caption = event?.caption ?? '';

    if (event?.chat.type === 'channel' || event?.chat.type === 'supergroup' || event?.chat.type === 'group') {
      const e: PublicEventMessageCreate = {
        Platform: platform,
        name: 'message.create',
        GuildId: String(event?.chat.id),
        ChannelId: String(event?.chat.id),
        SpaceId: String(event?.chat.id),
        UserId: UserId,
        UserKey: UserKey,
        UserName: event?.from?.username,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        MessageId: String(event?.message_id),
        MessageText: caption,
        MessageMedia: MessageMedia,
        OpenId: String(event?.chat?.id),
        BotId: botId,
        _tag: 'media',
        value: event
      };

      cbp.send(e);
    } else if (event?.chat.type === 'private') {
      const e: PrivateEventMessageCreate = {
        name: 'private.message.create',
        Platform: platform,
        UserId: UserId,
        UserKey: UserKey,
        UserName: event?.from?.username,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        MessageId: String(event?.message_id),
        MessageText: caption,
        MessageMedia: MessageMedia,
        OpenId: String(event?.chat?.id),
        BotId: botId,
        _tag: 'media',
        value: event
      };

      cbp.send(e);
    }
  };

  // 图片消息
  client.on('photo', event => void handleMediaMessage(event));

  // 音频消息
  client.on('audio', event => void handleMediaMessage(event));

  // 视频消息
  client.on('video', event => void handleMediaMessage(event));

  // 文件消息
  client.on('document', event => void handleMediaMessage(event));

  // 贴纸消息
  client.on('sticker', event => void handleMediaMessage(event));

  // 语音消息
  client.on('voice', event => void handleMediaMessage(event));

  // 动画消息(GIF)
  client.on('animation', event => void handleMediaMessage(event));

  client.on('new_chat_members', async event => {
    // 机器人消息不处理
    if (event?.from.is_bot) {
      return;
    }

    const UserId = String(event?.from?.id);
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = await getUserProfilePhotosUrl(event?.from?.id);

    // 定义消
    const e: PublicEventMemberAdd = {
      name: 'member.add',
      // 事件类型
      Platform: platform,
      // guild
      GuildId: String(event?.chat.id),
      ChannelId: String(event?.chat.id),
      SpaceId: String(event?.chat.id),
      // user
      UserId: UserId,
      UserKey: UserKey,
      UserName: event?.from?.username,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      MessageId: String(event?.message_id),
      // othder
      BotId: botId,
      _tag: 'txt',
      value: event
    };

    cbp.send(e);
  });

  // 消息编辑
  client.on('edited_message', async event => {
    if (!event?.from) {
      return;
    }

    const UserId = String(event?.from?.id);
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = await getUserProfilePhotosUrl(event?.from?.id);

    if (event?.chat.type === 'channel' || event?.chat.type === 'supergroup') {
      const e: PublicEventMessageUpdate = {
        name: 'message.update',
        Platform: platform,
        GuildId: String(event?.chat.id),
        ChannelId: String(event?.chat.id),
        SpaceId: String(event?.chat.id),
        UserId: UserId,
        UserKey: UserKey,
        UserName: event?.from?.username,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        MessageId: String(event?.message_id),
        BotId: botId,
        _tag: 'edited_message',
        value: event
      };

      cbp.send(e);
    } else if (event?.chat.type === 'private') {
      const e: PrivateEventMessageUpdate = {
        name: 'private.message.update',
        Platform: platform,
        UserId: UserId,
        UserKey: UserKey,
        UserName: event?.from?.username,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        MessageId: String(event?.message_id),
        BotId: botId,
        _tag: 'edited_message',
        value: event
      };

      cbp.send(e);
    }
  });

  // 成员离开
  client.on('left_chat_member', async event => {
    if (!event?.from) {
      return;
    }

    const UserId = String(event?.from?.id);
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = await getUserProfilePhotosUrl(event?.from?.id);

    const e: PublicEventMemberRemove = {
      name: 'member.remove',
      Platform: platform,
      GuildId: String(event?.chat.id),
      ChannelId: String(event?.chat.id),
      SpaceId: String(event?.chat.id),
      UserId: UserId,
      UserKey: UserKey,
      UserName: event?.from?.username,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      MessageId: String(event?.message_id),
      BotId: botId,
      _tag: 'left_chat_member',
      value: event
    };

    cbp.send(e);
  });

  // 按钮交互回调
  client.on('callback_query', async event => {
    if (!event?.from) {
      return;
    }

    const UserId = String(event?.from?.id);
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = await getUserProfilePhotosUrl(event?.from?.id);
    const MessageText = event?.data ?? '';
    const chatType = event?.message?.chat?.type;

    if (chatType === 'channel' || chatType === 'supergroup') {
      const e: PublicEventInteractionCreate = {
        name: 'interaction.create',
        Platform: platform,
        GuildId: String(event?.message?.chat?.id ?? ''),
        ChannelId: String(event?.message?.chat?.id ?? ''),
        SpaceId: String(event?.message?.chat?.id ?? ''),
        UserId: UserId,
        UserKey: UserKey,
        UserName: event?.from?.username,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        MessageId: String(event?.message?.message_id ?? event?.id ?? ''),
        MessageText: MessageText,
        OpenId: String(event?.message?.chat?.id ?? ''),
        BotId: botId,
        _tag: 'callback_query',
        value: event
      };

      cbp.send(e);

      // 回应交互
      try {
        await client.answerCallbackQuery(event.id);
      } catch {
        // ignore
      }
    } else {
      const e: PrivateEventInteractionCreate = {
        name: 'private.interaction.create',
        Platform: platform,
        UserId: UserId,
        UserKey: UserKey,
        UserName: event?.from?.username,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        MessageId: String(event?.message?.message_id ?? event?.id ?? ''),
        MessageText: MessageText,
        OpenId: String(event?.message?.chat?.id ?? ''),
        BotId: botId,
        _tag: 'callback_query',
        value: event
      };

      cbp.send(e);

      try {
        await client.answerCallbackQuery(event.id);
      } catch {
        // ignore
      }
    }
  });

  const api = {
    use: {
      send: async (event, val: DataEnums[]) => {
        if (!val || val.length <= 0) {
          return [];
        }
        // 原生支持的文本类型
        const nativeText = val
          .filter(item => item.type === 'Link' || item.type === 'Mention' || item.type === 'Text')
          .map(item => {
            if (item.type === 'Link') {
              const url = (item as any).options?.link ?? item.value;

              return `${item.value}( ${url} )`;
            }
            if (item.type === 'Mention') {
              if (item.value === 'everyone' || item.value === 'all' || item.value === '' || typeof item.value !== 'string') {
                return '@全体成员';
              }

              return `@${item.value}`;
            }

            return item.value;
          })
          .join('');
        // 降级处理：将 Markdown、Ark、Button 等不支持的类型转为文本
        const unsupportedItems = val.filter(
          item =>
            item.type !== 'Link' &&
            item.type !== 'Mention' &&
            item.type !== 'Text' &&
            item.type !== 'Image' &&
            item.type !== 'ImageFile' &&
            item.type !== 'ImageURL'
        );
        const hide = getTGConfig().hideUnsupported;
        const fallbackText = unsupportedItems
          .map(item => dataEnumToText(item, hide))
          .filter(Boolean)
          .join('');
        const content = [nativeText, fallbackText]
          .filter(Boolean)
          .join('')
          .replace(/^[^\S\n\r]+|[^\S\n\r]+$/g, '');
        const e = event?.value;

        // hideUnsupported 模式：检查转换后内容是否为空
        const images = val.filter(item => item.type === 'Image' || item.type === 'ImageFile' || item.type === 'ImageURL');

        if (hide && !content && images.length <= 0) {
          logger.info('[telegram] hideUnsupported: 消息内容转换后为空，跳过发送');

          return [];
        }

        try {
          if (images.length > 0) {
            let data = null;

            for (let i = 0; i < images.length; i++) {
              if (data) {
                break;
              }
              const item = images[i];

              if (item.type === 'Image') {
                if (Buffer.isBuffer(item.value)) {
                  data = item.value;
                } else if (typeof item.value === 'string') {
                  if (item.value.startsWith('http://') || item.value.startsWith('https://')) {
                    data = await getBufferByURL(item.value);
                  } else if (item.value.startsWith('base64://')) {
                    data = Buffer.from(item.value.slice(9), 'base64');
                  } else if (item.value.startsWith('file://')) {
                    data = readFileSync(item.value.slice(7));
                  } else {
                    data = Buffer.from(item.value, 'base64');
                  }
                }
              } else if (item.type === 'ImageFile') {
                data = readFileSync(item.value);
              } else if (item.type === 'ImageURL') {
                data = await getBufferByURL(item.value);
              }
            }
            if (data) {
              const res = await client.sendPhoto(e.chat.id, data, content ? { caption: content } : undefined);

              return [createResult(ResultCode.Ok, 'message.send', res)];
            }
          }

          if (content) {
            const res = await client.sendMessage(e.chat.id, content);

            return [createResult(ResultCode.Ok, 'message.send', res)];
          }
        } catch (err) {
          return [createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)];
        }

        return [];
      },
      mention: () => {
        return new Promise(resolve => {
          resolve([]);
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
        // Telegram中channel就是chat_id
        const chatId = data.payload.ChannelId;
        const format = data.payload.params?.format ?? [];
        const content = format.map(i => i.value).join('');

        if (!content) {
          consume([createResult(ResultCode.Fail, '消息内容为空', null)]);

          return;
        }
        const res = await client
          .sendMessage(chatId, content)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'message.send.user') {
        const userId = data.payload.UserId;
        const format = data.payload.params?.format ?? [];
        const content = format.map(i => i.value).join('');

        if (!content) {
          consume([createResult(ResultCode.Fail, '消息内容为空', null)]);

          return;
        }
        const res = await client
          .sendMessage(userId, content)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'mention.get') {
        const res = await api.use.mention();

        consume([createResult(ResultCode.Ok, '请求完成', res)]);
      } else if (data.action === 'me.info') {
        // ─── me ───
        const res = await client
          .getMe()
          .then(r =>
            createResult(ResultCode.Ok, data.action, {
              UserId: String(r?.id),
              UserName: r?.username ?? r?.first_name,
              UserAvatar: '',
              IsBot: true,
              IsMaster: false,
              UserKey: ''
            })
          )
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'message.delete') {
        // ─── 消息管理 ───
        // Telegram deleteMessage 需要 chat_id + message_id
        const chatId = data.payload.ChannelId ?? data.payload.event?.value?.chat?.id;
        const messageId = data.payload.MessageId;

        if (!chatId) {
          consume([createResult(ResultCode.Fail, 'message.delete 需要 ChannelId (chat_id)', null)]);

          return;
        }
        const res = await client
          .deleteMessage(chatId, messageId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'message.pin') {
        const chatId = data.payload.ChannelId;
        const messageId = data.payload.MessageId;
        const res = await client
          .pinChatMessage(chatId, messageId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'message.unpin') {
        const chatId = data.payload.ChannelId;
        const messageId = data.payload.MessageId;
        const res = await client
          .unpinChatMessage(chatId, { message_id: Number(messageId) })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.info') {
        // ─── 成员管理 ───
        const guildId = data.payload.params?.guildId ?? data.payload.GuildId;
        const userId = data.payload.params?.userId ?? data.payload.UserId;
        const res = await client
          .getChatMember(guildId, userId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.kick') {
        const res = await client
          .banChatMember(data.payload.GuildId, data.payload.UserId)
          .then(async r => {
            // Telegram kick = ban then unban
            await client.unbanChatMember(data.payload.GuildId, data.payload.UserId);

            return createResult(ResultCode.Ok, data.action, r);
          })
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.ban') {
        const res = await client
          .banChatMember(data.payload.GuildId, data.payload.UserId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.unban') {
        const res = await client
          .unbanChatMember(data.payload.GuildId, data.payload.UserId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.list') {
        // Telegram 只能获取管理员列表
        const res = await client
          .getChatAdministrators(data.payload.GuildId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.mute') {
        const chatId = data.payload.GuildId;
        const userId = data.payload.UserId;
        const duration = data.payload.params?.duration ?? 0;
        // duration > 0: 禁言（移除发送消息权限），= 0: 解除禁言
        const untilDate = duration > 0 ? Math.floor(Date.now() / 1000) + duration : 0;
        const canSend = duration <= 0;
        const res = await client
          .restrictChatMember(chatId, userId, {
            until_date: untilDate,
            permissions: {
              can_send_messages: canSend,
              can_send_audios: canSend,
              can_send_documents: canSend,
              can_send_photos: canSend,
              can_send_videos: canSend,
              can_send_video_notes: canSend,
              can_send_voice_notes: canSend,
              can_send_polls: canSend,
              can_send_other_messages: canSend,
              can_add_web_page_previews: canSend
            }
          })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.admin') {
        const chatId = data.payload.GuildId;
        const userId = data.payload.UserId;
        const enable = data.payload.params?.enable ?? true;
        const res = await client
          .promoteChatMember(chatId, userId, {
            can_manage_chat: enable,
            can_delete_messages: enable,
            can_manage_video_chats: enable,
            can_restrict_members: enable,
            can_promote_members: false,
            can_change_info: enable,
            can_invite_users: enable,
            can_pin_messages: enable
          })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'member.title') {
        const chatId = data.payload.GuildId;
        const userId = data.payload.UserId;
        const title = data.payload.params?.title ?? '';
        const res = await client
          .setChatAdministratorCustomTitle(chatId, userId, title)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'guild.info') {
        // ─── 服务器 ───
        const chatId = data.payload.GuildId;
        const res = await client
          .getChat(chatId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'message.edit') {
        // ─── 消息编辑 ───
        const format = data.payload.params?.format;
        const content = format?.map(i => i.value).join('') ?? '';
        const chatId = data.payload.ChannelId ?? data.payload.GuildId;
        const messageId = data.payload.MessageId;
        const res = await client
          .editMessageText(content, { chat_id: chatId, message_id: messageId })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'message.forward.channel') {
        // ─── 消息转发 ───
        const res = await client
          .forwardMessage(data.payload.ChannelId, data.payload.FromChannelId, data.payload.MessageId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'message.forward.user') {
        const res = await client
          .forwardMessage(data.payload.UserId, data.payload.FromChannelId, data.payload.MessageId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'guild.update') {
        // ─── 服务器管理 ───
        const params = data.payload.params;
        const chatId = data.payload.GuildId;
        const results = [];

        if (params?.name) {
          const r = await client.setChatTitle(chatId, params.name).catch(e => e);

          results.push(r);
        }
        if (params?.description) {
          const r = await client.setChatDescription(chatId, params.description).catch(e => e);

          results.push(r);
        }
        consume([createResult(ResultCode.Ok, data.action, results)]);
      } else if (data.action === 'guild.leave') {
        const res = await client
          .leaveChat(data.payload.GuildId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'guild.mute') {
        // Telegram 通过 setChatPermissions 实现全员禁言
        const chatId = data.payload.GuildId;
        const duration = data.payload.params?.duration ?? 0;
        const muted = duration > 0;
        const res = await client
          .setChatPermissions(chatId, {
            can_send_messages: !muted,
            can_send_audios: !muted,
            can_send_documents: !muted,
            can_send_photos: !muted,
            can_send_videos: !muted,
            can_send_video_notes: !muted,
            can_send_voice_notes: !muted,
            can_send_polls: !muted,
            can_send_other_messages: !muted,
            can_add_web_page_previews: !muted
          })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'reaction.add') {
        // ─── 表情回应 ───
        const chatId = data.payload.ChannelId;
        const messageId = data.payload.MessageId;
        const emoji = data.payload.EmojiId;
        // setMessageReaction 未在类型中定义，通过动态调用
        const res = await (client as any)
          .setMessageReaction(chatId, messageId, { reaction: [{ type: 'emoji', emoji }] })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'reaction.remove') {
        const chatId = data.payload.ChannelId;
        const messageId = data.payload.MessageId;
        const res = await (client as any)
          .setMessageReaction(chatId, messageId, { reaction: [] })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'user.info') {
        // ─── 用户信息 ───
        const res = await client
          .getChat(data.payload.UserId)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        consume([res]);
      } else if (data.action === 'media.send.channel') {
        // ─── 媒体发送到频道 ───
        const channelId = data.payload.ChannelId;
        const params = data.payload.params;
        const source = params?.url ?? params?.data ?? '';

        try {
          let res: any;

          if (params?.type === 'image') {
            res = await client.sendPhoto(channelId, source);
          } else if (params?.type === 'audio') {
            res = await client.sendAudio(channelId, source);
          } else if (params?.type === 'video') {
            res = await client.sendVideo(channelId, source);
          } else {
            res = await client.sendDocument(channelId, source);
          }
          consume([createResult(ResultCode.Ok, data.action, res)]);
        } catch (err) {
          consume([createResult(ResultCode.Fail, data.action, err)]);
        }
      } else if (data.action === 'media.send.user') {
        const userId = data.payload.UserId;
        const params = data.payload.params;
        const source = params?.url ?? params?.data ?? '';

        try {
          let res: any;

          if (params?.type === 'image') {
            res = await client.sendPhoto(userId, source);
          } else if (params?.type === 'audio') {
            res = await client.sendAudio(userId, source);
          } else if (params?.type === 'video') {
            res = await client.sendVideo(userId, source);
          } else {
            res = await client.sendDocument(userId, source);
          }
          consume([createResult(ResultCode.Ok, data.action, res)]);
        } catch (err) {
          consume([createResult(ResultCode.Fail, data.action, err)]);
        }
      } else if (data.action === 'permission.set') {
        // ─── 权限 ───
        const chatId = data.payload.ChannelId;
        const userId = data.payload.UserId;

        try {
          const res = await client.restrictChatMember(chatId, userId, {
            permissions: {
              can_send_messages: data.payload.params?.allow ? true : false,
              can_send_audios: data.payload.params?.allow ? true : false,
              can_send_documents: data.payload.params?.allow ? true : false,
              can_send_photos: data.payload.params?.allow ? true : false,
              can_send_videos: data.payload.params?.allow ? true : false,
              can_send_video_notes: data.payload.params?.allow ? true : false,
              can_send_voice_notes: data.payload.params?.allow ? true : false,
              can_send_other_messages: data.payload.params?.allow ? true : false
            }
          });

          consume([createResult(ResultCode.Ok, data.action, res)]);
        } catch (err) {
          consume([createResult(ResultCode.Fail, data.action, err)]);
        }
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

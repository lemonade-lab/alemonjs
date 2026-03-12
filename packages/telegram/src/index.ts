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
        const content = [nativeText, fallbackText].filter(Boolean).join('');
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
        consume([createResult(ResultCode.Fail, '暂未支持，请尝试升级版本', null)]);
      } else if (data.action === 'message.send.user') {
        consume([createResult(ResultCode.Fail, '暂未支持，请尝试升级版本', null)]);
      } else if (data.action === 'mention.get') {
        consume([createResult(ResultCode.Fail, '暂未支持，请尝试升级版本', null)]);
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

import {
  cbpPlatform,
  createResult,
  DataEnums,
  definePlatform,
  PrivateEventMessageCreate,
  PublicEventMemberAdd,
  PublicEventMessageCreate,
  ResultCode
} from 'alemonjs';
import { getBufferByURL } from 'alemonjs/utils';
import TelegramClient from 'node-telegram-bot-api';
import { platform, getTGConfig, getMaster } from './config';
import { readFileSync } from 'fs';
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
        CreateAt: Date.now(),
        // other
        tag: 'txt',
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
        CreateAt: Date.now(),
        // other
        tag: 'txt',
        value: event
      };

      cbp.send(e);
    }
  });

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
      CreateAt: Date.now(),
      // othder
      tag: 'txt',
      value: event
    };

    cbp.send(e);
  });

  const api = {
    use: {
      send: async (event, val: DataEnums[]) => {
        if (!val || val.length <= 0) {
          return [];
        }
        const content = val
          .filter(item => item.type === 'Link' || item.type === 'Mention' || item.type === 'Text')
          .map(item => item.value)
          .join('');
        const e = event?.value;

        try {
          const images = val.filter(item => item.type === 'Image' || item.type === 'ImageFile' || item.type === 'ImageURL');

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

import { cbpPlatform, createResult, DataEnums, PrivateEventMessageCreate, PublicEventMemberAdd, PublicEventMessageCreate, ResultCode } from 'alemonjs';
import { getBufferByURL } from 'alemonjs/utils';
import TelegramClient from 'node-telegram-bot-api';
import { platform, getTGConfig, getMaster } from './config';
import { readFileSync } from 'fs';
export { platform } from './config';
export { type Options } from './config';
export const API = TelegramClient;
export * from './hook';
export default () => {
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
  const getUserProfilePhotosUrl = (UserId: number) => {
    return new Promise((resolve, reject) => {
      if (!UserId) {
        reject(new Error('UserId 不能为空'));

        return;
      }
      client
        .getUserProfilePhotos(UserId)
        .then(profilePhotos => {
          if (profilePhotos.total_count > 0) {
            // 获取第一张头像的文件 Id
            const fileId = profilePhotos.photos[0][0].file_id;

            // 获取文件信息以获取下载链接
            client
              .getFile(fileId)
              .then(file => {
                const filePath = file.file_path;

                resolve(`https://api.telegram.org/file/bot${config.token}/${filePath}`);
              })
              .catch(reject);
          } else {
            reject(new Error('用户没有头像'));
          }
        })
        .catch(reject);
    });
  };

  client.on('text', async event => {
    const UserId = String(event?.from?.id);
    const [isMaster, UserKey] = getMaster(UserId);
    const UserAvatar = (await getUserProfilePhotosUrl(event?.from?.id)) as string;

    if (event?.chat.type == 'channel' || event?.chat.type == 'supergroup') {
      // 机器人消息不处理
      if (event?.from?.is_bot) {
        return;
      }
      // 定义消
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
        UserName: event?.chat.username,
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
    } else if (event?.chat.type == 'private') {
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
    const UserAvatar = (await getUserProfilePhotosUrl(event?.from?.id)) as string;

    // 定义消
    const e: PublicEventMemberAdd = {
      naem: 'member.add',
      // 事件类型
      Platform: platform,
      // guild
      GuildId: String(event?.chat.id),
      ChannelId: String(event?.chat.id),
      SpaceId: String(event?.chat.id),
      // user
      UserId: UserId,
      UserKey: UserKey,
      UserName: event?.chat.username,
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
        if (val.length < 0) {
          return [];
        }
        const content = val
          .filter(item => item.type == 'Link' || item.type == 'Mention' || item.type == 'Text')
          .map(item => item.value)
          .join('');
        const e = event?.value;

        try {
          if (content) {
            const res = await client.sendMessage(e.chat.id, content);

            return [createResult(ResultCode.Ok, 'message.send', res)];
          }
          const images = val.filter(item => item.type == 'Image' || item.type == 'ImageFile' || item.type == 'ImageURL');

          if (images.length > 1) {
            let data = null;

            for (let i = 0; i < images.length; i++) {
              if (data) {
                break;
              }
              const item = images[i];

              if (item.type === 'Image') {
                data = item.value;
              } else if (item.type === 'ImageFile') {
                data = readFileSync(item.value);
              } else if (item.type === 'ImageURL') {
                data = await getBufferByURL(item.value);
              }
            }
            const res = await client.sendPhoto(e.chat.id, data);

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

  cbp.onactions(async (data, consume) => {
    if (data.action === 'message.send') {
      const event = data.payload.event;
      const paramFormat = data.payload.params.format;
      const res = await api.use.send(event, paramFormat);

      consume(res);
    } else if (data.action === 'message.send.channel') {
      consume([]);
    } else if (data.action === 'message.send.user') {
      consume([]);
    } else if (data.action === 'mention.get') {
      consume([]);
    }
  });

  cbp.onapis(async (data, consume) => {
    const key = data.payload?.key;

    if (client[key]) {
      const params = data.payload.params;
      const res = await client[key](...params);

      consume([createResult(ResultCode.Ok, '请求完成', res)]);
    }
  });
};

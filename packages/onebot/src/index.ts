import {
  cbpPlatform,
  createResult,
  DataEnums,
  definePlatform,
  MessageMediaItem,
  PrivateEventMessageCreate,
  PrivateEventMessageDelete,
  PrivateEventRequestFriendAdd,
  PrivateEventRequestGuildAdd,
  PublicEventMemberAdd,
  PublicEventMemberBan,
  PublicEventMemberRemove,
  PublicEventMemberUnban,
  PublicEventMemberUpdate,
  PublicEventMessageCreate,
  PublicEventMessageDelete,
  PublicEventNoticeCreate,
  ResultCode,
  User
} from 'alemonjs';
import { getBufferByURL } from 'alemonjs/utils';
import { readFileSync } from 'fs';
import { platform, getOneBotConfig, getMaster } from './config';
import { OneBotClient } from './sdk/wss';
import { BotMe } from './db';
import { dataEnumToText, markdownToText } from './format';
export { platform } from './config';
export { OneBotAPI as API } from './sdk/api';
export * from './hook';

const main = () => {
  const config = getOneBotConfig();
  const client = new OneBotClient({
    // url
    url: config?.url ?? '',
    // token
    access_token: config?.token ?? '',
    // 是否开启反向连接，正向连接失效
    reverse_enable: config?.reverse_enable ?? false,
    // 反向连接端口
    reverse_port: config?.reverse_port ?? 17158
  });

  void client.connect();

  const url = `ws://127.0.0.1:${process.env?.port || 17117}`;
  const cbp = cbpPlatform(url);

  const createUserAvatar = (id: string) => {
    return `https://q1.qlogo.cn/g?b=qq&s=0&nk=${id}`;
  };

  const getMessageText = (message: any[]) => {
    let msg = '';

    for (const item of message) {
      if (item.type === 'text') {
        msg += item.data.text;
      } else if (item.type === 'at') {
        //
      }
    }

    return msg.trim();
  };

  /**
   * 从 OneBot 消息段中提取媒体信息
   */
  const extractMediaFromMessage = (message: any[]): MessageMediaItem[] => {
    const media: MessageMediaItem[] = [];

    for (const item of message) {
      if (item.type === 'image') {
        media.push({
          Type: 'image',
          Url: item.data?.url,
          FileId: item.data?.file_id,
          FileName: item.data?.file,
          FileSize: item.data?.file_size ? Number(item.data.file_size) : undefined
        });
      } else if (item.type === 'record') {
        media.push({
          Type: 'audio',
          Url: item.data?.url,
          FileId: item.data?.file_id,
          FileName: item.data?.file,
          FileSize: item.data?.file_size ? Number(item.data.file_size) : undefined
        });
      } else if (item.type === 'video') {
        media.push({
          Type: 'video',
          Url: item.data?.url,
          FileId: item.data?.file_id,
          FileName: item.data?.file,
          FileSize: item.data?.file_size ? Number(item.data.file_size) : undefined
        });
      } else if (item.type === 'file') {
        media.push({
          Type: 'file',
          Url: item.data?.url,
          FileId: item.data?.file_id,
          FileName: item.data?.file_name || item.data?.file,
          FileSize: item.data?.file_size ? Number(item.data.file_size) : undefined
        });
      }
    }

    return media;
  };

  // 元组
  client.on('META', event => {
    if (event?.self_id) {
      BotMe.id = String(event.self_id);
    }
  });

  // 消息
  client.on('MESSAGES', event => {
    const msg = getMessageText(event.message);
    const UserId = String(event.user_id);
    const UserAvatar = createUserAvatar(UserId);

    const [isMaster, UserKey] = getMaster(UserId);

    const groupId = String(event.group_id);

    const ReplyId = event.message.find(item => item.type === 'reply')?.data?.id;

    const MessageMedia = extractMediaFromMessage(event.message);

    // 定义消
    const e: PublicEventMessageCreate = {
      name: 'message.create',
      Platform: platform,
      GuildId: groupId,
      ChannelId: groupId,
      IsMaster: isMaster,
      SpaceId: groupId,
      IsBot: false,
      UserId: UserId,
      UserName: event.sender.nickname,
      UserKey,
      UserAvatar: UserAvatar,
      MessageId: String(event.message_id),
      MessageText: msg.trim(),
      MessageMedia,
      OpenId: UserId,
      ReplyId,
      replyId: ReplyId,
      BotId: BotMe.id,
      _tag: 'message.create',
      value: event
    };

    cbp.send(e);
  });

  // 私聊消息
  client.on('DIRECT_MESSAGE', event => {
    const msg = getMessageText(event.message);
    const UserId = String(event.user_id);
    const UserAvatar = createUserAvatar(UserId);

    const [isMaster, UserKey] = getMaster(UserId);

    const ReplyId = event.message.find(item => item.type === 'reply')?.data?.id;

    const MessageMedia = extractMediaFromMessage(event.message);

    // 定义消
    const e: PrivateEventMessageCreate = {
      name: 'private.message.create',
      Platform: platform,
      IsMaster: isMaster,
      IsBot: false,
      UserId: UserId,
      UserName: event.sender.nickname,
      UserKey,
      UserAvatar: UserAvatar,
      MessageId: String(event.message_id),
      MessageText: msg.trim(),
      MessageMedia,
      OpenId: String(event.user_id),
      ReplyId,
      replyId: ReplyId,
      BotId: BotMe.id,
      _tag: 'private.message.create',
      value: event
    };

    cbp.send(e);
  });

  // 群成员增加
  client.on('NOTICE_GROUP_MEMBER_INCREASE', event => {
    const UserId = String(event.user_id);
    const UserAvatar = createUserAvatar(UserId);
    const [isMaster, UserKey] = getMaster(UserId);
    const groupId = String(event.group_id);

    const e: PublicEventMemberAdd = {
      name: 'member.add',
      Platform: platform,
      GuildId: groupId,
      ChannelId: groupId,
      SpaceId: groupId,
      UserId: UserId,
      UserKey,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      MessageId: '',
      BotId: BotMe.id,
      _tag: 'NOTICE_GROUP_MEMBER_INCREASE',
      value: event
    };

    cbp.send(e);
  });

  // 群成员减少
  client.on('NOTICE_GROUP_MEMBER_REDUCE', event => {
    const UserId = String(event.user_id);
    const UserAvatar = createUserAvatar(UserId);
    const [isMaster, UserKey] = getMaster(UserId);
    const groupId = String(event.group_id);

    const e: PublicEventMemberRemove = {
      name: 'member.remove',
      Platform: platform,
      GuildId: groupId,
      ChannelId: groupId,
      SpaceId: groupId,
      UserId: UserId,
      UserKey,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      MessageId: '',
      BotId: BotMe.id,
      _tag: 'NOTICE_GROUP_MEMBER_REDUCE',
      value: event
    };

    cbp.send(e);
  });

  // 好友添加请求
  client.on('REQUEST_ADD_FRIEND', event => {
    const UserId = String(event.user_id);
    const UserAvatar = createUserAvatar(UserId);
    const [isMaster, UserKey] = getMaster(UserId);

    const e: PrivateEventRequestFriendAdd = {
      name: 'private.friend.add',
      Platform: platform,
      UserId: UserId,
      UserKey,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      MessageId: String(event.flag ?? ''),
      BotId: BotMe.id,
      _tag: 'REQUEST_ADD_FRIEND',
      value: event
    };

    cbp.send(e);
  });

  // 入群请求
  client.on('REQUEST_ADD_GROUP', event => {
    const UserId = String(event.user_id);
    const UserAvatar = createUserAvatar(UserId);
    const [isMaster, UserKey] = getMaster(UserId);

    const e: PrivateEventRequestGuildAdd = {
      name: 'private.guild.add',
      Platform: platform,
      UserId: UserId,
      UserKey,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      MessageId: String(event.flag ?? ''),
      BotId: BotMe.id,
      _tag: 'REQUEST_ADD_GROUP',
      value: event
    };

    cbp.send(e);
  });

  // 群消息撤回
  client.on('NOTICE_GROUP_RECALL', event => {
    const groupId = String(event.group_id);

    const e: PublicEventMessageDelete = {
      name: 'message.delete',
      Platform: platform,
      GuildId: groupId,
      ChannelId: groupId,
      SpaceId: groupId,
      MessageId: String(event.message_id ?? ''),
      BotId: BotMe.id,
      _tag: 'NOTICE_GROUP_RECALL',
      value: event
    };

    cbp.send(e);
  });

  // 好友消息撤回
  client.on('NOTICE_FRIEND_RECALL', event => {
    const e: PrivateEventMessageDelete = {
      name: 'private.message.delete',
      Platform: platform,
      MessageId: String(event.message_id ?? ''),
      BotId: BotMe.id,
      _tag: 'NOTICE_FRIEND_RECALL',
      value: event
    };

    cbp.send(e);
  });

  // 群禁言
  client.on('NOTICE_GROUP_BAN', event => {
    const UserId = String(event.user_id);
    const UserAvatar = createUserAvatar(UserId);
    const [isMaster, UserKey] = getMaster(UserId);
    const groupId = String(event.group_id);

    if (event.sub_type === 'ban') {
      const e: PublicEventMemberBan = {
        name: 'member.ban',
        Platform: platform,
        GuildId: groupId,
        ChannelId: groupId,
        SpaceId: groupId,
        UserId: UserId,
        UserKey,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        MessageId: '',
        BotId: BotMe.id,
        _tag: 'NOTICE_GROUP_BAN',
        value: event
      };

      cbp.send(e);
    } else if (event.sub_type === 'lift_ban') {
      const e: PublicEventMemberUnban = {
        name: 'member.unban',
        Platform: platform,
        GuildId: groupId,
        ChannelId: groupId,
        SpaceId: groupId,
        UserId: UserId,
        UserKey,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        MessageId: '',
        BotId: BotMe.id,
        _tag: 'NOTICE_GROUP_BAN_LIFT',
        value: event
      };

      cbp.send(e);
    }
  });

  // 群文件上传 —— 映射为 message.create + MessageMedia
  client.on('NOTICE_GROUP_UPLOAD', event => {
    const UserId = String(event.user_id);
    const UserAvatar = createUserAvatar(UserId);
    const [isMaster, UserKey] = getMaster(UserId);
    const groupId = String(event.group_id);

    const e: PublicEventMessageCreate = {
      name: 'message.create',
      Platform: platform,
      GuildId: groupId,
      ChannelId: groupId,
      IsMaster: isMaster,
      SpaceId: groupId,
      IsBot: false,
      UserId: UserId,
      UserName: '',
      UserKey,
      UserAvatar: UserAvatar,
      MessageId: `upload_${event.user_id}_${event.time}`,
      MessageText: '',
      MessageMedia: [
        {
          Type: 'file',
          FileId: event.file?.id,
          FileName: event.file?.name,
          FileSize: event.file?.size,
          Url: event.file?.url
        }
      ],
      OpenId: UserId,
      BotId: BotMe.id,
      _tag: 'NOTICE_GROUP_UPLOAD',
      value: event
    };

    cbp.send(e);
  });

  // 离线文件接收 —— 映射为 private.message.create + MessageMedia
  client.on('NOTICE_OFFLINE_FILE', event => {
    const UserId = String(event.user_id);
    const UserAvatar = createUserAvatar(UserId);
    const [isMaster, UserKey] = getMaster(UserId);

    const e: PrivateEventMessageCreate = {
      name: 'private.message.create',
      Platform: platform,
      IsMaster: isMaster,
      IsBot: false,
      UserId: UserId,
      UserName: '',
      UserKey,
      UserAvatar: UserAvatar,
      MessageId: `offline_${event.user_id}_${event.time}`,
      MessageText: '',
      MessageMedia: [
        {
          Type: 'file',
          FileName: event.file?.name,
          FileSize: event.file?.size,
          Url: event.file?.url
        }
      ],
      OpenId: UserId,
      BotId: BotMe.id,
      _tag: 'NOTICE_OFFLINE_FILE',
      value: event
    };

    cbp.send(e);
  });

  // 群管理员变动
  client.on('NOTICE_GROUP_ADMIN', event => {
    const UserId = String(event.user_id);
    const UserAvatar = createUserAvatar(UserId);
    const [isMaster, UserKey] = getMaster(UserId);
    const groupId = String(event.group_id);

    const e: PublicEventMemberUpdate = {
      name: 'member.update',
      Platform: platform,
      GuildId: groupId,
      ChannelId: groupId,
      SpaceId: groupId,
      UserId: UserId,
      UserKey,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      MessageId: '',
      BotId: BotMe.id,
      _tag: `NOTICE_GROUP_ADMIN_${event.sub_type === 'set' ? 'SET' : 'UNSET'}`,
      value: event
    };

    cbp.send(e);
  });

  // 好友已添加通知
  client.on('NOTICE_FRIEND_ADD', event => {
    const UserId = String(event.user_id);
    const UserAvatar = createUserAvatar(UserId);
    const [isMaster, UserKey] = getMaster(UserId);

    const e: PrivateEventRequestFriendAdd = {
      name: 'private.friend.add',
      Platform: platform,
      UserId: UserId,
      UserKey,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      MessageId: '',
      BotId: BotMe.id,
      _tag: 'NOTICE_FRIEND_ADD',
      value: event
    };

    cbp.send(e);
  });

  // 戳一戳通知 —— 映射为 notice.create
  client.on('NOTICE_NOTIFY', event => {
    if (event.sub_type === 'poke') {
      const UserId = String(event.user_id);
      const UserAvatar = createUserAvatar(UserId);
      const [isMaster, UserKey] = getMaster(UserId);
      const groupId = String(event.group_id);

      const e: PublicEventNoticeCreate = {
        name: 'notice.create',
        Platform: platform,
        GuildId: groupId,
        ChannelId: groupId,
        IsMaster: isMaster,
        SpaceId: groupId,
        IsBot: false,
        UserId: UserId,
        UserName: '',
        UserKey,
        UserAvatar: UserAvatar,
        MessageId: `poke_${event.user_id}_${event.time}`,
        MessageText: '',
        OpenId: UserId,
        BotId: BotMe.id,
        _tag: 'NOTICE_NOTIFY_POKE',
        value: event
      };

      cbp.send(e);
    }
  });

  /**
   * @param val
   * @returns
   */
  const DataToMessage = async (val: DataEnums[] = []) => {
    // 空元素
    const empty = {
      type: 'text',
      data: {
        text: ''
      }
    };

    const message = (
      await Promise.all(
        val.map(async item => {
          if (item.type === 'Text') {
            return {
              type: 'text',
              data: {
                text: item.value
              }
            };
          } else if (item.type === 'Mention') {
            const options = item.options || {};

            if (item.value === 'everyone' || item.value === 'all' || item.value === '' || typeof item.value !== 'string') {
              return {
                type: 'at',
                data: {
                  qq: 'all',
                  nickname: ''
                }
              };
            } else if (options.belong === 'user') {
              return {
                type: 'at',
                data: {
                  qq: item.value
                }
              };
            }

            return empty;
          } else if (item.type === 'Image') {
            // 可能是 Buffer、https://、http://、base64://
            if (Buffer.isBuffer(item.value)) {
              return {
                type: 'image',
                data: {
                  file: `base64://${item.value.toString('base64')}`
                }
              };
            }
            if (typeof item.value === 'string' && (item.value.startsWith('http://') || item.value.startsWith('https://'))) {
              const res = await getBufferByURL(item.value);

              return {
                type: 'image',
                data: {
                  file: `base64://${res.toString('base64')}`
                }
              };
            } else if (item.value.startsWith('base64://')) {
              const base64Str = item.value.replace('base64://', '');

              return {
                type: 'image',
                data: {
                  file: `base64://${base64Str}`
                }
              };
            } else if (item.value.startsWith('buffer://')) {
              const base64Str = item.value.replace('buffer://', '');

              return {
                type: 'image',
                data: {
                  file: `base64://${base64Str}`
                }
              };
            } else if (item.value.startsWith('file://')) {
              const db = readFileSync(item.value.slice(7)); // 剥离 file:// 前缀

              return {
                type: 'image',
                data: {
                  file: `base64://${db.toString('base64')}`
                }
              };
            }

            return {
              type: 'image',
              data: {
                file: `base64://${item.value}`
              }
            };
          } else if (item.type === 'ImageFile') {
            const db = readFileSync(item.value);

            return {
              type: 'image',
              data: {
                file: `base64://${db.toString('base64')}`
              }
            };
          } else if (item.type === 'ImageURL') {
            const db = await getBufferByURL(item.value);

            return {
              type: 'image',
              data: {
                file: `base64://${db.toString('base64')}`
              }
            };
          } else if (item.type === 'Audio') {
            if (item.value.startsWith('http://') || item.value.startsWith('https://')) {
              return {
                type: 'record',
                data: {
                  file: item.value
                }
              };
            } else if (item.value.startsWith('file://')) {
              const db = readFileSync(item.value.slice(7));

              return {
                type: 'record',
                data: {
                  file: `base64://${db.toString('base64')}`
                }
              };
            } else if (item.value.startsWith('base64://')) {
              return {
                type: 'record',
                data: {
                  file: item.value
                }
              };
            }

            return {
              type: 'record',
              data: {
                file: item.value
              }
            };
          } else if (item.type === 'Video') {
            if (item.value.startsWith('http://') || item.value.startsWith('https://')) {
              return {
                type: 'video',
                data: {
                  file: item.value
                }
              };
            } else if (item.value.startsWith('file://')) {
              const db = readFileSync(item.value.slice(7));

              return {
                type: 'video',
                data: {
                  file: `base64://${db.toString('base64')}`
                }
              };
            } else if (item.value.startsWith('base64://')) {
              return {
                type: 'video',
                data: {
                  file: item.value
                }
              };
            }

            return {
              type: 'video',
              data: {
                file: item.value
              }
            };
          } else if (item.type === 'Attachment') {
            if (item.value.startsWith('http://') || item.value.startsWith('https://')) {
              return {
                type: 'file',
                data: {
                  file: item.value,
                  name: item.options?.filename
                }
              };
            } else if (item.value.startsWith('file://')) {
              return {
                type: 'file',
                data: {
                  file: item.value,
                  name: item.options?.filename
                }
              };
            }

            return {
              type: 'file',
              data: {
                file: item.value,
                name: item.options?.filename
              }
            };
          }

          // 降级处理：将 Markdown、Ark、Button、Link 等不支持的类型转为纯文本
          const hide = getOneBotConfig().hideUnsupported;

          // Level 2: Markdown 中的 MD.mention 转为原生 at 段
          if (Number(hide) >= 2 && item.type === 'Markdown' && typeof (item as any).value !== 'string') {
            const mdItems = (item as any).value;
            const segments: any[] = [];
            let currentText = '';

            for (const mdItem of mdItems) {
              if (mdItem.type === 'MD.mention') {
                if (currentText) {
                  segments.push({ type: 'text', data: { text: currentText } });
                  currentText = '';
                }

                if (mdItem.value === 'everyone') {
                  segments.push({ type: 'at', data: { qq: 'all', nickname: '' } });
                } else if (mdItem.value) {
                  segments.push({ type: 'at', data: { qq: String(mdItem.value) } });
                }
              } else {
                currentText += markdownToText([mdItem], hide);
              }
            }

            if (currentText) {
              const trimmedText = currentText.replace(/^[^\S\n\r]+|[^\S\n\r]+$/g, '');

              if (trimmedText) {
                segments.push({ type: 'text', data: { text: trimmedText } });
              }
            }

            return segments.length > 0 ? segments : [empty];
          }

          const fallbackText = dataEnumToText(item, hide);
          const trimmedFallback = fallbackText?.replace(/^[^\S\n\r]+|[^\S\n\r]+$/g, '');

          if (trimmedFallback) {
            return {
              type: 'text',
              data: {
                text: trimmedFallback
              }
            };
          }

          return empty;
        })
      )
    ).flat();

    return message;
  };

  /**
   *
   * @param ChannelId
   * @param val
   * @returns
   */
  const sendGroup = async (ChannelId: number, val: DataEnums[]) => {
    if (!val || val.length <= 0) {
      return [];
    }
    try {
      const message = await DataToMessage(val);
      const effectiveMessage = message.filter(m => !(m.type === 'text' && !m.data?.text));

      if (effectiveMessage.length <= 0) {
        if (getOneBotConfig().hideUnsupported) {
          logger.info('[onebot] hideUnsupported: 消息内容转换后为空，跳过发送');
        }

        return [];
      }

      const res = await client.sendGroupMessage({
        group_id: ChannelId,
        message: effectiveMessage
      });

      return [createResult(ResultCode.Ok, 'client.groupOpenMessages', res)];
    } catch (error) {
      return [createResult(ResultCode.Fail, 'client.groupOpenMessages', error)];
    }
  };

  /**
   *
   * @param UserId
   * @param val
   * @returns
   */
  const sendPrivate = async (UserId: number, val: DataEnums[]) => {
    if (!val || val.length <= 0) {
      return [];
    }
    try {
      const message = await DataToMessage(val);
      const effectiveMessage = message.filter(m => !(m.type === 'text' && !m.data?.text));

      if (effectiveMessage.length <= 0) {
        if (getOneBotConfig().hideUnsupported) {
          logger.info('[onebot] hideUnsupported: 消息内容转换后为空，跳过发送');
        }

        return [];
      }

      const res = await client.sendPrivateMessage({
        user_id: UserId,
        message: effectiveMessage
      });

      return [createResult(ResultCode.Ok, 'client.groupOpenMessages', res)];
    } catch (error) {
      return [createResult(ResultCode.Fail, 'client.groupOpenMessages', error)];
    }
  };

  const api = {
    active: {
      send: {
        channel: (SpaceId: string, val: DataEnums[]) => {
          return sendGroup(Number(SpaceId), val);
        },
        user: (OpenId: string, val: DataEnums[]) => {
          return sendPrivate(Number(OpenId), val);
        }
      }
    },
    use: {
      send: (
        event: {
          name: string;
          UserId?: string;
          ChannelId?: string;
        },
        val: DataEnums[]
      ) => {
        if (!val || val.length <= 0) {
          return [];
        }
        if (event['name'] === 'private.message.create') {
          const UserId = Number(event.UserId);

          return sendPrivate(UserId, val);
        } else if (event['name'] === 'message.create') {
          const GroupId = Number(event.ChannelId);

          return sendGroup(GroupId, val);
        }

        return Promise.all([]);
      },
      mention: event => {
        const e = event.value;
        const names = ['message.create', 'private.message.create'];

        if (names.includes(event.name)) {
          const Mentions: User[] = [];

          for (const item of e.message) {
            if (item.type === 'at') {
              let isBot = false;
              const UserId = String(item.data.qq);

              if (UserId === 'all') {
                continue;
              }
              if (UserId === BotMe.id) {
                isBot = true;
              }
              const [isMaster, UserKey] = getMaster(UserId);
              const avatar = createUserAvatar(UserId);

              Mentions.push({
                UserId: UserId,
                IsMaster: isMaster,
                UserKey: UserKey,
                UserName: item.data?.nickname,
                UserAvatar: avatar,
                IsBot: isBot
              });
            }
          }

          return new Promise<User[]>(resolve => resolve(Mentions));
        }

        return new Promise<User[]>(resolve => resolve([]));
      },
      delete(messageId: string) {
        return client.deleteMsg({ message_id: Number(messageId) });
      },
      file: {
        channel: client.uploadGroupFile.bind(client),
        user: client.uploadPrivateFile.bind(client)
      },
      forward: {
        channel: client.sendGroupForward.bind(client),
        user: client.sendPrivateForward.bind(client)
      }
    }
  };

  const onactions = async (data, consume) => {
    switch (data.action) {
      case 'me.info': {
        const res = await client.getLoginInfo();
        const UserId = String(res?.user_id);
        const [isMaster, UserKey] = getMaster(UserId);
        const user: User = {
          UserId: UserId,
          UserName: res?.nickname,
          IsBot: true,
          IsMaster: isMaster,
          UserAvatar: '',
          UserKey: UserKey
        };

        return consume([createResult(ResultCode.Ok, '请求完成', user)]);
      }
      case 'message.send': {
        const event = data.payload.event;
        const paramFormat = data.payload.params.format;
        const res = await api.use.send(event, paramFormat);

        return consume(res);
      }
      case 'message.send.channel': {
        const ChannelId = data.payload.ChannelId;
        const val = data.payload.params.format;
        const res = await api.active.send.channel(ChannelId, val);

        return consume(res);
      }
      case 'message.send.user': {
        const UserId = data.payload.UserId;
        const val = data.payload.params.format;
        const res = await api.active.send.user(UserId, val);

        return consume(res);
      }
      case 'mention.get': {
        const event = data.payload.event;
        const res = await api.use.mention(event);

        return consume([createResult(ResultCode.Ok, '请求完成', res)]);
      }
      case 'message.delete': {
        const res = await api.use
          .delete(data.payload.MessageId)
          .then(res => createResult(ResultCode.Ok, data.action, res))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'message.pin': {
        const messageId = data.payload.MessageId;
        const res = await client
          .setEssenceMsg({ message_id: Number(messageId) })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'message.unpin': {
        const messageId = data.payload.MessageId;
        const res = await client
          .deleteEssenceMsg({ message_id: Number(messageId) })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'file.send.channel': {
        const res = await api.use.file
          .channel(data.payload.ChannelId, data.payload.params)
          .then(res => createResult(ResultCode.Ok, data.action, res))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'file.send.user': {
        const res = await api.use.file
          .user(data.payload.UserId, data.payload.params)
          .then(res => createResult(ResultCode.Ok, data.action, res))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'message.forward.channel': {
        const params = await Promise.all(
          data.payload.params.map(async i => ({
            ...i,
            content: await DataToMessage(i.content)
          }))
        );
        const res = await api.use.forward
          .channel(data.payload.ChannelId, params)
          .then(res => createResult(ResultCode.Ok, data.action, res))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'message.forward.user': {
        const params = await Promise.all(
          data.payload.params.map(async i => ({
            ...i,
            content: await DataToMessage(i.content)
          }))
        );
        const res = await api.use.forward
          .user(data.payload.UserId, params)
          .then(res => createResult(ResultCode.Ok, data.action, res))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      // ─── 成员管理 ───
      case 'member.info': {
        const guildId = data.payload.params?.guildId ?? data.payload.GuildId;
        const userId = data.payload.params?.userId ?? data.payload.UserId;
        const res = await client
          .getGroupMemberInfo({ group_id: Number(guildId), user_id: Number(userId) })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'member.list': {
        const guildId = data.payload.GuildId;
        const res = await client
          .getGroupMemberList({ group_id: Number(guildId) })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'member.kick': {
        const guildId = data.payload.GuildId;
        const userId = data.payload.UserId;
        const res = await client
          .setGroupKick({ group_id: Number(guildId), user_id: Number(userId) })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'member.ban': {
        const guildId = data.payload.GuildId;
        const userId = data.payload.UserId;
        const duration = data.payload.params?.duration ?? 0;
        const res = await client
          .setGroupBan({ group_id: Number(guildId), user_id: Number(userId), duration: Number(duration) })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'member.unban': {
        const guildId = data.payload.GuildId;
        const userId = data.payload.UserId;
        const res = await client
          .setGroupBan({ group_id: Number(guildId), user_id: Number(userId), duration: 0 })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      // ─── 服务器/群 ───
      case 'guild.info': {
        const guildId = data.payload.GuildId;
        const res = await client
          .getGroupInfo({ group_id: Number(guildId) })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'guild.list': {
        const res = await client
          .getGroupList()
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      // ─── me ───
      case 'me.friends': {
        const res = await client
          .getFriendList()
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'me.guilds': {
        const res = await client
          .getGroupList()
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      // ─── 消息获取 ───
      case 'message.get': {
        const messageId = data.payload.MessageId;
        const res = await client
          .getMsg({ message_id: Number(messageId) })
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      // ─── 服务器/群管理扩展 ───
      case 'guild.update': {
        const guildId = data.payload.GuildId;
        const name = data.payload.params?.name;
        const res = await client
          .setGroupName({ group_id: Number(guildId), group_name: name ?? '' })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'guild.leave': {
        const guildId = data.payload.GuildId;
        const isDismiss = data.payload.params?.isDismiss ?? false;
        const res = await client
          .setGroupLeave({ group_id: Number(guildId), is_dismiss: isDismiss })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'guild.mute': {
        const guildId = data.payload.GuildId;
        const enable = data.payload.params?.enable ?? true;
        const res = await client
          .setGroupWholeBan({ group_id: Number(guildId), enable })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      // ─── 成员管理扩展 ───
      case 'member.mute': {
        const guildId = data.payload.GuildId;
        const userId = data.payload.UserId;
        const duration = data.payload.params?.duration ?? 0;
        const res = await client
          .setGroupBan({ group_id: Number(guildId), user_id: Number(userId), duration: Number(duration) })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'member.admin': {
        const guildId = data.payload.GuildId;
        const userId = data.payload.UserId;
        const enable = data.payload.params?.enable ?? true;
        const res = await client
          .setGroupAdmin({ group_id: Number(guildId), user_id: Number(userId), enable })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'member.card': {
        const guildId = data.payload.GuildId;
        const userId = data.payload.UserId;
        const card = data.payload.params?.card ?? '';
        const res = await client
          .setGroupCard({ group_id: Number(guildId), user_id: Number(userId), card })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'member.title': {
        const guildId = data.payload.GuildId;
        const userId = data.payload.UserId;
        const title = data.payload.params?.title ?? '';
        const duration = data.payload.params?.duration ?? -1;
        const res = await client
          .setGroupSpecialTitle({ group_id: Number(guildId), user_id: Number(userId), special_title: title, duration })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      // ─── 请求处理 ───
      case 'request.friend': {
        const params = data.payload.params;
        const res = await client
          .setFriendAddRequest({ flag: params.flag, approve: params.approve, remark: params.remark })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      case 'request.guild': {
        const params = data.payload.params;
        const res = await client
          .setGroupAddRequest({ flag: params.flag, sub_type: params.subType, approve: params.approve, reason: params.reason })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      // ─── 用户信息 ───
      case 'user.info': {
        const userId = data.payload.UserId;
        const res = await client
          .getStrangerInfo({ user_id: Number(userId) })
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      // ─── 成员搜索 ───
      case 'member.search': {
        const guildId = data.payload.GuildId;
        const keyword = data.payload.params?.keyword ?? '';
        const res = await client
          .getGroupMemberList({ group_id: Number(guildId) })
          .then(r => {
            const list = r?.data ?? r;
            const filtered = Array.isArray(list) ? list.filter((m: any) => (m.card ?? '').includes(keyword) || (m.nickname ?? '').includes(keyword)) : [];

            return createResult(ResultCode.Ok, data.action, filtered);
          })
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }
      default: {
        return consume([createResult(ResultCode.Fail, '未知请求，请尝试升级版本', null)]);
      }
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

  // 处理 api 调用
  cbp.onapis((data, consume) => void onapis(data, consume));
};

export default definePlatform({ main });

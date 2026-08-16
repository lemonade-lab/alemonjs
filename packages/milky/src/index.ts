import type { DataEnums, MessageMediaItem, User } from 'alemonjs';
import { cbpPlatform, createResult, definePlatform, FormatEvent, logger, ResultCode } from 'alemonjs';
import { platform, getMilkyConfig, getMaster, validateMilkyConfig } from './config';
import { MilkyClient } from './sdk/client';
import { setConnectionStatusProvider } from './sdk/status';
import { BotMe } from './db';
import { dataEnumToMilkyMessage, findReplyId, fixUri, isMilkyAtBot, milkySegmentsToMedia, milkySegmentsToText } from './format';
import type { MilkySegment } from './sdk/types';
export { platform } from './config';
export { MilkyClient as API } from './sdk/client';
export type { MilkyConnectionStatus, MilkyApiResponse } from './sdk/api';
export type { MilkyEvent, MilkySegment } from './sdk/types';
export * from './hook';

const main = () => {
  const config = validateMilkyConfig(getMilkyConfig());

  const client = new MilkyClient({
    host: config.host,
    port: config.port,
    prefix: config.prefix,
    connection: config.connection,
    access_token: config.access_token,
    http_timeout: config.http_timeout,
    heartbeat: config.heartbeat,
    reconnect_interval: config.reconnect_interval,
    webhook_path: config.webhook_path,
    webhook_port: config.webhook_port
  });

  setConnectionStatusProvider(() => client.getConnectionStatus());

  void client.connect();

  const cbp = cbpPlatform(`ws://127.0.0.1:${process.env?.port || 17117}`);

  const createUserAvatar = (id: string) => {
    return `https://q1.qlogo.cn/g?b=qq&s=0&nk=${id}`;
  };

  const createUser = (UserId: string, UserName?: string, IsBot = false): User => {
    const [IsMaster, UserKey] = getMaster(UserId);

    return {
      UserId,
      UserKey,
      UserName: UserName ?? '',
      UserAvatar: UserId ? createUserAvatar(UserId) : '',
      IsMaster,
      IsBot
    };
  };

  client.on('READY', event => {
    if (event?.self_id) {
      BotMe.id = String(event.self_id);
    }
  });

  // Milky 事件统一为 EVENT，按 event_type 分派。
  client.on('EVENT', event => {
    const selfId = String(event.self_id ?? BotMe.id);
    const data = event.data ?? {};
    const eventType = event.event_type;

    switch (eventType) {
      case 'message_receive': {
        const scene = data.message_scene;
        const isGroup = scene === 'group';
        const UserId = String(data.sender_id ?? '');
        const user = createUser(UserId, data.sender_name ?? '');
        const PeerId = String(data.peer_id ?? '');
        const MessageId = String(data.message_seq ?? '');
        const ReplyId = findReplyId(data.segments);
        const MessageText = milkySegmentsToText(data.segments);
        const MessageMedia = milkySegmentsToMedia(data.segments);
        const segments = data.segments ?? [];

        if (isGroup) {
          cbp.send(
            FormatEvent.create('message.create')
              .addPlatform({
                Platform: platform,
                value: event,
                BotId: selfId,
                IsAtMe: isMilkyAtBot(segments, selfId),
                IsPrivate: false
              })
              .addGuild({ GuildId: PeerId, SpaceId: PeerId })
              .addChannel({ ChannelId: PeerId })
              .addUser(user)
              .addMessage({ MessageId, ReplyId })
              .addText({ MessageText })
              .addMedia({ MessageMedia })
              .addOpen({ OpenId: UserId })
              .add({ tag: 'milky.message.group' }).value
          );
        } else {
          cbp.send(
            FormatEvent.create('private.message.create')
              .addPlatform({
                Platform: platform,
                value: event,
                BotId: selfId,
                IsAtMe: false,
                IsPrivate: true
              })
              .addUser(user)
              .addMessage({ MessageId, ReplyId })
              .addText({ MessageText })
              .addMedia({ MessageMedia })
              .addOpen({ OpenId: UserId })
              .add({ tag: scene === 'temp' ? 'milky.message.temp' : 'milky.message.private' }).value
          );
        }

        break;
      }

      case 'message_recall': {
        const scene = data.message_scene;
        const MessageId = String(data.message_seq ?? '');

        if (scene === 'group') {
          const groupId = String(data.peer_id ?? '');

          cbp.send(
            FormatEvent.create('message.delete')
              .addPlatform({ Platform: platform, value: event, BotId: selfId })
              .addGuild({ GuildId: groupId, SpaceId: groupId })
              .addChannel({ ChannelId: groupId })
              .addMessage({ MessageId })
              .add({ tag: 'milky.message_recall.group' }).value
          );
        } else {
          cbp.send(
            FormatEvent.create('private.message.delete')
              .addPlatform({ Platform: platform, value: event, BotId: selfId })
              .addMessage({ MessageId })
              .add({ tag: 'milky.message_recall.private' }).value
          );
        }

        break;
      }

      case 'friend_request': {
        const UserId = String(data.initiator_id ?? '');
        const user = createUser(UserId);

        cbp.send(
          FormatEvent.create('private.friend.add')
            .addPlatform({ Platform: platform, value: event, BotId: selfId })
            .addUser(user)
            .addMessage({ MessageId: String(data.initiator_uid ?? '') })
            .add({ tag: 'milky.friend_request' }).value
        );

        break;
      }

      case 'group_join_request':
      case 'group_invited_join_request':
      case 'group_invitation': {
        const UserId = String(data.initiator_id ?? data.target_user_id ?? '');
        const user = createUser(UserId);
        const flag = String(data.notification_seq ?? data.invitation_seq ?? '');

        cbp.send(
          FormatEvent.create('private.guild.add')
            .addPlatform({ Platform: platform, value: event, BotId: selfId })
            .addUser(user)
            .addMessage({ MessageId: flag })
            .add({ tag: `milky.${eventType}` }).value
        );

        break;
      }

      case 'friend_nudge': {
        const UserId = String(data.user_id ?? '');
        const user = createUser(UserId);

        cbp.send(
          FormatEvent.create('private.notice.create')
            .addPlatform({ Platform: platform, value: event, BotId: selfId })
            .addUser(user)
            .addMessage({ MessageId: `nudge_${data.time ?? Date.now()}` })
            .add({ tag: 'milky.friend_nudge' }).value
        );

        break;
      }

      case 'friend_file_upload': {
        const UserId = String(data.user_id ?? '');
        const user = createUser(UserId);
        const MessageMedia: MessageMediaItem[] = [
          {
            Type: 'file',
            FileId: data.file_id,
            FileName: data.file_name,
            FileSize: data.file_size ? Number(data.file_size) : undefined
          }
        ];

        cbp.send(
          FormatEvent.create('private.message.create')
            .addPlatform({ Platform: platform, value: event, BotId: selfId, IsAtMe: false, IsPrivate: true })
            .addUser(user)
            .addMessage({ MessageId: `file_${data.file_id ?? data.time ?? Date.now()}` })
            .addText({ MessageText: '' })
            .addMedia({ MessageMedia })
            .addOpen({ OpenId: UserId })
            .add({ tag: 'milky.friend_file_upload' }).value
        );

        break;
      }

      case 'group_admin_change': {
        const UserId = String(data.user_id ?? '');
        const user = createUser(UserId);
        const groupId = String(data.group_id ?? '');

        cbp.send(
          FormatEvent.create('member.update')
            .addPlatform({ Platform: platform, value: event, BotId: selfId })
            .addGuild({ GuildId: groupId, SpaceId: groupId })
            .addChannel({ ChannelId: groupId })
            .addUser(user)
            .addMessage({ MessageId: `admin_${data.time ?? Date.now()}` })
            .add({ tag: 'milky.group_admin_change' }).value
        );

        break;
      }

      case 'group_essence_message_change': {
        const UserId = String(data.operator_id ?? data.user_id ?? '');
        const user = createUser(UserId);
        const groupId = String(data.group_id ?? '');

        cbp.send(
          FormatEvent.create('notice.create')
            .addPlatform({ Platform: platform, value: event, BotId: selfId })
            .addGuild({ GuildId: groupId, SpaceId: groupId })
            .addChannel({ ChannelId: groupId })
            .addUser(user)
            .addMessage({ MessageId: String(data.message_seq ?? '') })
            .add({ tag: 'milky.group_essence_message_change' }).value
        );

        break;
      }

      case 'group_member_increase': {
        const UserId = String(data.user_id ?? '');
        const user = createUser(UserId);
        const groupId = String(data.group_id ?? '');

        cbp.send(
          FormatEvent.create('member.add')
            .addPlatform({ Platform: platform, value: event, BotId: selfId })
            .addGuild({ GuildId: groupId, SpaceId: groupId })
            .addChannel({ ChannelId: groupId })
            .addUser(user)
            .addMessage({ MessageId: `member_${data.time ?? Date.now()}` })
            .add({ tag: 'milky.group_member_increase' }).value
        );

        break;
      }

      case 'group_member_decrease': {
        const UserId = String(data.user_id ?? '');
        const user = createUser(UserId);
        const groupId = String(data.group_id ?? '');

        cbp.send(
          FormatEvent.create('member.remove')
            .addPlatform({ Platform: platform, value: event, BotId: selfId })
            .addGuild({ GuildId: groupId, SpaceId: groupId })
            .addChannel({ ChannelId: groupId })
            .addUser(user)
            .addMessage({ MessageId: `member_${data.time ?? Date.now()}` })
            .add({ tag: 'milky.group_member_decrease' }).value
        );

        break;
      }

      case 'group_disband': {
        const UserId = String(data.operator_id ?? data.user_id ?? '');
        const user = createUser(UserId);
        const groupId = String(data.group_id ?? '');

        cbp.send(
          FormatEvent.create('guild.exit')
            .addPlatform({ Platform: platform, value: event, BotId: selfId })
            .addGuild({ GuildId: groupId, SpaceId: groupId })
            .addChannel({ ChannelId: groupId })
            .addUser(user)
            .addMessage({ MessageId: `disband_${data.time ?? Date.now()}` })
            .add({ tag: 'milky.group_disband' }).value
        );

        break;
      }

      case 'group_name_change': {
        const groupId = String(data.group_id ?? '');

        cbp.send(
          FormatEvent.create('guild.update')
            .addPlatform({ Platform: platform, value: event, BotId: selfId })
            .addGuild({ GuildId: groupId, SpaceId: groupId })
            .addChannel({ ChannelId: groupId })
            .addMessage({ MessageId: `name_${data.time ?? Date.now()}` })
            .add({ tag: 'milky.group_name_change' }).value
        );

        break;
      }

      case 'group_message_reaction': {
        const groupId = String(data.group_id ?? '');

        cbp.send(
          FormatEvent.create(data.is_add ? 'message.reaction.add' : 'message.reaction.remove')
            .addPlatform({ Platform: platform, value: event, BotId: selfId })
            .addGuild({ GuildId: groupId, SpaceId: groupId })
            .addChannel({ ChannelId: groupId })
            .addMessage({ MessageId: String(data.message_seq ?? '') })
            .add({ tag: 'milky.group_message_reaction', faceId: String(data.face_id ?? '') }).value
        );

        break;
      }

      case 'group_mute': {
        const UserId = String(data.user_id ?? '');
        const user = createUser(UserId);
        const groupId = String(data.group_id ?? '');
        const isBan = Number(data.duration ?? 0) > 0;

        cbp.send(
          FormatEvent.create(isBan ? 'member.ban' : 'member.unban')
            .addPlatform({ Platform: platform, value: event, BotId: selfId })
            .addGuild({ GuildId: groupId, SpaceId: groupId })
            .addChannel({ ChannelId: groupId })
            .addUser(user)
            .addMessage({ MessageId: `mute_${data.time ?? Date.now()}` })
            .add({ tag: 'milky.group_mute' }).value
        );

        break;
      }

      case 'group_whole_mute': {
        const UserId = String(data.operator_id ?? data.user_id ?? '');
        const user = createUser(UserId);
        const groupId = String(data.group_id ?? '');

        cbp.send(
          FormatEvent.create('notice.create')
            .addPlatform({ Platform: platform, value: event, BotId: selfId })
            .addGuild({ GuildId: groupId, SpaceId: groupId })
            .addChannel({ ChannelId: groupId })
            .addUser(user)
            .addMessage({ MessageId: `whole_mute_${data.time ?? Date.now()}` })
            .add({ tag: 'milky.group_whole_mute' }).value
        );

        break;
      }

      case 'group_nudge': {
        const UserId = String(data.sender_id ?? data.user_id ?? '');
        const user = createUser(UserId);
        const groupId = String(data.group_id ?? '');

        cbp.send(
          FormatEvent.create('notice.create')
            .addPlatform({ Platform: platform, value: event, BotId: selfId })
            .addGuild({ GuildId: groupId, SpaceId: groupId })
            .addChannel({ ChannelId: groupId })
            .addUser(user)
            .addMessage({ MessageId: `nudge_${data.time ?? Date.now()}` })
            .add({ tag: 'milky.group_nudge' }).value
        );

        break;
      }

      case 'group_file_upload': {
        const UserId = String(data.user_id ?? '');
        const user = createUser(UserId);
        const groupId = String(data.group_id ?? '');
        const MessageMedia: MessageMediaItem[] = [
          {
            Type: 'file',
            FileId: data.file_id,
            FileName: data.file_name,
            FileSize: data.file_size ? Number(data.file_size) : undefined
          }
        ];

        cbp.send(
          FormatEvent.create('message.create')
            .addPlatform({ Platform: platform, value: event, BotId: selfId, IsAtMe: false, IsPrivate: false })
            .addGuild({ GuildId: groupId, SpaceId: groupId })
            .addChannel({ ChannelId: groupId })
            .addUser(user)
            .addMessage({ MessageId: `file_${data.file_id ?? data.time ?? Date.now()}` })
            .addText({ MessageText: '' })
            .addMedia({ MessageMedia })
            .addOpen({ OpenId: UserId })
            .add({ tag: 'milky.group_file_upload' }).value
        );

        break;
      }

      case 'peer_pin_change': {
        const scene = data.message_scene;
        const PeerId = String(data.peer_id ?? '');

        if (scene === 'group') {
          cbp.send(
            FormatEvent.create('notice.create')
              .addPlatform({ Platform: platform, value: event, BotId: selfId })
              .addGuild({ GuildId: PeerId, SpaceId: PeerId })
              .addChannel({ ChannelId: PeerId })
              .addUser(createUser(PeerId))
              .addMessage({ MessageId: `pin_${data.time ?? Date.now()}` })
              .add({ tag: 'milky.peer_pin_change' }).value
          );
        } else {
          cbp.send(
            FormatEvent.create('private.notice.create')
              .addPlatform({ Platform: platform, value: event, BotId: selfId })
              .addUser(createUser(PeerId))
              .addMessage({ MessageId: `pin_${data.time ?? Date.now()}` })
              .add({ tag: 'milky.peer_pin_change' }).value
          );
        }

        break;
      }

      default: {
        logger.debug(`[Milky] 未处理的事件类型: ${eventType}`);
        break;
      }
    }
  });

  const sendGroup = async (ChannelId: string, val: DataEnums[]) => {
    if (!val || val.length <= 0) {
      return [];
    }
    if (!ChannelId) {
      return [createResult(ResultCode.Fail, 'client.groupOpenMessages', 'ChannelId 不能为空')];
    }

    try {
      const message = dataEnumToMilkyMessage(val);
      const effectiveMessage = message.filter(item => !(item.type === 'text' && !item.data?.text));

      if (effectiveMessage.length <= 0) {
        logger.info('[milky] 消息内容转换后为空，跳过发送');

        return [];
      }

      const res = await client.sendGroupMessage({
        group_id: Number(ChannelId),
        message: effectiveMessage
      });

      return [createResult(ResultCode.Ok, 'client.groupOpenMessages', res)];
    } catch (error) {
      return [createResult(ResultCode.Fail, 'client.groupOpenMessages', error)];
    }
  };

  const sendPrivate = async (UserId: string, val: DataEnums[]) => {
    if (!val || val.length <= 0) {
      return [];
    }
    if (!UserId) {
      return [createResult(ResultCode.Fail, 'client.userOpenMessages', 'UserId 不能为空')];
    }

    try {
      const message = dataEnumToMilkyMessage(val);
      const effectiveMessage = message.filter(item => !(item.type === 'text' && !item.data?.text));

      if (effectiveMessage.length <= 0) {
        logger.info('[milky] 消息内容转换后为空，跳过发送');

        return [];
      }

      const res = await client.sendPrivateMessage({
        user_id: Number(UserId),
        message: effectiveMessage
      });

      return [createResult(ResultCode.Ok, 'client.userOpenMessages', res)];
    } catch (error) {
      return [createResult(ResultCode.Fail, 'client.userOpenMessages', error)];
    }
  };

  const api = {
    active: {
      send: {
        channel: (SpaceId: string, val: DataEnums[]) => {
          return sendGroup(String(SpaceId), val);
        },
        user: (OpenId: string, val: DataEnums[]) => {
          return sendPrivate(String(OpenId), val);
        }
      }
    },
    use: {
      send: (
        event: {
          name: string;
          UserId?: string;
          ChannelId?: string;
          BotId?: string;
        },
        val: DataEnums[]
      ) => {
        if (!val || val.length <= 0) {
          return [];
        }

        if (event['name'] === 'private.message.create') {
          return sendPrivate(String(event.UserId ?? ''), val);
        } else if (event['name'] === 'message.create') {
          return sendGroup(String(event.ChannelId ?? ''), val);
        }

        return Promise.all([]);
      },
      mention: event => {
        const e = event.value;
        const segments = e?.data?.segments ?? e?.message ?? [];
        const names = ['message.create', 'private.message.create'];

        if (names.includes(event.name)) {
          const Mentions: User[] = [];

          for (const item of segments) {
            if (item.type === 'mention' || item.type === 'mention_all') {
              const UserId = item.type === 'mention_all' ? 'all' : String(item.data?.user_id ?? '');

              if (item.type === 'mention_all' || UserId === 'all') {
                continue;
              }

              const [isMaster, UserKey] = getMaster(UserId);
              const avatar = createUserAvatar(UserId);

              Mentions.push({
                UserId,
                IsMaster: isMaster,
                UserKey,
                UserName: item.data?.name,
                UserAvatar: avatar,
                IsBot: UserId === BotMe.id
              });
            }
          }

          return new Promise<User[]>(resolve => resolve(Mentions));
        }

        return new Promise<User[]>(resolve => resolve([]));
      },
      delete: {
        channel: (ChannelId: string, messageId: string) => {
          return client.recallGroupMessage({
            group_id: Number(ChannelId),
            message_seq: Number(messageId)
          });
        },
        user: (UserId: string, messageId: string) => {
          return client.recallPrivateMessage({
            user_id: Number(UserId),
            message_seq: Number(messageId)
          });
        }
      },
      file: {
        channel: (ChannelId: string, params: any) => {
          return client.uploadGroupFile({
            group_id: Number(ChannelId),
            parent_folder_id: params?.folder ?? '/',
            file_uri: fixUri(params?.file),
            file_name: params?.name ?? ''
          });
        },
        user: (UserId: string, params: any) => {
          return client.uploadPrivateFile({
            user_id: Number(UserId),
            file_uri: fixUri(params?.file),
            file_name: params?.name ?? ''
          });
        }
      },
      forward: {
        channel: (ChannelId: string, params: any[]) => {
          const messages = params.map(i => ({
            user_id: Number(i.user_id ?? BotMe.id ?? 80000000),
            sender_name: i.nickname ?? '机器人',
            time: Number(i.time ?? Math.floor(Date.now() / 1000)),
            segments: dataEnumToMilkyMessage(i.content)
          }));

          return client.sendGroupMessage({
            group_id: Number(ChannelId),
            message: [{ type: 'forward', data: { messages } }] as MilkySegment[]
          });
        },
        user: (UserId: string, params: any[]) => {
          const messages = params.map(i => ({
            user_id: Number(i.user_id ?? BotMe.id ?? 80000000),
            sender_name: i.nickname ?? '机器人',
            time: Number(i.time ?? Math.floor(Date.now() / 1000)),
            segments: dataEnumToMilkyMessage(i.content)
          }));

          return client.sendPrivateMessage({
            user_id: Number(UserId),
            message: [{ type: 'forward', data: { messages } }] as MilkySegment[]
          });
        }
      }
    }
  };

  const onactions = async (data, consume) => {
    switch (data.action) {
      case 'me.info': {
        const res = await client.getLoginInfo();
        const UserId = String(res?.data?.uin ?? res?.data?.user_id ?? '');
        const [isMaster, UserKey] = getMaster(UserId);
        const user: User = {
          UserId,
          UserName: res?.data?.nickname,
          IsBot: true,
          IsMaster: isMaster,
          UserAvatar: '',
          UserKey
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
        const sourceEvent = data.payload.event;
        const raw = sourceEvent?.value ?? sourceEvent;
        const scene = raw?.data?.message_scene;
        const ChannelId = data.payload.ChannelId ?? (scene === 'group' ? raw?.data?.peer_id : undefined);
        const UserId = data.payload.UserId ?? (scene !== 'group' ? raw?.data?.peer_id : undefined);
        const MessageId = data.payload.MessageId;

        const res = ChannelId !== undefined ? await api.use.delete.channel(ChannelId, MessageId) : await api.use.delete.user(UserId, MessageId);

        return consume([createResult(ResultCode.Ok, data.action, res)]);
      }

      case 'message.pin': {
        const ChannelId = data.payload.ChannelId;
        const res = await client
          .setGroupEssenceMessage({
            group_id: Number(ChannelId),
            message_seq: Number(data.payload.MessageId),
            is_set: true
          })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      case 'message.unpin': {
        const ChannelId = data.payload.ChannelId;
        const res = await client
          .setGroupEssenceMessage({
            group_id: Number(ChannelId),
            message_seq: Number(data.payload.MessageId),
            is_set: false
          })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      case 'file.send.channel': {
        const res = await api.use.file
          .channel(data.payload.ChannelId, data.payload.params)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      case 'file.send.user': {
        const res = await api.use.file
          .user(data.payload.UserId, data.payload.params)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      case 'message.forward.channel': {
        const res = await api.use.forward
          .channel(data.payload.ChannelId, data.payload.params)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      case 'message.forward.user': {
        const res = await api.use.forward
          .user(data.payload.UserId, data.payload.params)
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      // ─── 成员管理 ───

      case 'member.info': {
        const guildId = data.payload.params?.guildId ?? data.payload.GuildId;
        const userId = data.payload.params?.userId ?? data.payload.UserId;
        const res = await client
          .getGroupMemberInfo({ group_id: Number(guildId), user_id: Number(userId) })
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      case 'member.list': {
        const guildId = data.payload.GuildId;
        const res = await client
          .getGroupMemberList({ group_id: Number(guildId) })
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      case 'member.kick': {
        const guildId = data.payload.GuildId;
        const userId = data.payload.UserId;
        const res = await client
          .kickGroupMember({ group_id: Number(guildId), user_id: Number(userId) })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      case 'member.ban':
      case 'member.mute': {
        const guildId = data.payload.GuildId;
        const userId = data.payload.UserId;
        const duration = data.payload.params?.duration ?? 0;
        const res = await client
          .setGroupMemberMute({
            group_id: Number(guildId),
            user_id: Number(userId),
            duration: Number(duration)
          })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      case 'member.unban': {
        const guildId = data.payload.GuildId;
        const userId = data.payload.UserId;
        const res = await client
          .setGroupMemberMute({ group_id: Number(guildId), user_id: Number(userId), duration: 0 })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      case 'member.admin': {
        const guildId = data.payload.GuildId;
        const userId = data.payload.UserId;
        const enable = data.payload.params?.enable ?? true;
        const res = await client
          .setGroupMemberAdmin({ group_id: Number(guildId), user_id: Number(userId), is_set: enable })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      case 'member.card': {
        const guildId = data.payload.GuildId;
        const userId = data.payload.UserId;
        const card = data.payload.params?.card ?? '';
        const res = await client
          .setGroupMemberCard({ group_id: Number(guildId), user_id: Number(userId), card })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      case 'member.title': {
        const guildId = data.payload.GuildId;
        const userId = data.payload.UserId;
        const title = data.payload.params?.title ?? '';
        const res = await client
          .setGroupMemberSpecialTitle({
            group_id: Number(guildId),
            user_id: Number(userId),
            special_title: title
          })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      case 'member.search': {
        const guildId = data.payload.GuildId;
        const keyword = data.payload.params?.keyword ?? '';
        const res = await client
          .getGroupMemberList({ group_id: Number(guildId) })
          .then(r => {
            const list = r?.data?.members ?? r?.data ?? r;
            const filtered = Array.isArray(list) ? list.filter((m: any) => (m.card ?? '').includes(keyword) || (m.nickname ?? '').includes(keyword)) : [];

            return createResult(ResultCode.Ok, data.action, filtered);
          })
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      // ─── 服务器/群 ───

      case 'guild.info': {
        const guildId = data.payload.GuildId;
        const res = await client
          .getGroupInfo({ group_id: Number(guildId) })
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      case 'guild.list': {
        const res = await client
          .getGroupList()
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      case 'guild.update': {
        const guildId = data.payload.GuildId;
        const name = data.payload.params?.name;
        const res = await client
          .setGroupName({ group_id: Number(guildId), new_group_name: name ?? '' })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      case 'guild.leave': {
        const guildId = data.payload.GuildId;
        const res = await client
          .quitGroup({ group_id: Number(guildId) })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      case 'guild.mute': {
        const guildId = data.payload.GuildId;
        const enable = data.payload.params?.enable ?? true;
        const res = await client
          .setGroupWholeMute({ group_id: Number(guildId), is_mute: enable })
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      // ─── me ───

      case 'me.friends': {
        const res = await client
          .getFriendList()
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      case 'me.guilds': {
        const res = await client
          .getGroupList()
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      // ─── 消息获取 ───

      case 'message.get': {
        const messageId = data.payload.MessageId;
        const event = data.payload.event;
        const scene = event?.data?.message_scene ?? 'group';
        const peerId = event?.data?.peer_id ?? event?.data?.group_id ?? data.payload.ChannelId ?? 0;
        const res = await client
          .getMessage({
            message_scene: scene,
            peer_id: Number(peerId),
            message_seq: Number(messageId)
          })
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      // ─── 请求处理 ───

      case 'request.friend': {
        const params = data.payload.params;
        const res = await (params.approve
          ? client.acceptFriendRequest({
              initiator_uid: params.flag,
              is_filtered: params.is_filtered ?? false
            })
          : client.rejectFriendRequest({
              initiator_uid: params.flag,
              is_filtered: params.is_filtered ?? false,
              reason: params.reason
            })
        )
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      case 'request.guild': {
        const params = data.payload.params;
        const raw = data.payload.event?.value ?? data.payload.event;
        const notificationType = params.subType === 'invite' ? 'invited_join_request' : 'join_request';
        const groupId = params.guildId ?? params.group_id ?? raw?.data?.group_id ?? 0;
        const res = await (params.approve
          ? client.acceptGroupRequest({
              notification_seq: Number(params.flag),
              notification_type: notificationType,
              group_id: Number(groupId),
              is_filtered: params.is_filtered ?? false
            })
          : client.rejectGroupRequest({
              notification_seq: Number(params.flag),
              notification_type: notificationType,
              group_id: Number(groupId),
              is_filtered: params.is_filtered ?? false,
              reason: params.reason
            })
        )
          .then(r => createResult(ResultCode.Ok, data.action, r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      // ─── 用户信息 ───

      case 'user.info': {
        const userId = data.payload.UserId;
        const res = await client
          .getUserProfile({ user_id: Number(userId) })
          .then(r => createResult(ResultCode.Ok, data.action, r?.data ?? r))
          .catch(err => createResult(ResultCode.Fail, data.action, err));

        return consume([res]);
      }

      case 'connection.status': {
        return consume([createResult(ResultCode.Ok, data.action, client.getConnectionStatus())]);
      }

      default: {
        return consume([createResult(ResultCode.Fail, '未知请求，请尝试升级版本', null)]);
      }
    }
  };

  cbp.onactions((data, consume) => void onactions(data, consume));

  const onapis = async (data, consume) => {
    const key = data.payload?.key;
    const params = data.payload?.params ?? [];

    try {
      // 支持嵌套路径，如 'sendGroupMessage'
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

  // 处理 api 调用
  cbp.onapis((data, consume) => void onapis(data, consume));
};

export default definePlatform({ main });

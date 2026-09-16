import WebSocket from 'ws';
import { cbpPlatform, definePlatform, FormatEvent } from 'alemonjs/platform';
import { createResult, logger, ResultCode } from 'alemonjs/common';
import { getDouyinConfig, getMaster, platform } from './config.js';
import { dataToBridgeMessage } from './format.js';
import { parseGateway } from './gateway.js';
import { startDirectAdapter } from './runtime.js';

export { platform } from './config.js';
export type { Options } from './config.js';
export { dataToBridgeMessage } from './format.js';

type BridgeMedia = { type?: string; id?: string; url?: string; name?: string; size?: number; mime_type?: string };
type BridgeMessage = {
  message_id?: string;
  conversation_id?: string;
  conversation_short_id?: string;
  conversation_type?: 'private' | 'group';
  sender?: { id?: string; nickname?: string; avatar?: string; is_bot?: boolean };
  text?: string;
  media?: BridgeMedia[];
  /** ID of the message quoted by this message. */
  reply_to?: string;
  /** Rich mentions supplied by the gateway; used to reliably detect @ the bot. */
  mentions?: Array<{ id?: string; user_id?: string }>;
  is_at_me?: boolean;
  raw?: unknown;
};
type BridgeNotice = {
  type?:
    | 'message.recall'
    | 'message.reaction'
    | 'friend.increase'
    | 'friend.decrease'
    | 'group.member-increase'
    | 'group.member-decrease'
    | 'group.admin'
    | 'group.name-change';
  message_id?: string;
  conversation_id?: string;
  conversation_short_id?: string;
  conversation_type?: 'private' | 'group';
  sender?: { id?: string; nickname?: string; avatar?: string };
  operator?: { id?: string; nickname?: string; avatar?: string };
  target?: { id?: string; nickname?: string; avatar?: string };
  emoji_id?: string;
  is_set?: boolean;
  raw?: unknown;
};
type PendingResult = (result: any) => void;
const mediaTypes = new Set(['image', 'audio', 'video', 'file', 'sticker', 'animation']);
const maxGatewayFrameBytes = 1024 * 1024;

const asJson = (value: WebSocket.RawData) => {
  try {
    return JSON.parse(Buffer.isBuffer(value) ? value.toString('utf8') : String(value));
  } catch {
    return undefined;
  }
};

const main = () => {
  const config = getDouyinConfig();

  if (!config.gateway) {
    return startDirectAdapter(config);
  }
  if (!config.bot_id) {
    throw new Error('[douyin] douyin.gateway 和 douyin.bot_id 为必填配置');
  }
  const gateway = parseGateway(config.gateway, config.token);

  const cbp = cbpPlatform(`ws://127.0.0.1:${process.env.port || 17117}`);
  const pending = new Map<string, PendingResult>();
  const reconnectInterval = Math.max(1000, Number(config.reconnect_interval ?? 5000));
  let socket: WebSocket | undefined;
  let stopped = false;
  let requestId = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  const failPending = (message: string) => {
    for (const resolve of pending.values()) {
      resolve({ ok: false, error: message });
    }
    pending.clear();
  };

  const emitMessage = (message: BridgeMessage) => {
    const sender = message.sender;
    const UserId = String(sender?.id ?? '');
    const ChannelId = String(message.conversation_id ?? message.conversation_short_id ?? '');

    if (!UserId || !ChannelId || sender?.is_bot) {
      return;
    }
    const [IsMaster, UserKey] = getMaster(UserId);
    const isGroup = message.conversation_type === 'group';
    const replyContext = {
      message_id: message.message_id,
      conversation_id: message.conversation_id,
      conversation_short_id: message.conversation_short_id,
      conversation_type: message.conversation_type
    };
    const isAtMe = Boolean(message.is_at_me) || (message.mentions ?? []).some(mention => String(mention.id ?? mention.user_id ?? '') === String(config.bot_id));
    const builder = FormatEvent.create(isGroup ? 'message.create' : 'private.message.create')
      .addPlatform({ Platform: platform, value: replyContext, BotId: config.bot_id, IsPrivate: !isGroup, IsAtMe: isAtMe })
      .addUser({ UserId, UserKey, UserName: sender?.nickname, UserAvatar: sender?.avatar, IsMaster, IsBot: false })
      .addMessage({ MessageId: String(message.message_id ?? ''), ReplyId: message.reply_to })
      .addText({ MessageText: String(message.text ?? '') })
      .addOpen({ OpenId: UserId });

    if (isGroup) {
      (builder as any).addGuild({ GuildId: ChannelId, SpaceId: ChannelId }).addChannel({ ChannelId });
    }
    const media = (message.media ?? [])
      .filter(item => item.type && mediaTypes.has(item.type))
      .map(item => ({
        Type: item.type as any,
        FileId: item.id ?? item.url,
        FileName: item.name,
        FileSize: item.size,
        MimeType: item.mime_type,
        Url: item.url
      }));

    if (media.length) {
      (builder as any).addMedia({ MessageMedia: media });
    }
    cbp.send(builder.add({ tag: 'douyin.message' }).value as any);
  };

  const emitNotice = (notice: BridgeNotice) => {
    const isGroup = notice.conversation_type === 'group';
    const channelId = String(notice.conversation_id ?? notice.conversation_short_id ?? '');
    const actor = notice.type?.startsWith('group.member-') || notice.type === 'group.admin' ? notice.target : notice.operator ?? notice.sender ?? notice.target;
    const UserId = String(actor?.id ?? '');
    const [IsMaster, UserKey] = getMaster(UserId);
    const name =
      notice.type === 'message.reaction' && isGroup
        ? notice.is_set === false
          ? 'message.reaction.remove'
          : 'message.reaction.add'
        : notice.type === 'message.recall'
        ? isGroup
          ? 'message.delete'
          : 'private.message.delete'
        : notice.type === 'group.member-increase'
        ? 'member.add'
        : notice.type === 'group.member-decrease'
        ? 'member.remove'
        : notice.type === 'group.admin'
        ? 'member.update'
        : notice.type === 'group.name-change'
        ? 'guild.update'
        : notice.type === 'friend.decrease'
        ? 'private.friend.remove'
        : isGroup
        ? 'notice.create'
        : 'private.notice.create';
    const builder = FormatEvent.create(name as any)
      .addPlatform({
        Platform: platform,
        value: { conversation_id: channelId, conversation_short_id: notice.conversation_short_id, conversation_type: notice.conversation_type },
        BotId: config.bot_id,
        IsPrivate: !isGroup
      })
      .addMessage({ MessageId: String(notice.message_id ?? `${notice.type ?? 'notice'}-${Date.now()}`) });

    if (UserId) {
      (builder as any).addUser({ UserId, UserKey, UserName: actor?.nickname, UserAvatar: actor?.avatar, IsMaster, IsBot: false });
    }
    if (isGroup && channelId) {
      (builder as any).addGuild({ GuildId: channelId, SpaceId: channelId }).addChannel({ ChannelId: channelId });
    }
    cbp.send(
      (builder as any).add({
        tag: `douyin.notice.${notice.type ?? 'unknown'}`,
        noticeType: notice.type,
        targetId: notice.target?.id,
        emojiId: notice.emoji_id
      }).value
    );
  };

  const connect = () => {
    if (stopped) {
      return;
    }
    socket = new WebSocket(gateway, { headers: config.token ? { authorization: `Bearer ${config.token}` } : undefined, maxPayload: maxGatewayFrameBytes });
    socket.on('open', () => {
      cbp.send({ name: 'connection.ready', Platform: platform, value: '', BotId: config.bot_id, transport: 'websocket' });
      socket?.send(
        JSON.stringify({
          type: 'hello',
          version: 2,
          bot_id: config.bot_id,
          capabilities: ['message', 'notice', 'send', 'action']
        })
      );
    });
    socket.on('message', raw => {
      const packet = asJson(raw);

      if (!packet || typeof packet !== 'object') {
        return;
      }
      if (packet.type === 'message') {
        emitMessage(packet.message ?? {});
      }
      if (packet.type === 'notice') {
        emitNotice(packet.notice ?? {});
      }
      if (packet.type === 'ack' && packet.request_id && pending.has(packet.request_id)) {
        pending.get(packet.request_id)?.(packet);
        pending.delete(packet.request_id);
      }
    });
    socket.on('error', error => logger.error({ code: ResultCode.FailInternal, message: `[douyin] 桌面 IM 网关连接失败: ${error.message}`, data: error }));
    socket.on('close', () => {
      failPending('抖音桌面 IM 网关连接已关闭');
      if (!stopped) {
        reconnectTimer = setTimeout(connect, reconnectInterval);
      }
    });
  };

  connect();

  const callGateway = (frame: Record<string, unknown>, consume: any) => {
    if (socket?.readyState !== WebSocket.OPEN) {
      return consume([createResult(ResultCode.Fail, '抖音桌面 IM 网关未连接', null)]);
    }
    const id = `${Date.now()}-${++requestId}`;
    const timer = setTimeout(() => {
      pending.delete(id);
      consume([createResult(ResultCode.Fail, '抖音桌面 IM 网关请求超时', null)]);
    }, 15_000);

    pending.set(id, (ack: any) => {
      clearTimeout(timer);
      const sending = frame.type === 'send';
      const messageId = ack.message_id ?? ack.data?.id;
      const success = ack.ok === true && (!sending || (typeof messageId === 'string' && messageId !== '' && messageId !== '0'));

      consume([
        createResult(success ? ResultCode.Ok : ResultCode.Fail, success ? '请求完成' : '网关未确认操作成功', success && sending ? { id: messageId } : null)
      ]);
    });
    const payload = JSON.stringify({ ...frame, request_id: id });

    if (Buffer.byteLength(payload) > maxGatewayFrameBytes) {
      pending.delete(id);
      clearTimeout(timer);

      return consume([createResult(ResultCode.FailParams, '抖音桌面 IM 网关消息超过 1 MiB 限制', null)]);
    }
    try {
      socket.send(payload);
    } catch (error: any) {
      pending.delete(id);
      clearTimeout(timer);
      consume([createResult(ResultCode.Fail, error?.message ?? '抖音桌面 IM 网关请求失败', null)]);
    }
  };

  cbp.onactions((data: any, consume: any) => {
    const payload = data.payload || {};
    const event = payload.event?.value as BridgeMessage | undefined;
    const target = payload.target;

    if (data.action === 'connection.status') {
      const state = stopped
        ? 'stopped'
        : socket?.readyState === WebSocket.OPEN
        ? 'ready'
        : socket?.readyState === WebSocket.CONNECTING
        ? 'connecting'
        : 'offline';

      return consume([
        createResult(ResultCode.Ok, data.action, { Platform: platform, state, bots: [{ BotId: config.bot_id, state, transport: 'websocket' }] })
      ]);
    }
    const botIds = [payload.BotId, target?.BotId, payload.event?.BotId].filter(id => id !== undefined);

    if (botIds.some(id => id !== config.bot_id) || (target?.scope && !['group', 'c2c'].includes(target.scope))) {
      return consume([createResult(ResultCode.FailParams, 'BotId 或会话范围无效', null)]);
    }
    if (
      data.action === 'message.send' ||
      data.action === 'message.send.target' ||
      data.action === 'message.send.channel' ||
      data.action === 'message.send.user'
    ) {
      const conversationId = String(event?.conversation_id ?? event?.conversation_short_id ?? target?.targetId ?? payload.ChannelId ?? payload.UserId ?? '');
      const conversationType = event?.conversation_type ?? (target?.scope === 'group' || data.action === 'message.send.channel' ? 'group' : 'private');
      const message = dataToBridgeMessage(payload.params?.format ?? [], config.hideUnsupported);

      if (!conversationId || (!message.text && !message.segments.length)) {
        return consume([createResult(ResultCode.FailParams, '抖音发送需要有效会话目标和非空消息', null)]);
      }

      return callGateway(
        {
          type: 'send',
          target: {
            conversation_id: conversationId,
            conversation_short_id: event?.conversation_short_id,
            conversation_type: conversationType,
            ...(data.action === 'message.send.user' ? { peer_id: conversationId } : {})
          },
          message: { ...message, ...(payload.params?.replyId ? { reply_to: String(payload.params.replyId) } : {}) }
        },
        consume
      );
    }
    if (data.action === 'message.delete' || data.action === 'reaction.add' || data.action === 'reaction.remove') {
      const conversationId = String(payload.ChannelId ?? target?.targetId ?? event?.conversation_id ?? event?.conversation_short_id ?? '');

      if (!conversationId || !payload.MessageId || (data.action.startsWith('reaction.') && !payload.EmojiId)) {
        return consume([createResult(ResultCode.FailParams, '该操作需要会话 ID 和消息 ID', null)]);
      }

      return callGateway(
        {
          type: 'action',
          action: data.action,
          target: {
            conversation_id: conversationId,
            conversation_type: event?.conversation_type ?? (target?.scope === 'group' || payload.ChannelId ? 'group' : 'private')
          },
          message_id: String(payload.MessageId),
          ...(payload.EmojiId ? { emoji_id: String(payload.EmojiId) } : {})
        },
        consume
      );
    }

    return consume([createResult(ResultCode.Fail, `douyin 网关模式不支持动作 ${data.action}`, null)]);
  });

  const stop = () => {
    stopped = true;
    clearTimeout(reconnectTimer);
    failPending('抖音适配器已停止');
    socket?.close();
  };

  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
};

export default definePlatform({ main, name: platform });

import WebSocket from 'ws';
import { cbpPlatform, createResult, definePlatform, FormatEvent, logger, ResultCode } from 'alemonjs';
import { getDouyinConfig, getMaster, platform } from './config.js';
import { dataToBridgeMessage } from './format.js';
import { parseGateway } from './gateway.js';

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
  is_at_me?: boolean;
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

  if (!config.gateway || !config.bot_id) {
    throw new Error('[douyin] douyin.gateway 和 douyin.bot_id 为必填配置');
  }
  const gateway = parseGateway(config.gateway, config.token);

  const cbp = cbpPlatform(`ws://127.0.0.1:${process.env.port || 17117}`);
  const pending = new Map<string, PendingResult>();
  const reconnectInterval = Math.max(1000, Number(config.reconnect_interval ?? 5000));
  let socket: WebSocket | undefined;
  let stopped = false;
  let requestId = 0;
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
    const builder = FormatEvent.create(isGroup ? 'message.create' : 'private.message.create')
      .addPlatform({ Platform: platform, value: replyContext, BotId: config.bot_id, IsPrivate: !isGroup, IsAtMe: Boolean(message.is_at_me) })
      .addUser({ UserId, UserKey, UserName: sender?.nickname, UserAvatar: sender?.avatar, IsMaster, IsBot: false })
      .addMessage({ MessageId: String(message.message_id ?? '') })
      .addText({ MessageText: String(message.text ?? '') })
      .addOpen({ OpenId: ChannelId });

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

  const connect = () => {
    if (stopped) {
      return;
    }
    socket = new WebSocket(gateway, { headers: config.token ? { authorization: `Bearer ${config.token}` } : undefined, maxPayload: maxGatewayFrameBytes });
    socket.on('open', () => socket?.send(JSON.stringify({ type: 'hello', bot_id: config.bot_id })));
    socket.on('message', raw => {
      const packet = asJson(raw);

      if (!packet || typeof packet !== 'object') {
        return;
      }
      if (packet.type === 'message') {
        emitMessage(packet.message ?? {});
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
        setTimeout(connect, reconnectInterval);
      }
    });
  };

  connect();

  cbp.onactions((data: any, consume: any) => {
    if (data.action !== 'message.send') {
      return;
    }
    const payload = data.payload || {};
    const event = payload.event?.value as BridgeMessage | undefined;
    const conversationId = String(event?.conversation_id ?? event?.conversation_short_id ?? '');
    const message = dataToBridgeMessage(payload.params?.format ?? [], config.hideUnsupported);

    if (!conversationId || (!message.text && !message.segments.length)) {
      return consume([createResult(ResultCode.FailParams, '抖音发送需要入站会话上下文和非空消息', null)]);
    }
    if (socket?.readyState !== WebSocket.OPEN) {
      return consume([createResult(ResultCode.Fail, '抖音桌面 IM 网关未连接', null)]);
    }
    const id = `${Date.now()}-${++requestId}`;
    const timer = setTimeout(() => {
      pending.delete(id);
      consume([createResult(ResultCode.Fail, '抖音桌面 IM 网关发送超时', null)]);
    }, 15_000);

    pending.set(id, (ack: any) => {
      clearTimeout(timer);
      consume([createResult(ack.ok === false ? ResultCode.Fail : ResultCode.Ok, ack.error ?? data.action, ack)]);
    });
    const frame = JSON.stringify({
      type: 'send',
      request_id: id,
      target: { conversation_id: conversationId, conversation_short_id: event?.conversation_short_id, conversation_type: event?.conversation_type },
      message
    });

    if (Buffer.byteLength(frame) > maxGatewayFrameBytes) {
      pending.delete(id);
      clearTimeout(timer);

      return consume([createResult(ResultCode.FailParams, '抖音桌面 IM 网关消息超过 1 MiB 限制', null)]);
    }
    try {
      socket.send(frame);
    } catch (error: any) {
      pending.delete(id);
      clearTimeout(timer);
      consume([createResult(ResultCode.Fail, error?.message ?? '抖音桌面 IM 网关发送失败', null)]);
    }
  });

  const stop = () => {
    stopped = true;
    socket?.close();
  };

  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
};

export default definePlatform({ main, name: platform });

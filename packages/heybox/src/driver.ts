import { randomUUID } from 'node:crypto';
import WebSocket from 'ws';
import { messageId, required, RestClient, sendActions, text, type Context } from './utils.js';

// Protocol/API shapes checked against heybox-bot 1.3.49 and heybox.dev.
// Its send wrapper discards the HTTP Promise, so use a checked transport here.
export function createDriver(ctx: Context, Socket: any = WebSocket) {
  const c = ctx.config;

  required(c, 'token');
  const common = new URLSearchParams({
    client_type: 'heybox_chat',
    x_client_type: 'web',
    os_type: 'web',
    x_os_type: 'bot',
    x_app: 'heybox_chat',
    chat_os_type: 'bot',
    chat_version: '1.30.0'
  });
  const api = new RestClient('https://chat.xiaoheihe.cn/chatroom/', { token: c.token });
  const request = async (path: string, method = 'GET', body?: any) => {
    const r = await api.request(`${path}${path.includes('?') ? '&' : '?'}${common}`, method, body);

    if (r.status !== 'ok') {
      throw new Error(`Heybox: ${r.msg ?? r.status ?? 'response missing status'}`);
    }

    return r.result;
  };
  let ws: any;
  let heartbeat: any;
  let retry: any;
  let stopped = false;
  let misses = 0;
  const connect = () => {
    ws = new Socket(`wss://chat.xiaoheihe.cn/chatroom/ws/connect?${common}&token=${encodeURIComponent(c.token)}`);
    ws.on('open', () => {
      misses = 0;
      ctx.ready(c.bot_id);
      heartbeat = setInterval(() => {
        if (++misses > 3) {
          ws.terminate();
        } else if (ws.readyState === Socket.OPEN) {
          ws.send('PING');
        }
      }, 30_000);
    });
    ws.on('error', () => ctx.state('offline'));
    ws.on('close', () => {
      clearInterval(heartbeat);
      ctx.state(stopped ? 'stopped' : 'reconnecting');
      if (!stopped) {
        retry = setTimeout(connect, 5000);
      }
    });
    ws.on('message', (raw: any) => {
      if (raw.toString() === 'PONG') {
        misses = 0;

        return;
      }
      try {
        const frame = JSON.parse(raw.toString());
        const e = frame.data ?? {};
        const channel = e.channel_id ?? e.channel_base_info?.channel_id;
        const guild = e.room_id ?? e.room_base_info?.room_id;

        if (String(frame.type) === '5') {
          ctx.emit({
            user: String(e.user_id),
            username: e.nickname,
            id: e.msg_id,
            channel,
            guild,
            private: !channel,
            text: e.msg,
            media: e.img ? [{ Type: 'image', Url: e.img }] : [],
            raw: e
          });
        } else if (String(frame.type) === '50') {
          ctx.emit({
            user: String(e.sender_info?.user_id ?? e.sender_info?.heybox_id),
            id: e.msg_id,
            channel,
            guild,
            text: [e.command_info?.name, ...(e.command_info?.options ?? []).map((option: any) => option.value)].filter(Boolean).join(' '),
            media: [...(e.command_info?.images ?? []), ...(e.command_info?.files ?? [])].map((file: any) => ({
              Type: e.command_info?.images?.includes(file) ? 'image' : 'file',
              FileId: file.id,
              Url: file.url,
              FileName: file.name
            })),
            atMe: true,
            raw: e
          });
        } else if (String(frame.type) === '3001') {
          ctx.emit({
            name: e.state === 1 ? 'member.add' : 'member.remove',
            user: String(e.user_info?.user_id ?? e.user_info?.heybox_id),
            channel: guild,
            guild,
            raw: e
          });
        } else if (String(frame.type) === '5003') {
          ctx.emit({
            name: e.is_add ? 'reaction.add' : 'reaction.remove',
            user: e.user_id,
            id: `${e.msg_id}:${e.emoji}:${frame.timestamp}`,
            channel,
            guild,
            interaction: e.emoji,
            raw: e
          });
        } else if (frame.type === 'card_message_btn_click') {
          ctx.emit({
            name: 'interaction.create',
            user: String(e.sender_info?.user_id ?? e.sender_info?.heybox_id),
            id: `${e.msg_id}:${frame.timestamp}`,
            channel,
            guild,
            text: e.value,
            interaction: e,
            raw: e
          });
        }
      } catch {
        ctx.state('ready');
      }
    });
  };
  const room = (p: any) => {
    const id = p.GuildId ?? p.event?.GuildId ?? c.room_id;

    if (!id) {
      throw new Error('Heybox operation requires GuildId/room_id');
    }

    return id;
  };
  const actions = {
    ...sendActions(async (t, f, p) => {
      const content = text(f);

      if (!content) {
        throw new Error('Empty message');
      }
      const body = t.private
        ? { heychat_ack_id: randomUUID(), msg_type: 4, to_user_id: Number(t.id), msg: content, addition: '{}' }
        : {
            heychat_ack_id: randomUUID(),
            msg_type: 4,
            msg: content,
            room_id: room(p),
            channel_id: t.id,
            reply_id: p.params?.replyId ?? '',
            addition: '{}'
          };
      const r = await request(t.private ? 'v3/msg/user' : 'v2/channel_msg/send', 'POST', body);

      return messageId(r, r?.msg_id);
    }),
    'guild.list': () => request('v2/room/joined?offset=0&limit=50'),
    'guild.info': (p: any) => request(`v2/room/view?room_id=${encodeURIComponent(p.GuildId)}`),
    'member.list': (p: any) =>
      request(`v2/room/users?room_id=${encodeURIComponent(p.GuildId)}&heybox_id=${encodeURIComponent(c.bot_id ?? '')}&offset=0&limit=${p.params?.limit ?? 50}`),
    'member.kick': (p: any) => request('v2/room/kick_out', 'POST', { room_id: p.GuildId, user_id: Number(p.UserId), reason: p.params?.reason }),
    'role.list': (p: any) => request(`v2/room_role/roles?room_id=${encodeURIComponent(p.GuildId)}`),
    'role.assign': (p: any) => request('v2/room_role/grant', 'POST', { room_id: p.GuildId, user_id: Number(p.UserId), role_id: p.RoleId }),
    'role.remove': (p: any) => request('v2/room_role/revoke', 'POST', { room_id: p.GuildId, user_id: Number(p.UserId), role_id: p.RoleId }),
    'message.edit': (p: any) =>
      request('v2/channel_msg/update', 'POST', {
        msg_id: p.MessageId,
        room_id: room(p),
        channel_id: p.ChannelId,
        msg: text(p.params?.format),
        msg_type: 4,
        addition: '{}'
      }),
    'message.delete': (p: any) => request('v2/channel_msg/delete', 'POST', { msg_id: p.MessageId, room_id: room(p), channel_id: p.ChannelId }),
    'reaction.add': (p: any) =>
      request('v2/channel_msg/emoji/reply', 'POST', {
        msg_id: p.MessageId,
        room_id: room(p),
        channel_id: p.ChannelId,
        emoji: p.EmojiId,
        is_add: 1
      }),
    'reaction.remove': (p: any) =>
      request('v2/channel_msg/emoji/reply', 'POST', {
        msg_id: p.MessageId,
        room_id: room(p),
        channel_id: p.ChannelId,
        emoji: p.EmojiId,
        is_add: 0
      })
  };

  return {
    client: { request },
    actions,
    start: connect,
    stop: () => {
      stopped = true;
      clearInterval(heartbeat);
      clearTimeout(retry);
      ws?.close();
    }
  };
}

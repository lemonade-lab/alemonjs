import zulipInit from 'zulip-js';
import { messageId, required, sendActions, text, type Context } from './utils.js';

export async function createDriver(ctx: Context, init: any = zulipInit) {
  const c = ctx.config;

  required(c, 'realm', 'email', 'api_key');
  const client = await init({ realm: c.realm, username: c.email, apiKey: c.api_key });
  let queue: any;
  let running = false;
  let task: Promise<any>;
  let bot = '';
  const check = (r: any) => {
    if (r.result !== 'success') {
      throw new Error(`Zulip: ${r.msg}`);
    }

    return r;
  };
  const request = async (path: string, method = 'GET', params: any = {}) => check(await client.callEndpoint(path, method, params));
  const actions = {
    ...sendActions(async (t, f, p) => {
      const topic = p.params?.topic ?? p.event?.value?.subject ?? c.default_topic;

      if (!t.private && !topic) {
        throw new Error('Zulip channel messages require params.topic or default_topic');
      }
      const r = check(
        await client.messages.send({
          type: t.private ? 'private' : 'stream',
          to: t.private ? JSON.stringify([Number(t.id)]) : t.id,
          topic: t.private ? undefined : topic,
          content: text(f)
        })
      );

      return messageId(r, r.id);
    }),
    'me.info': () => request('/users/me'),
    'user.info': (p: any) => request(`/users/${p.UserId ?? p.params?.userId}`),
    'member.list': () => request('/users'),
    'channel.list': () => request('/users/me/subscriptions'),
    'channel.info': (p: any) => request(`/streams/${p.ChannelId}`),
    'message.get': (p: any) => request(`/messages/${p.MessageId}`),
    'message.delete': (p: any) => request(`/messages/${p.MessageId}`, 'DELETE'),
    'message.edit': (p: any) => request(`/messages/${p.MessageId}`, 'PATCH', { content: text(p.params?.format), topic: p.params?.topic }),
    'reaction.add': (p: any) => request(`/messages/${p.MessageId}/reactions`, 'POST', { emoji_name: p.EmojiId }),
    'reaction.remove': (p: any) => request(`/messages/${p.MessageId}/reactions`, 'DELETE', { emoji_name: p.EmojiId }),
    'history.list': (p: any) =>
      request('/messages', 'GET', {
        anchor: p.params?.before ?? 'newest',
        num_before: p.params?.limit ?? 20,
        num_after: 0,
        narrow: JSON.stringify([{ operator: 'stream', operand: p.ChannelId }])
      })
  };
  const poll = async () => {
    let last = queue.last_event_id;

    while (true) {
      if (!running) {
        break;
      }
      try {
        const r = check(await client.events.retrieve({ queue_id: queue.queue_id, last_event_id: last, dont_block: false }));

        if (!running) {
          break;
        }
        for (const e of r.events ?? []) {
          if (e.type === 'message' && String(e.message.sender_id) !== bot) {
            const m = e.message;

            ctx.emit({
              user: String(m.sender_id),
              username: m.sender_full_name,
              id: String(m.id),
              channel: m.type === 'stream' ? String(m.stream_id) : undefined,
              private: m.type !== 'stream',
              text: m.content,
              raw: m
            });
          }
          last = Math.max(last, e.id);
        }
      } catch {
        if (!running) {
          break;
        }
        ctx.state('reconnecting');
        await new Promise(r => setTimeout(r, 1000));
        queue = check(await client.queues.register({ event_types: ['message'], apply_markdown: false }));
        last = queue.last_event_id;
      }
    }
  };

  return {
    client,
    actions,
    start: async () => {
      const me = await request('/users/me');

      bot = String(me.user_id);
      queue = check(await client.queues.register({ event_types: ['message'], apply_markdown: false }));
      running = true;
      task = poll();
      task.catch(() => ctx.state('failed'));
      ctx.ready(bot);
    },
    stop: async () => {
      running = false;
      if (queue) {
        await client.queues.deregister({ queue_id: queue.queue_id });
      }
    }
  };
}

import { App } from '@slack/bolt';
import { bytes, messageId, isContextTarget, required, withMedia, sendActions, text, type Context } from './utils.js';

export function createDriver(ctx: Context, SDK: any = { App }) {
  const c = ctx.config;

  required(c, 'bot_token', 'app_token');
  const app = new SDK.App({ token: c.bot_token, appToken: c.app_token, socketMode: true });
  const client = app.client;
  let bot = '';

  app.event('message', ({ event }: any) => {
    if (event.bot_id || event.subtype === 'bot_message') {
      return;
    }
    if (event.subtype === 'message_deleted') {
      return ctx.emit({
        name: 'message.delete',
        user: event.previous_message?.user,
        id: event.deleted_ts,
        channel: event.channel,
        raw: event
      });
    }
    const m = event.subtype === 'message_changed' ? event.message : event;

    if (!m.user) {
      return;
    }
    ctx.emit({
      name: event.subtype === 'message_changed' ? 'message.update' : undefined,
      user: m.user,
      id: m.ts,
      channel: event.channel,
      private: event.channel_type === 'im',
      target: { scope: event.channel_type === 'im' ? 'direct' : 'channel', targetId: event.channel },
      text: m.text,
      reply: m.thread_ts,
      atMe: Boolean(bot && m.text?.includes(`<@${bot}>`)),
      media: m.files?.map((f: any) => ({ Type: f.mimetype?.startsWith('image/') ? 'image' : 'file', FileId: f.id, FileName: f.name })),
      raw: event
    });
  });
  app.action(/.*/, async ({ ack, body, action }: any) => {
    await ack();
    ctx.emit({
      name: 'interaction.create',
      user: body.user.id,
      id: body.trigger_id,
      channel: body.channel?.id,
      text: action.value ?? action.action_id,
      interaction: action,
      raw: body
    });
  });
  for (const [native, name] of [
    ['member_joined_channel', 'member.add'],
    ['member_left_channel', 'member.remove']
  ]) {
    app.event(native, ({ event }: any) => ctx.emit({ name, user: event.user, channel: event.channel, raw: event }));
  }
  for (const [native, name] of [
    ['reaction_added', 'reaction.add'],
    ['reaction_removed', 'reaction.remove']
  ]) {
    app.event(native, ({ event }: any) =>
      ctx.emit({
        name,
        user: event.user,
        id: `${event.event_ts}:${event.reaction}`,
        channel: event.item?.channel,
        interaction: event.reaction,
        raw: event
      })
    );
  }
  const channel = async (target: any) =>
    target.private && target.scope !== 'direct' ? (await client.conversations.open({ users: target.id })).channel.id : target.id;
  const send = async (target: any, format: any[], p: any) => {
    const ch = await channel(target);
    const results = [];
    const buttons = format.filter(n => ['ButtonGroup', 'BT.group'].includes(n.type));
    const content = format.filter(n => !['Image', 'ImageURL', 'ImageFile', 'Attachment', 'Audio', 'Video', 'ButtonGroup', 'BT.group'].includes(n.type));
    const blocks = buttons.flatMap(group =>
      group.value.map((row: any) => ({
        type: 'actions',
        elements: row.value.map((b: any, index: number) => ({
          type: 'button',
          text: { type: 'plain_text', text: b.value },
          action_id: `alemon_${index}`,
          ...(b.options?.type === 'link' ? { url: b.options.data } : { value: b.options?.data ?? b.value })
        }))
      }))
    );

    if (content.length || blocks.length) {
      const r = await client.chat.postMessage({
        channel: ch,
        text: text(content) || '操作',
        blocks: blocks.length ? [{ type: 'section', text: { type: 'mrkdwn', text: text(content) || '操作' } }, ...blocks] : undefined,
        thread_ts: p.params?.replyId ?? (isContextTarget(p, target) ? p.event?.value?.thread_ts : undefined)
      });

      results.push(messageId(r, r.ts));
    }
    for (const n of format.filter(n => !content.includes(n) && !buttons.includes(n))) {
      const r = await client.files.uploadV2({
        channel_id: ch,
        file: await bytes(n.value),
        filename: n.options?.filename ?? 'upload',
        thread_ts: p.params?.replyId
      });

      if (!r.ok) {
        throw new Error('Slack upload failed');
      }
      results.push({ value: r });
    }
    if (!results.length) {
      throw new Error('Empty message');
    }

    return results.length === 1 ? results[0] : results;
  };
  const actions = {
    ...sendActions(send),
    'me.info': () => client.auth.test(),
    'user.info': (p: any) => client.users.info({ user: p.UserId ?? p.params?.userId }),
    'channel.info': (p: any) => client.conversations.info({ channel: p.ChannelId }),
    'channel.list': (p: any) => client.conversations.list({ types: 'public_channel,private_channel', cursor: p.params?.after, limit: p.params?.limit }),
    'channel.create': (p: any) => client.conversations.create({ name: p.params.name, is_private: p.params.type === 'private' }),
    'channel.update': (p: any) => client.conversations.rename({ channel: p.ChannelId, name: p.params.name }),
    'guild.leave': (p: any) => client.conversations.leave({ channel: p.GuildId }),
    'member.list': (p: any) => client.conversations.members({ channel: p.GuildId, cursor: p.params?.after, limit: p.params?.limit }),
    'member.kick': (p: any) => client.conversations.kick({ channel: p.GuildId, user: p.UserId }),
    'history.list': (p: any) =>
      client.conversations.history({ channel: p.ChannelId, latest: p.params?.before, oldest: p.params?.after, limit: p.params?.limit }),
    'message.edit': (p: any) => client.chat.update({ channel: p.ChannelId, ts: p.MessageId, text: text(p.params?.format) }),
    'message.delete': (p: any) => client.chat.delete({ channel: p.ChannelId ?? p.event?.ChannelId, ts: p.MessageId }),
    'message.pin': (p: any) => client.pins.add({ channel: p.ChannelId, timestamp: p.MessageId }),
    'message.unpin': (p: any) => client.pins.remove({ channel: p.ChannelId, timestamp: p.MessageId }),
    'reaction.add': (p: any) => client.reactions.add({ channel: p.ChannelId, timestamp: p.MessageId, name: p.EmojiId }),
    'reaction.remove': (p: any) => client.reactions.remove({ channel: p.ChannelId, timestamp: p.MessageId, name: p.EmojiId }),
    'reaction.list': (p: any) => client.reactions.get({ channel: p.ChannelId, timestamp: p.MessageId })
  };

  return {
    client,
    actions: withMedia(actions),
    start: async () => {
      const r = await client.auth.test();

      bot = r.user_id;
      await app.start();
      ctx.ready(bot);
    },
    stop: () => app.stop()
  };
}

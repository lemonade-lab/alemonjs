import * as line from '@line/bot-sdk';
import { isContextTarget, required, withMedia, sendActions, text, webhook, messageId, type Context } from './utils.js';

export function createDriver(ctx: Context, SDK: any = line) {
  const c = ctx.config;

  required(c, 'channel_access_token', 'channel_secret');
  const client = new SDK.messagingApi.MessagingApiClient({ channelAccessToken: c.channel_access_token });
  let close: any;
  const messages = (format: any[]) =>
    format.map(n => {
      if (['Text', 'Markdown', 'MarkdownOriginal', 'Link', 'Mention'].includes(n.type)) {
        return { type: 'text', text: text([n]) };
      }
      if (['Image', 'ImageURL'].includes(n.type) && /^https:\/\//.test(n.value)) {
        return { type: 'image', originalContentUrl: n.value, previewImageUrl: n.value };
      }
      if (n.type === 'ButtonGroup' || n.type === 'BT.group') {
        const actions = n.value
          .flatMap((r: any) => r.value)
          .map((b: any) =>
            b.options?.type === 'link'
              ? { type: 'uri', label: b.value, uri: b.options.data }
              : { type: 'postback', label: b.value, data: b.options?.data ?? b.value }
          );

        if (!actions.length || actions.length > 4) {
          throw new Error('LINE buttons template supports 1–4 buttons');
        }

        return { type: 'template', altText: '操作', template: { type: 'buttons', text: '请选择', actions } };
      }
      throw new Error(`LINE ${n.type} requires native SDK message options`);
    });
  const actions = {
    ...sendActions(async (t, f, p) => {
      const ms = messages(f);

      if (!ms.length || ms.length > 5) {
        throw new Error('LINE requires 1–5 messages');
      }
      const token = isContextTarget(p, t) ? p.event?.value?.replyToken : undefined;
      const r = token ? await client.replyMessage({ replyToken: token, messages: ms }) : await client.pushMessage({ to: t.id, messages: ms });

      return messageId(r, r.sentMessages?.[0]?.id);
    }),
    'me.info': () => client.getBotInfo(),
    'user.info': (p: any) => client.getProfile(p.UserId ?? p.params?.userId),
    'guild.info': (p: any) => client.getGroupSummary(p.GuildId),
    'member.info': (p: any) => client.getGroupMemberProfile(p.params.guildId, p.params.userId),
    'member.list': (p: any) => client.getGroupMembersIds(p.GuildId, p.params?.after),
    'guild.leave': (p: any) => client.leaveGroup(p.GuildId)
  };

  return {
    client,
    actions: withMedia(actions, ['image']),
    start: async () => {
      close = await webhook(c.callback ?? {}, (req, raw) => {
        if (req.method !== 'POST') {
          return { status: 405 };
        }
        if (!SDK.validateSignature(raw, c.channel_secret, String(req.headers['x-line-signature'] ?? ''))) {
          return { status: 401 };
        }
        const body = JSON.parse(raw.toString());

        for (const e of body.events ?? []) {
          const s = e.source ?? {};
          const m = e.message ?? {};
          const group = s.groupId ?? s.roomId;

          if (e.type === 'message') {
            ctx.emit({
              user: s.userId,
              id: e.webhookEventId ?? m.id,
              channel: group,
              private: s.type === 'user',
              text: m.text ?? '',
              reply: m.quotedMessageId,
              media: m.type !== 'text' ? [{ Type: ['image', 'audio', 'video'].includes(m.type) ? m.type : 'file', FileId: m.id, FileName: m.fileName }] : [],
              raw: e
            });
          } else if (e.type === 'postback') {
            ctx.emit({
              name: 'interaction.create',
              user: s.userId,
              id: e.webhookEventId,
              channel: group,
              private: s.type === 'user',
              text: e.postback.data,
              interaction: e.postback,
              raw: e
            });
          } else if (['memberJoined', 'memberLeft'].includes(e.type)) {
            for (const u of (e.joined ?? e.left)?.members ?? []) {
              ctx.emit({ name: e.type === 'memberJoined' ? 'member.add' : 'member.remove', user: u.userId, channel: group, raw: e });
            }
          }
        }

        return { body: {} };
      });
      const bot = await client.getBotInfo();

      ctx.ready(bot.userId);
    },
    stop: () => close?.()
  };
}

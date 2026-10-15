import { chat } from '@googleapis/chat';
import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import { isContextTarget, required, withMedia, sendActions, text, webhook, messageId, type Context } from './utils.js';

export function createDriver(ctx: Context, SDK: any = { chat, GoogleAuth, OAuth2Client }) {
  const c = ctx.config;

  required(c, 'audience', 'service_account_email');
  const auth = new SDK.GoogleAuth({ keyFile: c.key_file, scopes: ['https://www.googleapis.com/auth/chat.bot'] });
  const client = SDK.chat({ version: 'v1', auth });
  const verifier = new SDK.OAuth2Client();
  let close: any;
  const encode = (format: any[]) => {
    const widgets = [];
    const content = [];

    for (const node of format) {
      if (['Image', 'ImageURL'].includes(node.type) && /^https:\/\//.test(node.value)) {
        widgets.push({ image: { imageUrl: node.value } });
      } else if (['ButtonGroup', 'BT.group'].includes(node.type)) {
        widgets.push({
          buttonList: {
            buttons: node.value
              .flatMap((r: any) => r.value)
              .map((b: any) => ({
                text: b.value,
                onClick:
                  b.options?.type === 'link'
                    ? { openLink: { url: b.options.data } }
                    : { action: { function: 'alemon', parameters: [{ key: 'data', value: b.options?.data ?? b.value }] } }
              }))
          }
        });
      } else {
        content.push(node);
      }
    }

    return { text: text(content), ...(widgets.length ? { cardsV2: [{ cardId: 'alemon', card: { sections: [{ widgets }] } }] } : {}) };
  };
  const actions = {
    ...sendActions(async (t, f, p) => {
      let space =
        (isContextTarget(p, t) ? p.event?.ChannelId ?? p.event?.value?.space?.name : undefined) ?? (t.scope === 'direct' || !t.private ? t.id : undefined);

      if (!space && t.private) {
        space = (await client.spaces.findDirectMessage({ name: t.id.startsWith('users/') ? t.id : `users/${t.id}` })).data.name;
      }

      if (!space) {
        throw new Error('Google Chat requires a spaces/… ID; use an explicit channel/direct target');
      }
      const r = await client.spaces.messages.create({
        parent: space,
        requestBody: { ...encode(f), thread: p.params?.replyId ? { name: p.params.replyId } : undefined },
        messageReplyOption: p.params?.replyId ? 'REPLY_MESSAGE_OR_FAIL' : undefined
      });

      return messageId(r.data, r.data.name);
    }),
    'channel.info': async (p: any) => (await client.spaces.get({ name: p.ChannelId })).data,
    'channel.list': async (p: any) => (await client.spaces.list({ pageSize: p.params?.limit, pageToken: p.params?.after })).data,
    'member.list': async (p: any) => (await client.spaces.members.list({ parent: p.GuildId, pageSize: p.params?.limit, pageToken: p.params?.after })).data,
    'message.get': async (p: any) => (await client.spaces.messages.get({ name: p.MessageId })).data,
    'message.delete': async (p: any) => (await client.spaces.messages.delete({ name: p.MessageId })).data,
    'message.edit': async (p: any) =>
      (await client.spaces.messages.patch({ name: p.MessageId, updateMask: 'text', requestBody: { text: text(p.params?.format) } })).data,
    'history.list': async (p: any) => (await client.spaces.messages.list({ parent: p.ChannelId, pageSize: p.params?.limit, pageToken: p.params?.after })).data
  };

  return {
    client,
    actions: withMedia(actions, ['image']),
    start: async () => {
      close = await webhook(c.callback ?? {}, async (req, raw) => {
        if (req.method !== 'POST') {
          return { status: 405 };
        }
        try {
          const header = String(req.headers.authorization ?? '');

          if (!header.startsWith('Bearer ')) {
            return { status: 401 };
          }
          const ticket = await verifier.verifyIdToken({ idToken: header.slice(7), audience: c.audience });
          const identity = ticket.getPayload();

          if (!identity?.email_verified || identity.email !== c.service_account_email) {
            return { status: 401 };
          }
        } catch {
          return { status: 401 };
        }
        const e = JSON.parse(raw.toString());
        const m = e.message ?? {};
        const u = e.user ?? m.sender;

        if (e.type === 'MESSAGE') {
          ctx.emit({
            user: u?.name,
            username: u?.displayName,
            id: m.name,
            channel: e.space?.name,
            private: e.space?.type === 'DM',
            target: { scope: e.space?.type === 'DM' ? 'direct' : 'channel', targetId: e.space?.name },
            text: m.argumentText ?? m.text,
            reply: m.thread?.name,
            raw: e
          });
        }
        if (e.type === 'CARD_CLICKED') {
          ctx.emit({
            name: 'interaction.create',
            user: u?.name,
            id: e.eventTime,
            channel: e.space?.name,
            private: e.space?.type === 'DM',
            target: { scope: e.space?.type === 'DM' ? 'direct' : 'channel', targetId: e.space?.name },
            text: e.action?.parameters?.find((p: any) => p.key === 'data')?.value ?? e.action?.actionMethodName,
            interaction: e.action,
            raw: e
          });
        }

        return { body: {} };
      });
      ctx.ready(c.bot_id);
    },
    stop: () => close?.()
  };
}

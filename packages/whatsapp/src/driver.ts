import { bytes, equal, hmac, messageId, mimeType, required, RestClient, withMedia, sendActions, text, webhook, type Context } from './utils.js';
/** whatsapp messaging transport using the official Graph API. */
export function createDriver(ctx: Context) {
  const c = ctx.config;

  required(c, 'access_token', 'app_secret', 'verify_token', 'api_version', 'phone_number_id');
  if (!/^v\d+\.\d+$/.test(c.api_version)) {
    throw new Error('Invalid Graph API version');
  }
  const account = c.phone_number_id;
  const host = 'https://graph.facebook.com';
  const client = new RestClient(`${host}/${c.api_version}/`, { Authorization: `Bearer ${c.access_token}` });
  let close: any;
  const encode = async (n: any) => {
    if (['Text', 'Markdown', 'MarkdownOriginal', 'Link', 'Mention'].includes(n.type)) {
      return { type: 'text', text: { body: text([n]), preview_url: false } };
    }
    if (['ButtonGroup', 'BT.group'].includes(n.type)) {
      const buttons = n.value.flatMap((r: any) => r.value);

      if (!buttons.length || buttons.length > 3) {
        throw new Error('Invalid number of Meta reply buttons');
      }
      if (buttons.some((b: any) => b.options?.type === 'link')) {
        throw new Error('URL buttons require a native Meta template');
      }

      return {
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: '请选择' },
          action: { buttons: buttons.map((b: any) => ({ type: 'reply', reply: { id: b.options?.data ?? b.value, title: b.value } })) }
        }
      };
    }
    const type = n.type.startsWith('Image')
      ? 'image'
      : n.type === 'Audio'
      ? 'audio'
      : n.type === 'Video'
      ? 'video'
      : n.type === 'Attachment'
      ? 'document'
      : undefined;

    if (!type) {
      throw new Error(`whatsapp: unsupported content ${n.type}`);
    }
    if (!/^https:\/\//.test(n.value)) {
      const data = await bytes(n.value);
      const filename = n.options?.filename ?? (type === 'image' ? 'image.jpg' : type === 'audio' ? 'audio.mp3' : type === 'video' ? 'video.mp4' : 'upload');
      const form = new FormData();

      form.append('messaging_product', 'whatsapp');
      form.append('file', new Blob([new Uint8Array(data)], { type: mimeType(data, filename) }), filename);
      const r = await client.request(`${account}/media`, 'POST', form);
      const id = r.id;

      if (!id) {
        throw new Error('Meta upload response missing ID');
      }

      return { type, [type]: { id, ...(type === 'document' ? { filename } : {}) } };
    }

    return { type, [type]: { link: n.value, ...(type === 'document' && n.options?.filename ? { filename: n.options.filename } : {}) } };
  };
  const actions: any = {
    ...sendActions(
      async (t, f, p) => {
        if (!t.private) {
          throw new Error('whatsapp messaging requires a private user target');
        }
        if (!f.length) {
          throw new Error('Empty message');
        }
        const messages = [];

        for (const node of f) {
          messages.push(await encode(node));
        }
        const results = [];

        for (const m of messages) {
          const body = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: t.id,
            ...m,
            ...(p.params?.replyId ? { context: { message_id: p.params.replyId } } : {})
          };
          const r = await client.request(`${account}/messages`, 'POST', body);

          results.push(messageId(r, r.messages?.[0]?.id));
        }

        return results.length === 1 ? results[0] : results;
      },
      { channel: false }
    ),
    'me.info': () => client.request(`${account}`)
  };

  actions['reaction.add'] = (p: any) =>
    client.request(`${account}/messages`, 'POST', {
      messaging_product: 'whatsapp',
      to: p.UserId ?? p.event?.UserId,
      type: 'reaction',
      reaction: { message_id: p.MessageId, emoji: p.EmojiId }
    });

  return {
    client,
    actions: withMedia(actions),
    start: async () => {
      close = await webhook(c.callback ?? {}, (req, raw) => {
        const query = new URL(req.url ?? '/', 'http://localhost').searchParams;

        if (req.method === 'GET') {
          return query.get('hub.mode') === 'subscribe' && equal(query.get('hub.verify_token') ?? '', c.verify_token)
            ? { body: query.get('hub.challenge') ?? '' }
            : { status: 403 };
        }
        if (req.method !== 'POST') {
          return { status: 405 };
        }
        if (!equal(String(req.headers['x-hub-signature-256'] ?? ''), `sha256=${hmac(c.app_secret, raw)}`)) {
          return { status: 401 };
        }
        const body = JSON.parse(raw.toString());

        for (const entry of body.entry ?? []) {
          for (const change of entry.changes ?? []) {
            const value = change.value ?? {};

            if (String(value.metadata?.phone_number_id) !== String(account)) {
              continue;
            }
            for (const m of value.messages ?? []) {
              const media = m[m.type];

              ctx.emit({
                name: m.interactive || m.button ? 'interaction.create' : undefined,
                user: m.from,
                username: value.contacts?.find((u: any) => u.wa_id === m.from)?.profile?.name,
                id: m.id,
                private: true,
                text: m.text?.body ?? m.button?.payload ?? m.button?.text ?? m.interactive?.button_reply?.id ?? m.interactive?.list_reply?.id ?? '',
                reply: m.context?.id,
                interaction: m.interactive ?? m.button,
                media: ['image', 'audio', 'video', 'document', 'sticker'].includes(m.type)
                  ? [
                      {
                        Type: m.type === 'document' ? 'file' : m.type,
                        FileId: media.id,
                        MimeType: media.mime_type,
                        FileName: media.filename
                      }
                    ]
                  : [],
                raw: m
              });
            }
          }
        }

        return { body: 'EVENT_RECEIVED' };
      });
      ctx.ready(String(account));
    },
    stop: () => close?.()
  };
}

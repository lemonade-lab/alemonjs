import { bytes, equal, hmac, messageId, mimeType, required, RestClient, withMedia, sendActions, text, webhook, type Context } from './utils.js';
/** messenger messaging transport using the official Graph API. */
export function createDriver(ctx: Context) {
  const c = ctx.config;

  required(c, 'access_token', 'app_secret', 'verify_token', 'api_version', 'account_id');
  if (!/^v\d+\.\d+$/.test(c.api_version)) {
    throw new Error('Invalid Graph API version');
  }
  const account = c.account_id;
  const host = 'https://graph.facebook.com';
  const client = new RestClient(`${host}/${c.api_version}/`, { Authorization: `Bearer ${c.access_token}` });
  let close: any;
  const encode = async (n: any) => {
    if (['Text', 'Markdown', 'MarkdownOriginal', 'Link', 'Mention'].includes(n.type)) {
      return { text: text([n]) };
    }
    if (['ButtonGroup', 'BT.group'].includes(n.type)) {
      const buttons = n.value.flatMap((r: any) => r.value);

      if (!buttons.length || buttons.length > 13) {
        throw new Error('Invalid number of Meta reply buttons');
      }
      if (buttons.some((b: any) => b.options?.type === 'link')) {
        throw new Error('URL buttons require a native Meta template');
      }

      return {
        text: '请选择',
        quick_replies: buttons.map((b: any) => ({ content_type: 'text', title: b.value, payload: b.options?.data ?? b.value }))
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
      throw new Error(`messenger: unsupported content ${n.type}`);
    }
    if (!/^https:\/\//.test(n.value)) {
      const data = await bytes(n.value);
      const filename = n.options?.filename ?? (type === 'image' ? 'image.jpg' : type === 'audio' ? 'audio.mp3' : type === 'video' ? 'video.mp4' : 'upload');
      const form = new FormData();

      form.append('message', JSON.stringify({ attachment: { type: type === 'document' ? 'file' : type, payload: { is_reusable: true } } }));
      form.append('filedata', new Blob([new Uint8Array(data)], { type: mimeType(data, filename) }), filename);
      const r = await client.request(`${account}/message_attachments`, 'POST', form);
      const id = r.attachment_id;

      if (!id) {
        throw new Error('Meta upload response missing ID');
      }

      return { attachment: { type: type === 'document' ? 'file' : type, payload: { attachment_id: id } } };
    }

    return { attachment: { type: type === 'document' ? 'file' : type, payload: { url: n.value, is_reusable: true } } };
  };
  const actions: any = {
    ...sendActions(
      async (t, f) => {
        if (!t.private) {
          throw new Error('messenger messaging requires a private user target');
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
          const body = { recipient: { id: t.id }, message: m, messaging_type: 'RESPONSE' };
          const r = await client.request(`${account}/messages`, 'POST', body);

          results.push(messageId(r, r.message_id));
        }

        return results.length === 1 ? results[0] : results;
      },
      { channel: false }
    ),
    'me.info': () => client.request(`${account}`)
  };

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
          if (String(entry.id) !== String(account)) {
            continue;
          }
          for (const e of entry.messaging ?? []) {
            if (e.message?.is_echo || e.sender?.id === account) {
              continue;
            }
            if (e.message || e.postback) {
              ctx.emit({
                name: e.postback || e.message?.quick_reply ? 'interaction.create' : undefined,
                user: e.sender?.id,
                id: e.message?.mid ?? e.postback?.mid ?? `${e.timestamp}:${e.sender?.id}`,
                private: true,
                text: e.message?.quick_reply?.payload ?? e.message?.text ?? e.postback?.payload ?? '',
                reply: e.message?.reply_to?.mid,
                interaction: e.postback ?? e.message?.quick_reply,
                media: e.message?.attachments?.map((a: any) => ({
                  Type: ['image', 'audio', 'video'].includes(a.type) ? a.type : 'file',
                  Url: a.payload?.url
                })),
                raw: e
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

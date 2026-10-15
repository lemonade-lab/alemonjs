import wechat from 'wechat';
import WechatAPI from 'wechat-api';
import WXBizMsgCrypt from 'wechat-crypto';
import { XMLParser } from 'fast-xml-parser';
import { equal, required, sendActions, text, webhook, temporaryMedia, withMedia, type Context } from './utils.js';

export function createDriver(ctx: Context, SDK: any = { wechat, WechatAPI }) {
  const c = ctx.config;

  required(c, 'app_id', 'app_secret', 'token');
  const api = new SDK.WechatAPI(c.app_id, c.app_secret);
  const client = new Proxy(api, {
    get(target, key) {
      const value = target[key];

      if (typeof value !== 'function') {
        return value;
      }

      return (...args: any[]) =>
        new Promise((resolve, reject) => {
          value.call(target, ...args, (error: any, result: any) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          });
        });
    }
  });
  let close: any;
  const cryptor = c.encoding_aes_key ? new WXBizMsgCrypt(c.token, c.encoding_aes_key, c.app_id) : undefined;
  const parser = new XMLParser({ parseTagValue: false, processEntities: false });
  const middleware = SDK.wechat({ token: c.token, appid: c.app_id, encodingAESKey: c.encoding_aes_key, checkSignature: true }, (req: any, res: any) => {
    const e = req.weixin;
    const event = e.MsgType === 'event';

    ctx.emit({
      name: event ? 'private.notice.create' : undefined,
      user: e.FromUserName,
      bot: e.ToUserName,
      id: e.MsgId ?? `${e.FromUserName}:${e.CreateTime}:${e.Event}`,
      private: true,
      text: e.Content ?? e.Recognition ?? e.EventKey ?? '',
      media: ['image', 'voice', 'video', 'shortvideo'].includes(e.MsgType)
        ? [{ Type: e.MsgType === 'voice' ? 'audio' : e.MsgType === 'shortvideo' ? 'video' : e.MsgType, FileId: e.MediaId, Url: e.PicUrl }]
        : [],
      raw: e
    });
    res.end('success');
  });
  const actions = {
    ...sendActions(
      async (t, f) => {
        if (!t.private) {
          throw new Error('WeChat official accounts only message OpenID users');
        }
        const prepared = [];

        for (const n of f) {
          if (['Image', 'ImageURL', 'ImageFile', 'Audio'].includes(n.type)) {
            const type = n.type === 'Audio' ? 'voice' : 'image';
            const file = await temporaryMedia(n.value, n.options?.filename ?? (type === 'voice' ? 'audio.amr' : 'image.jpg'));

            try {
              const media: any = await client.uploadMedia(file.path, type);

              if (!media.media_id) {
                throw new Error('WeChat upload missing media_id');
              }
              prepared.push({ type, id: media.media_id });
            } finally {
              await file.dispose();
            }
          } else {
            prepared.push({ type: 'text', content: text([n]) });
          }
        }
        if (!prepared.length) {
          throw new Error('Empty message');
        }
        const results = [];

        for (const m of prepared) {
          const r: any =
            m.type === 'image'
              ? await client.sendImage(t.id, m.id)
              : m.type === 'voice'
              ? await client.sendVoice(t.id, m.id)
              : await client.sendText(t.id, m.content);

          if (r.errcode !== 0) {
            throw new Error(`WeChat: ${r.errmsg}`);
          }
          results.push({ value: r });
        }

        return results.length === 1 ? results[0] : results; // Customer service API has no message ID.
      },
      { channel: false }
    ),
    'user.info': (p: any) => client.getUser(p.UserId ?? p.params?.userId),
    'me.friends': (p: any) => client.getFollowers(p.params?.after)
  };

  return {
    client,
    actions: withMedia(actions, ['image', 'audio']),
    start: async () => {
      close = await webhook(
        c.callback ?? {},
        (req, raw) =>
          new Promise((resolve, reject) => {
            (req as any).rawBody = raw.toString();
            (req as any).query = Object.fromEntries(new URL(req.url ?? '/', 'http://localhost').searchParams);
            const query = (req as any).query;

            // node-webot's encrypted handshake has a receiver-ID TODO. Verify it here
            // before delegating the validated request to its message middleware.
            if (query.encrypt_type === 'aes' || query.msg_signature) {
              if (!cryptor) {
                resolve({ status: 401 });

                return;
              }
              const encrypted = req.method === 'GET' ? query.echostr : parser.parse(raw.toString())?.xml?.Encrypt;

              if (!encrypted || !equal(query.msg_signature ?? '', cryptor.getSignature(query.timestamp, query.nonce, encrypted))) {
                resolve({ status: 401 });

                return;
              }
              const decoded = cryptor.decrypt(encrypted);

              if (decoded.id !== c.app_id) {
                resolve({ status: 401 });

                return;
              }
            } else if (cryptor && c.encryption_mode !== 'compatible') {
              resolve({ status: 401 });

              return;
            }
            const response: any = {
              statusCode: 200,
              headers: {},
              setHeader(key: string, value: string) {
                this.headers[key.toLowerCase()] = value;
              },
              writeHead(code: number, headers: any = {}) {
                this.statusCode = code;
                Object.assign(this.headers, headers);
              },
              end(body: any) {
                resolve({ status: this.statusCode, body: body ?? '', type: this.headers['content-type'] ?? 'text/plain' });
              }
            };

            middleware(req, response, (error: any) => (error ? reject(error) : resolve({ status: 400 })));
          })
      );
      ctx.ready(c.app_id);
    },
    stop: () => close?.()
  };
}

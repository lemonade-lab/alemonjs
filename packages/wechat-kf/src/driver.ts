import WXBizMsgCrypt from 'wechat-crypto';
import { XMLParser } from 'fast-xml-parser';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { bytes, equal, mimeType, required, RestClient, sendActions, text, webhook, withMedia, type Context } from './utils.js';

export function createDriver(ctx: Context, SDK: any = { WXBizMsgCrypt, XMLParser }) {
  const c = ctx.config;

  required(c, 'corp_id', 'secret', 'token', 'encoding_aes_key');
  const crypto = new SDK.WXBizMsgCrypt(c.token, c.encoding_aes_key, c.corp_id);
  const parser = new SDK.XMLParser({ parseTagValue: false, processEntities: false });
  const api = new RestClient('https://qyapi.weixin.qq.com/cgi-bin/');
  const statePath = resolve(c.state_path ?? `./data/wechat-kf/${encodeURIComponent(c.corp_id)}.json`);
  let state: { cursors: Record<string, string>; pending: { openKfid: string; syncToken?: string }[] } = { cursors: {}, pending: [] };
  let writes = Promise.resolve();
  const save = () => {
    const snapshot = JSON.stringify(state);

    writes = writes
      .catch(() => {})
      .then(async () => {
        await mkdir(dirname(statePath), { recursive: true });
        const temporary = `${statePath}.${randomUUID()}.tmp`;

        await writeFile(temporary, snapshot, { mode: 0o600 });
        await rename(temporary, statePath);
      });

    return writes;
  };
  let running = false;
  let task: Promise<void> | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let token = '';
  let expiry = 0;
  let close: any;
  const request = async (path: string, method = 'POST', body?: any) => {
    if (expiry <= Date.now()) {
      const r = await api.request(`gettoken?corpid=${encodeURIComponent(c.corp_id)}&corpsecret=${encodeURIComponent(c.secret)}`);

      if (!r.access_token) {
        throw new Error('WeChat KF token missing');
      }
      token = r.access_token;
      expiry = Date.now() + (r.expires_in - 60) * 1000;
    }

    return api.request(`${path}${path.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`, method, body);
  };
  const client = {
    request,
    idle: async () => {
      await task;
    },
    sync: async (openKfid: string, syncToken?: string) => {
      let more = true;

      while (more) {
        const r = await request('kf/sync_msg', 'POST', {
          cursor: state.cursors[openKfid] ?? '',
          token: syncToken,
          limit: 1000,
          voice_format: 0,
          open_kfid: openKfid
        });

        if (!running || ctx.active?.() === false) {
          throw new Error('WeChat KF stopping before checkpoint');
        }
        for (const m of r.msg_list ?? []) {
          if (m.origin !== 3) {
            continue;
          } // Only customer-origin messages; no outgoing echo loops.
          const media = m[m.msgtype];

          ctx.emit({
            user: m.external_userid,
            bot: m.open_kfid ?? openKfid,
            id: m.msgid,
            private: true,
            text: m.text?.content ?? '',
            media: ['image', 'voice', 'video', 'file'].includes(m.msgtype)
              ? [{ Type: m.msgtype === 'voice' ? 'audio' : m.msgtype, FileId: media.media_id }]
              : [],
            raw: m
          });
        }
        more = r.has_more === 1;
        if (more && (!r.next_cursor || r.next_cursor === state.cursors[openKfid])) {
          throw new Error('WeChat KF pagination cursor did not advance');
        }
        if (r.next_cursor) {
          state.cursors[openKfid] = r.next_cursor;
          await save();
        }
      }
    }
  };
  const actions = {
    ...sendActions(
      async (t, f, p) => {
        if (!t.private) {
          throw new Error('WeChat KF messages require external_userid');
        }
        const openKfid = t.bot ?? p.event?.value?.open_kfid ?? c.open_kfid;

        if (!openKfid) {
          throw new Error('WeChat KF requires BotId/open_kfid');
        }
        const prepared = [];

        for (const n of f) {
          const type = n.type.startsWith('Image')
            ? 'image'
            : n.type === 'Audio'
            ? 'voice'
            : n.type === 'Video'
            ? 'video'
            : n.type === 'Attachment'
            ? 'file'
            : 'text';

          if (type === 'text') {
            prepared.push({ msgtype: 'text', text: { content: text([n]) } });
          } else {
            const data = await bytes(n.value);
            const name = n.options?.filename ?? (type === 'image' ? 'image.jpg' : type === 'voice' ? 'audio.amr' : type === 'video' ? 'video.mp4' : 'upload');
            const form = new FormData();

            form.append('media', new Blob([new Uint8Array(data)], { type: mimeType(data, name) }), name);
            const media = await request(`media/upload?type=${type}`, 'POST', form);

            if (!media.media_id) {
              throw new Error('WeChat KF upload missing media_id');
            }
            prepared.push({ msgtype: type, [type]: { media_id: media.media_id } });
          }
        }
        if (!prepared.length) {
          throw new Error('Empty message');
        }
        const results = [];

        for (const m of prepared) {
          results.push(await request('kf/send_msg', 'POST', { touser: t.id, open_kfid: openKfid, ...m }));
        }

        return results.length === 1 ? results[0] : results;
      },
      { channel: false }
    ),
    'me.info': async (p: any) => {
      const id = p.BotId ?? c.open_kfid;

      if (!id) {
        throw new Error('WeChat KF me.info requires BotId/open_kfid');
      }
      const r = await request('kf/account/list', 'POST', {});
      const account = r.account_list?.find((a: any) => a.open_kfid === id);

      return account ? { UserId: account.open_kfid, UserName: account.name, UserAvatar: account.avatar, value: account } : null;
    },
    'user.info': async (p: any) => {
      const id = p.UserId ?? p.params?.userId;
      const r = await request('kf/customer/batchget', 'POST', { external_userid_list: [id], need_enter_session_context: 1 });

      return r.customer_list?.find((customer: any) => customer.external_userid === id) ?? null;
    }
  };
  // Acknowledge only after persisting the notification; serial workers checkpoint
  // pagination and resume pending work after process restart.
  const drain = () => {
    if (task !== undefined || !running) {
      return;
    }
    task = (async () => {
      while (true) {
        if (!running || !state.pending.length) {
          break;
        }
        const notification = state.pending[0];

        try {
          await client.sync(notification.openKfid, notification.syncToken);
          state.pending.shift();
          await save();
        } catch {
          if (running) {
            ctx.state('reconnecting');
            retry = setTimeout(drain, 5000);
          }
          break;
        }
      }
    })().finally(() => {
      task = undefined;
    });
  };

  return {
    client,
    actions: withMedia(actions),
    start: async () => {
      try {
        const stored = JSON.parse(await readFile(statePath, 'utf8'));

        if (!stored.cursors || typeof stored.cursors !== 'object' || !Array.isArray(stored.pending)) {
          throw new Error('Invalid WeChat KF state');
        }
        state = stored;
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
      running = true;
      close = await webhook(c.callback ?? {}, async (req, raw) => {
        const q = new URL(req.url ?? '/', 'http://localhost').searchParams;

        if (!['GET', 'POST'].includes(req.method ?? '')) {
          return { status: 405 };
        }
        const encrypted = req.method === 'GET' ? q.get('echostr') : parser.parse(raw.toString())?.xml?.Encrypt;

        if (!encrypted || !equal(q.get('msg_signature') ?? '', crypto.getSignature(q.get('timestamp'), q.get('nonce'), encrypted))) {
          return { status: 401 };
        }
        const decoded = crypto.decrypt(encrypted);

        if (decoded.id !== c.corp_id) {
          return { status: 401 };
        }
        if (req.method === 'GET') {
          return { body: decoded.message };
        }
        const event = parser.parse(decoded.message)?.xml;

        if (event?.Event === 'kf_msg_or_event') {
          if (!event.OpenKfId) {
            return { status: 400 };
          }
          if (!state.pending.some(n => n.openKfid === event.OpenKfId && n.syncToken === event.Token)) {
            if (state.pending.length >= 1000) {
              return { status: 503 };
            }
            state.pending.push({ openKfid: event.OpenKfId, syncToken: event.Token });
          }
          await save();
          drain();
        }

        return { body: 'success' };
      });
      ctx.ready(c.open_kfid ?? c.corp_id);
      drain();
    },
    stop: async () => {
      running = false;
      clearTimeout(retry);
      await close?.();
      await task;
      await writes;
    }
  };
}

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { markdownToPlainText } from 'alemonjs/markdown';

export type Config = Record<string, any>;

export type NativeEvent = {
  id?: string;
  user: string;
  username?: string;
  bot?: string;
  channel?: string;
  guild?: string;
  text?: string;
  private?: boolean;
  atMe?: boolean;
  reply?: string;
  media?: any[];
  name?: string;
  interaction?: any;
  raw?: any;
  open?: string;
  target?: { scope: 'group' | 'channel' | 'direct' | 'c2c'; targetId: string };
};

export type Destination = { id: string; private: boolean; bot?: string; scope?: string };

export type Context = {
  platform: string;
  config: Config;
  emit: (event: NativeEvent) => void;
  ready: (bot?: string) => void;
  state: (state: string) => void;
  active?: () => boolean;
};

export type Driver = {
  client: any;
  actions: Record<string, (payload: any) => any>;
  start?: () => Promise<any> | any;
  stop?: () => Promise<any> | any;
  status?: () => string;
};

export function required(config: Config, ...keys: string[]) {
  for (const key of keys) {
    if (config[key] === undefined || config[key] === null || config[key] === '') {
      throw new Error(`Missing configuration: ${key}`);
    }
  }
}

export function destination(payload: any, action = 'message.send'): Destination {
  const event = payload.event ?? {};
  const target = payload.target;

  if (target) {
    if (!['c2c', 'direct', 'group', 'channel'].includes(target.scope) || !target.targetId) {
      throw new Error('Invalid target scope/targetId');
    }

    return {
      id: String(target.targetId),
      private: ['c2c', 'direct'].includes(target.scope),
      bot: target.BotId ?? payload.BotId,
      scope: target.scope
    };
  }
  const privateTarget = action.endsWith('.user') || (action === 'message.send' && Boolean(event.IsPrivate));
  const id = privateTarget ? payload.UserId ?? event.OpenId ?? event.UserId : payload.ChannelId ?? event.ChannelId;

  if (!id) {
    throw new Error('Missing destination');
  }

  return { id: String(id), private: privateTarget, bot: payload.BotId ?? event.BotId, scope: privateTarget ? 'c2c' : 'channel' };
}

export function text(format: any[] = []) {
  return format
    .map(item => {
      switch (item.type) {
        case 'Text':
        case 'MarkdownOriginal':
          return String(item.value);
        case 'Markdown':
          return markdownToPlainText(item.value);
        case 'Link':
          return `${item.value} (${item.options?.link ?? item.value})`;
        case 'Mention':
          return `@${item.value}`;
        default:
          throw new Error(`Content ${item.type} requires a native media/card implementation`);
      }
    })
    .join('');
}

/** Convert the framework structured text surface without silently dropping native-only fields. */
export function messageFormat(params: any = {}): any[] {
  if (params.content === undefined) {
    return params.format ?? [];
  }
  if (params.format !== undefined) {
    throw new Error('Use content or format, not both');
  }
  const content = params.content;

  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    throw new Error('Invalid structured message content');
  }
  if (Object.keys(content).some(key => !['text', 'markdown'].includes(key))) {
    throw new Error('Structured keyboard/media/card requires the platform native API or format encoder');
  }
  const format: any[] = [];

  if (content.text !== undefined) {
    if (typeof content.text !== 'string') {
      throw new Error('Message text must be a string');
    }
    format.push({ type: 'Text', value: content.text });
  }
  if (content.markdown !== undefined) {
    const markdown = content.markdown;

    if (!markdown || typeof markdown.content !== 'string' || Object.keys(markdown).some(key => key !== 'content')) {
      throw new Error('Markdown templates require the platform native API');
    }
    format.push({ type: 'MarkdownOriginal', value: markdown.content });
  }
  if (!format.length) {
    throw new Error('Empty structured message');
  }

  return format;
}

export function sendActions(send: (target: Destination, format: any[], payload: any) => any, scopes: { user?: boolean; channel?: boolean } = {}) {
  return Object.fromEntries(
    ['message.send', 'message.send.channel', 'message.send.user', 'message.send.target']
      .filter(action => !(scopes.user === false && action.endsWith('.user')) && !(scopes.channel === false && action.endsWith('.channel')))
      .map(action => [action, (p: any) => send(destination(p, action), messageFormat(p.params), p)])
  );
}

export async function callNative(client: any, key: string, params: any[] = []) {
  const parts = String(key).split('.');

  if (parts.some(part => !/^[a-zA-Z][a-zA-Z0-9]*$/.test(part) || ['constructor', 'prototype', '__proto__'].includes(part))) {
    throw new Error('Invalid SDK method');
  }
  let owner = client;

  for (const part of parts.slice(0, -1)) {
    owner = owner?.[part];
  }
  const method = owner?.[parts.at(-1)];

  if (typeof method !== 'function') {
    throw new Error(`Unknown SDK method: ${key}`);
  }

  return await method.apply(owner, params);
}

export function safeError(error: any, config: Config) {
  let message = String(error?.message ?? 'Platform request failed');

  for (const [key, value] of Object.entries(config)) {
    if (/token|secret|password|key/i.test(key) && typeof value === 'string' && value.length > 3) {
      message = message.split(value).join('[redacted]');
    }
  }

  return message;
}

export function equal(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);

  return x.length === y.length && timingSafeEqual(x, y);
}

export type Reply = { status?: number; body?: any; type?: string };

export async function webhook(config: Config, handler: (req: IncomingMessage, raw: Buffer) => Promise<Reply> | Reply) {
  const handle = async (req: IncomingMessage, res: ServerResponse) => {
    try {
      if (new URL(req.url ?? '/', 'http://localhost').pathname !== (config.path ?? '/events')) {
        return respond(res, { status: 404, body: 'Not found' });
      }
      const chunks: Buffer[] = [];
      let size = 0;

      for await (const chunk of req) {
        size += chunk.length;
        if (size > 1024 * 1024) {
          return respond(res, { status: 413, body: 'Payload too large' });
        }
        chunks.push(Buffer.from(chunk));
      }
      respond(res, await handler(req, Buffer.concat(chunks)));
    } catch {
      respond(res, { status: 500, body: 'Callback failed' });
    }
  };
  const server = createServer((req, res) => {
    void handle(req, res);
  });

  server.requestTimeout = 15_000;
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.port ?? 18081, config.host ?? '127.0.0.1', resolve);
  });

  return () => new Promise<void>((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
}

function respond(res: ServerResponse, reply: Reply) {
  res.statusCode = reply.status ?? 200;
  res.setHeader('Content-Type', reply.type ?? (typeof reply.body === 'object' ? 'application/json' : 'text/plain'));
  res.end(typeof reply.body === 'object' ? JSON.stringify(reply.body) : String(reply.body ?? 'ok'));
}

export class RestClient {
  constructor(public base: string, public headers: Record<string, string> = {}) {}
  async request(path: string, method = 'GET', body?: any): Promise<any> {
    const base = new URL(this.base.endsWith('/') ? this.base : `${this.base}/`);
    const url = new URL(path.replace(/^\//, ''), base);

    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) {
      throw new Error('API path must stay inside configured base URL');
    }
    const form = body instanceof FormData || body instanceof URLSearchParams;
    const response = await fetch(url, {
      method,
      headers: { ...this.headers, ...(body !== undefined && !form ? { 'Content-Type': 'application/json' } : {}) },
      body: body === undefined ? undefined : form ? body : JSON.stringify(body),
      redirect: 'error',
      signal: AbortSignal.timeout(30_000)
    });
    const value = response.status === 204 ? {} : await response.json();

    if (
      !response.ok ||
      value.error ||
      (value.errcode !== undefined && value.errcode !== 0) ||
      (value.code !== undefined && typeof value.code === 'number' && value.code !== 0) ||
      value.result === 'error'
    ) {
      throw new Error(`API ${response.status}: ${value.error?.message ?? value.errmsg ?? value.msg ?? value.message ?? 'request rejected'}`);
    }

    return value;
  }
}

export async function bytes(source: string, max = 10 * 1024 * 1024) {
  let result: Buffer;

  if (source.startsWith('file://')) {
    const path = fileURLToPath(source);

    if ((await stat(path)).size > max) {
      throw new Error('Media exceeds size limit');
    }
    result = await readFile(path);
  } else if (source.startsWith('base64://')) {
    result = Buffer.from(source.slice(9), 'base64');
  } else {
    if (!/^https?:\/\//.test(source)) {
      throw new Error('Media must use https://, file:// or base64://');
    }
    const response = await fetch(source, { signal: AbortSignal.timeout(30_000) });

    if (!response.ok || Number(response.headers.get('content-length')) > max) {
      throw new Error('Media download rejected');
    }
    const chunks: Uint8Array[] = [];
    let total = 0;

    for await (const chunk of response.body as any) {
      total += chunk.length;
      if (total > max) {
        throw new Error('Media exceeds size limit');
      }
      chunks.push(chunk);
    }
    result = Buffer.concat(chunks);
  }
  if (result.length > max) {
    throw new Error('Media exceeds size limit');
  }

  return result;
}

export function withMedia(actions: Driver['actions'], supported: readonly string[] = ['image', 'audio', 'video', 'file']) {
  for (const action of ['media.send', 'media.send.user', 'media.send.channel', 'file.send.user', 'file.send.channel']) {
    if (actions[action] || (action.startsWith('file.') && !supported.includes('file'))) {
      continue;
    }
    const sendAction = action === 'media.send' ? 'message.send.target' : action.endsWith('.user') ? 'message.send.user' : 'message.send.channel';

    if (!actions[sendAction]) {
      continue;
    }
    actions[action] = (p: any) => {
      const params = p.params ?? {};

      if (params.fileId) {
        throw new Error('Prepared media IDs require the platform native send API');
      }
      const type = action.startsWith('file.') ? 'file' : params.type;
      const types = { image: 'Image', audio: 'Audio', video: 'Video', file: 'Attachment' };

      if (!types[type] || !supported.includes(type)) {
        throw new Error('Invalid media type');
      }
      const source =
        params.url ??
        params.file ??
        (params.filePath ? new URL(`file://${resolve(params.filePath)}`).href : params.data ? `base64://${params.data}` : undefined);

      if (!source) {
        throw new Error('Missing media source');
      }
      const format: any[] = [{ type: types[type], value: source, options: { filename: params.name } }];

      if (params.content) {
        format.unshift({ type: 'Text', value: params.content });
      }

      return actions[sendAction]({ ...p, params: { ...params, format } });
    };
  }

  return actions;
}

export function mimeType(data: Uint8Array, name = '') {
  const head = Buffer.from(data.slice(0, 16));

  if (head.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return 'image/png';
  }
  if (head[0] === 255 && head[1] === 216) {
    return 'image/jpeg';
  }
  if (head.subarray(0, 3).toString() === 'GIF') {
    return 'image/gif';
  }
  const extension = name.split('.').at(-1)?.toLowerCase();

  return (
    (
      {
        mp3: 'audio/mpeg',
        amr: 'audio/amr',
        opus: 'audio/ogg',
        ogg: 'audio/ogg',
        wav: 'audio/wav',
        mp4: 'video/mp4',
        pdf: 'application/pdf',
        txt: 'text/plain',
        webp: 'image/webp'
      } as any
    )[extension ?? ''] ?? 'application/octet-stream'
  );
}

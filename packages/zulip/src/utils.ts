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

export function messageId(result: any, id: any) {
  if (typeof id !== 'string' && typeof id !== 'number') {
    throw new Error('Send response missing message ID');
  }
  if (String(id) === '') {
    throw new Error('Send response missing message ID');
  }

  return { id: String(id), value: result };
}

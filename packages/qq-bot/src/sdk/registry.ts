import { cbpPlatform, createResult, ResultCode, type ConnectionLoginStatus } from 'alemonjs';
import { getQQBotConfig } from '../config.js';
import { register, type QQBotRegistration } from '../register.js';
import { QQBotClients } from './client.websoket.js';
import type { Options } from './typing.js';

type RegisteredBot = { client: QQBotClients; adapter: QQBotRegistration };

/**
 * The only CBP dispatcher for QQ WebSocket mode.  It keeps bot credentials,
 * message sequence state and action routing isolated while exposing one
 * platform connection to AlemonJS.
 */
export class QQBotRegistry {
  #bots = new Map<string, RegisteredBot>();
  #streams = new Map<string, string>();
  #defaultBot?: string;
  #cbp: ReturnType<typeof cbpPlatform>;
  #getLoginStatus?: () => ConnectionLoginStatus;

  constructor(defaultBot?: string, cbp?: ReturnType<typeof cbpPlatform>, getLoginStatus?: () => ConnectionLoginStatus) {
    this.#defaultBot = defaultBot;
    this.#getLoginStatus = getLoginStatus;
    if (cbp) {
      this.#cbp = cbp;
    } else {
      const config = getQQBotConfig();
      const port = process.env.port || config.port || 17117;

      this.#cbp = cbpPlatform(`ws://127.0.0.1:${port}`);
    }
    this.#cbp.onactions((data, consume) => void this.#onAction(data, consume));
    this.#cbp.onapis((data, consume) => void this.#onApi(data, consume));
  }

  add(botId: string, options: Options) {
    if (!botId) {
      throw new Error('QQ BotId is required');
    }
    if (this.#bots.has(botId)) {
      throw new Error(`Duplicate QQ BotId: ${botId}`);
    }
    const client = new QQBotClients({ ...options, app_id: botId });

    client.setStreamLifecycleListener(streamId => this.#streams.delete(streamId));
    client.setConnectionStatusListener((status, previous) => {
      // A ready-to-ready status patch (for example heartbeat acknowledgement) is not a new connection.
      if (status.state === 'ready' && previous.state !== 'ready') {
        this.#cbp.send({
          name: 'connection.ready',
          value: '',
          Platform: 'qq-bot',
          BotId: botId,
          transport: status.transport,
          resumed: status.resumed
        });
      }
    });
    const adapter = register(client, { botId, cbp: this.#cbp, bindActions: false });

    this.#bots.set(botId, { client, adapter });

    return client;
  }

  get(botId?: string) {
    return botId ? this.#bots.get(botId)?.client : undefined;
  }

  getConnectionStatus(botId?: string) {
    const bots = [...this.#bots].flatMap(([BotId, entry]) => {
      if (botId && botId !== BotId) {
        return [];
      }

      return [{ BotId, ...entry.client.getConnectionStatus() }];
    });
    const state = bots.some(item => item.state === 'ready')
      ? 'ready'
      : bots.some(item => item.state === 'connecting' || item.state === 'reconnecting')
      ? 'connecting'
      : bots[0]?.state || 'idle';

    return { Platform: 'qq-bot', state, bots, ...(this.#getLoginStatus ? { login: this.#getLoginStatus() } : {}) };
  }

  disconnect() {
    for (const { client } of this.#bots.values()) {
      client.disconnect();
    }
    this.#streams.clear();
  }

  #requestedBotId(data: any) {
    const payload = data?.payload || {};

    return payload.target?.BotId || payload.BotId || payload.event?.BotId || payload.event?.Platform?.BotId;
  }

  #select(data: any): { entry?: RegisteredBot; error?: string } {
    const requested = this.#requestedBotId(data);

    if (requested) {
      const entry = this.#bots.get(String(requested));

      return entry ? { entry } : { error: `BotId ${requested} is not configured (available: ${[...this.#bots.keys()].join(', ') || 'none'})` };
    }
    if (this.#bots.size === 1) {
      return { entry: this.#bots.values().next().value };
    }
    if (this.#defaultBot) {
      return { entry: this.#bots.get(this.#defaultBot) };
    }

    return { error: 'BotId is required because multiple QQ bots are active and no default_bot is configured' };
  }

  async #onAction(data: any, consume: (result: any[]) => void) {
    if (data?.action === 'connection.status') {
      const botId = data?.payload?.BotId;
      const status = this.getConnectionStatus(botId);

      if (botId && !status.bots.length) {
        consume([createResult(ResultCode.FailParams, `BotId ${botId} is not configured`, null)]);
      } else {
        consume([createResult(ResultCode.Ok, data.action, status)]);
      }

      return;
    }
    const { entry, error } = this.#select(data);

    if (!entry) {
      consume([createResult(ResultCode.FailParams, error || 'QQ Bot is unavailable', null)]);

      return;
    }
    await entry.adapter.onAction(data, consume);
  }

  async #onApi(data: any, consume: (result: any[]) => void) {
    const params = data?.payload?.params;
    const key = String(data?.payload?.key || '');
    const method = key.split('.').at(-1);
    const streamId = method === 'streamUpdate' || method === 'streamComplete' || method === 'streamCancel' ? params?.[0] : undefined;
    const requested = (Array.isArray(params) ? params[0]?.BotId : undefined) || (streamId ? this.#streams.get(String(streamId)) : undefined);
    const { entry, error } = this.#select({ payload: { BotId: requested, event: data?.payload?.event } });

    if (!entry) {
      consume([createResult(ResultCode.FailParams, error || 'QQ Bot is unavailable', null)]);

      return;
    }
    await entry.adapter.onApi(data, results => {
      const result = results.find((item: any) => item.code === ResultCode.Ok)?.data;

      if (method === 'streamOpen' && result?.streamId) {
        this.#streams.set(String(result.streamId), requested || this.#botIdFor(entry));
      }
      if (streamId && (method === 'streamComplete' || method === 'streamCancel')) {
        this.#streams.delete(String(streamId));
      }
      consume(results);
    });
  }

  #botIdFor(entry: RegisteredBot) {
    return [...this.#bots.entries()].find(([, value]) => value === entry)?.[0] || '';
  }
}

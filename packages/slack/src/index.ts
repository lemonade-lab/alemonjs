import { cbpPlatform, definePlatform, FormatEvent } from 'alemonjs/platform';
import { createResult, createUserHashKey, getConfigValue, isMaster, ResultCode } from 'alemonjs/common';
import { callNative, safeError, type Config, type Context, type Driver } from './utils.js';
import { publicValue, standardResult } from './results.js';
import { createDriver } from './driver.js';
export { createDriver } from './driver.js';
export const platform = 'slack';
export type API = import('@slack/bolt').App['client'];
export * as SDK from '@slack/bolt';

export default definePlatform({
  name: platform,
  main: async () => {
    const all = getConfigValue() ?? {};
    let open: () => void;
    const ready = new Promise<void>(resolve => {
      open = resolve;
    });
    const cbp = cbpPlatform(undefined, { open: () => open() });

    await ready;

    return startSlack({ ...all[platform], ...all['@alemonjs/slack'] }, cbp);
  }
});

export async function startSlack(config: Config, cbp: ReturnType<typeof cbpPlatform>, connect: (context: Context) => Driver | Promise<Driver> = createDriver) {
  let status = 'connecting';
  let stopped = false;
  let bot = String(config.bot_id ?? '');
  const seen = new Map<string, number>();
  const context: Context = {
    platform,
    config,
    active: () => !stopped,
    state: value => {
      status = value;
    },
    ready: id => {
      if (stopped) {
        return;
      }
      bot = id ?? bot;
      status = 'ready';
      cbp.send(
        FormatEvent.create('connection.ready')
          .addPlatform({ Platform: platform, BotId: bot, value: null })
          .add({ state: status } as any).value as any
      );
    },
    emit: data => {
      if (stopped || !data.user || data.user === 'undefined' || data.user === 'null') {
        return;
      }
      const key = data.id ? `${data.bot ?? bot}:${data.name ?? 'message'}:${data.channel ?? ''}:${data.id}` : '';

      if (key && seen.has(key)) {
        return;
      }
      let name = data.name ?? (data.private ? 'private.message.create' : 'message.create');

      if (name === 'reaction.add' || name === 'reaction.remove') {
        name = `message.${name}`;
      }
      if (data.private && ['interaction.create', 'message.update', 'message.delete'].includes(name)) {
        name = `private.${name}`;
      }
      const builder: any = FormatEvent.create(name as any)
        .addPlatform({
          Platform: platform,
          BotId: data.bot ?? bot,
          IsPrivate: Boolean(data.private),
          IsAtMe: Boolean(data.atMe),
          value: data.raw
        })
        .addUser({
          UserId: String(data.user),
          UserName: data.username,
          UserKey: createUserHashKey({ Platform: platform, UserId: String(data.user) }),
          IsMaster: isMaster(String(data.user), platform),
          IsBot: false
        })
        .addMessage({ MessageId: String(data.id ?? ''), ReplyId: data.reply })
        .addText({ MessageText: data.text ?? '' })
        .addOpen({ OpenId: data.open ?? (data.private ? String(data.user) : String(data.channel ?? '')) });

      if (data.private && data.channel) {
        builder.addChannel({ ChannelId: data.channel });
      }
      if (data.channel && !data.private) {
        builder.addGuild({ GuildId: data.guild ?? data.channel, SpaceId: data.guild ?? data.channel }).addChannel({ ChannelId: data.channel });
      }
      if (data.media?.length) {
        builder.addMedia({ MessageMedia: data.media });
      }
      if (name.startsWith('message.reaction.')) {
        builder.add({ EmojiId: typeof data.interaction === 'string' ? data.interaction : data.raw?.reaction ?? data.raw?.emoji, Count: 1 });
      }
      if (data.interaction && name.includes('interaction')) {
        builder.addInteraction({
          InteractionId: String(data.id ?? ''),
          InteractionData: typeof data.interaction === 'string' ? data.interaction : JSON.stringify(data.interaction)
        });
      }
      const target =
        data.target ??
        (data.private ? { scope: 'c2c', targetId: data.open ?? data.user } : data.channel ? { scope: 'channel', targetId: data.channel } : undefined);

      cbp.send({ ...builder.value, ...(target ? { Target: { ...target, BotId: data.bot ?? bot } } : {}) });
      if (key) {
        seen.set(key, Date.now());
      }
      while (seen.size > 5000 || (seen.size && Date.now() - seen.values().next().value! > 600_000)) {
        seen.delete(seen.keys().next().value);
      }
    }
  };
  let driver: Driver;

  try {
    driver = await connect(context);
  } catch (error) {
    throw new Error(safeError(error, config));
  }

  global.client = driver.client;
  const onAction = async (data: any, consume: any) => {
    try {
      if (data.action === 'connection.status') {
        return consume([
          createResult(ResultCode.Ok, data.action, {
            Platform: platform,
            state: stopped ? 'stopped' : driver.status?.() ?? status,
            bots: bot ? [{ id: bot }] : [],
            capabilities: Object.keys(driver.actions)
          })
        ]);
      }
      const handler = driver.actions[data.action];

      if (stopped) {
        throw new Error('Platform stopped');
      }

      if (!handler) {
        return consume([createResult(ResultCode.Fail, `Unsupported action: ${data.action}`, null)]);
      }
      const payload: any = data.payload ?? {};

      if (payload.params && !Array.isArray(payload.params)) {
        payload.params = {
          ...payload.params,
          limit: payload.params.limit ?? payload.params.Limit,
          after: payload.params.after ?? payload.params.After ?? payload.params.Cursor,
          before: payload.params.before ?? payload.params.Before
        };
      }
      const result = await handler(payload);

      if (result === false) {
        throw new Error('Platform rejected action');
      }
      consume([createResult(ResultCode.Ok, data.action, publicValue(standardResult(data.action, result, payload)) ?? null)]);
    } catch (error: any) {
      consume([createResult(ResultCode.Fail, safeError(error, config), null)]);
    }
  };

  cbp.onactions((data, consume) => {
    void onAction(data, consume);
  });
  const onApi = async (data: any, consume: any) => {
    try {
      if (stopped) {
        throw new Error('Platform stopped');
      }
      consume([createResult(ResultCode.Ok, data.payload.key, publicValue(await callNative(driver.client, data.payload.key, data.payload.params)))]);
    } catch (error: any) {
      consume([createResult(ResultCode.Fail, safeError(error, config), null)]);
    }
  };

  cbp.onapis((data, consume) => {
    void onApi(data, consume);
  });
  const signalHandlers: { signal: 'SIGINT' | 'SIGTERM' | 'disconnect'; listener: () => void }[] = [];
  let stopTask: Promise<void> | undefined;
  const stop = () => {
    if (stopTask !== undefined) {
      return stopTask;
    }
    for (const { signal, listener } of signalHandlers) {
      process.removeListener(signal, listener);
    }
    signalHandlers.length = 0;
    stopped = true;
    status = 'stopped';
    stopTask = Promise.resolve()
      .then(() => driver.stop?.())
      .then(() => {});

    return stopTask;
  };

  for (const signal of ['SIGINT', 'SIGTERM', 'disconnect'] as const) {
    const listener = () => void stop().catch(() => {});

    signalHandlers.push({ signal, listener });
    process.once(signal, listener);
  }
  try {
    await driver.start?.();
  } catch (error) {
    await stop();
    throw new Error(safeError(error, config));
  }

  return { driver, stop, context };
}

import IRC from 'irc-framework';
import { required, sendActions, text, type Context } from './utils.js';

export function createDriver(ctx: Context, SDK: any = IRC) {
  const c = ctx.config;

  required(c, 'host', 'nick');
  const client = new SDK.Client();
  const argument = (x: string) => {
    if (!x || /[\s\r\n]/.test(x) || x.includes(String.fromCharCode(0))) {
      throw new Error('Invalid IRC command argument');
    }

    return x;
  };

  client.on('registered', () => {
    for (const ch of c.channels ?? []) {
      client.join(argument(ch));
    }
    ctx.ready(client.user.nick);
  });
  client.on('close', () => ctx.state('reconnecting'));
  client.on('message', (e: any) => {
    if (e.nick === client.user.nick || e.type === 'notice') {
      return;
    }
    const privateMessage = e.target === client.user.nick;

    ctx.emit({
      user: e.account && e.account !== '*' ? e.account : e.nick,
      open: e.nick,
      username: e.nick,
      id: e.tags?.msgid,
      channel: privateMessage ? undefined : e.target,
      private: privateMessage,
      text: e.message,
      raw: { ...e, reply: undefined }
    });
  });
  client.on('join', (e: any) => ctx.emit({ name: 'member.add', user: e.nick, channel: e.channel, raw: e }));
  client.on('part', (e: any) => ctx.emit({ name: 'member.remove', user: e.nick, channel: e.channel, raw: e }));
  const raw = (...args: string[]) => {
    if (!client.connection?.connected) {
      throw new Error('IRC disconnected');
    }
    client.raw(...args);

    return { queued: true };
  };
  const actions = {
    ...sendActions((t, f) => {
      if (!client.connection?.connected) {
        throw new Error('IRC disconnected');
      }
      const content = text(f);

      if (!content) {
        throw new Error('Empty message');
      }
      client.say(argument(t.id), content);

      return { queued: true }; // IRC has no mandatory delivery ACK.
    }),
    'me.info': () => ({ UserId: client.user.nick, UserName: client.user.nick }),
    'channel.create': (p: any) => raw('JOIN', argument(p.params.name)),
    'guild.leave': (p: any) => raw('PART', argument(p.GuildId)),
    'member.kick': (p: any) => raw('KICK', argument(p.GuildId), argument(p.UserId)),
    'member.admin': (p: any) => raw('MODE', argument(p.GuildId), p.params.enable ? '+o' : '-o', argument(p.UserId)),
    'channel.update': (p: any) => {
      if (/[\r\n]/.test(p.params.topic) || p.params.topic.includes(String.fromCharCode(0))) {
        throw new Error('Invalid topic');
      }

      return raw('TOPIC', argument(p.ChannelId), p.params.topic);
    }
  };

  return {
    client,
    actions,
    start: () =>
      client.connect({
        host: c.host,
        port: c.port ?? 6697,
        tls: c.tls !== false,
        nick: c.nick,
        username: c.username ?? c.nick,
        password: c.password,
        account: c.account,
        sasl_disconnect_on_fail: true,
        auto_reconnect: true
      }),
    stop: () => client.quit('shutdown')
  };
}

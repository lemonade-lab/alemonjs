import * as icqq from 'icqq';
import { bytes, messageId, required, withMedia, sendActions, text, type Context } from './utils.js';

export function createDriver(ctx: Context, SDK: any = icqq) {
  const c = ctx.config;

  required(c, 'uin');
  const client = SDK.createClient({ ...(c.sdk ?? {}), data_dir: c.data_dir ?? './data/icqq', platform: c.device_platform ?? 5 });
  const id = (x: any) => {
    const n = Number(x);

    if (!Number.isSafeInteger(n) || n <= 0) {
      throw new Error('Invalid QQ numeric ID');
    }

    return n;
  };
  const emit = (e: any) =>
    ctx.emit({
      user: String(e.user_id),
      username: e.sender?.nickname,
      id: e.message_id,
      channel: e.group_id ? String(e.group_id) : undefined,
      private: e.message_type === 'private',
      text: e.raw_message,
      atMe: e.atme,
      reply: e.source?.message_id,
      media: e.message
        ?.filter((n: any) => ['image', 'record', 'video', 'file'].includes(n.type))
        .map((n: any) => ({ Type: n.type === 'record' ? 'audio' : n.type, FileId: n.file, Url: n.url })),
      raw: e
    });

  client.on('message', emit);
  client.on('system.online', () => ctx.ready(String(client.uin)));
  client.on('system.offline', () => ctx.state('offline'));
  for (const [event, name] of [
    ['notice.group.increase', 'member.add'],
    ['notice.group.decrease', 'member.remove'],
    ['notice.group.recall', 'message.delete'],
    ['notice.friend.recall', 'private.message.delete'],
    ['request.friend', 'private.friend.add'],
    ['request.group.add', 'private.guild.add'],
    ['request.group.invite', 'private.guild.add']
  ]) {
    client.on(event, (e: any) => ctx.emit({ name, user: String(e.user_id), id: e.message_id, channel: e.group_id ? String(e.group_id) : undefined, raw: e }));
  }
  const encode = (f: any[]) =>
    Promise.all(
      f.map(async n => {
        if (['Image', 'ImageURL', 'ImageFile'].includes(n.type)) {
          return SDK.segment.image(await bytes(n.value));
        }
        if (n.type === 'Audio') {
          return SDK.segment.record(await bytes(n.value));
        }
        if (n.type === 'Video') {
          return SDK.segment.video(n.value.startsWith('file://') ? new URL(n.value).pathname : n.value);
        }
        if (n.type === 'Mention') {
          return SDK.segment.at(n.value === 'all' ? 'all' : id(n.value));
        }

        return text([n]);
      })
    );
  const actions = {
    ...sendActions(async (t, f, p) => {
      const files = f.filter(n => n.type === 'Attachment');
      const content = await encode(f.filter(n => n.type !== 'Attachment'));
      const results = [];

      for (const n of files) {
        const data = await bytes(n.value);
        const value = t.private
          ? await client.pickFriend(id(t.id)).sendFile(data, n.options?.filename)
          : await client.pickGroup(id(t.id)).sendFile(data, '/', n.options?.filename);

        if (!value) {
          throw new Error('QQ file send failed');
        }
        results.push({ fileId: typeof value === 'string' ? value : value.fid, value });
      }

      if (!content.length && !files.length) {
        throw new Error('Empty message');
      }
      if (content.length) {
        const source = p.params?.replyId ? await client.getMsg(p.params.replyId) : undefined;
        const r = await (t.private ? client.sendPrivateMsg(id(t.id), content, source) : client.sendGroupMsg(id(t.id), content, source));

        results.push(messageId(r, r.message_id));
      }

      return results.length === 1 ? results[0] : results;
    }),
    'me.info': () => ({ UserId: String(client.uin), UserName: client.nickname }),
    'me.friends': () => [...client.fl.values()],
    'guild.list': () => [...client.gl.values()],
    'user.info': (p: any) => client.getStrangerInfo(id(p.UserId ?? p.params?.userId)),
    'guild.info': (p: any) => client.getGroupInfo(id(p.GuildId)),
    'member.info': (p: any) => client.getGroupMemberInfo(id(p.params.guildId), id(p.params.userId)),
    'member.list': (p: any) => client.getGroupMemberList(id(p.GuildId)).then((r: any) => [...r.values()]),
    'message.get': (p: any) => client.getMsg(p.MessageId),
    'message.delete': (p: any) => client.deleteMsg(p.MessageId),
    'history.list': (p: any) => client.getChatHistory(p.params?.before ?? p.MessageId, p.params?.limit ?? 20),
    'guild.update': (p: any) => client.setGroupName(id(p.GuildId), p.params.name),
    'guild.leave': (p: any) => client.setGroupLeave(id(p.GuildId)),
    'guild.mute': (p: any) => client.setGroupWholeBan(id(p.GuildId), p.params.enable),
    'member.kick': (p: any) => client.setGroupKick(id(p.GuildId), id(p.UserId)),
    'member.mute': (p: any) => client.setGroupBan(id(p.GuildId), id(p.UserId), p.params.duration),
    'member.admin': (p: any) => client.setGroupAdmin(id(p.GuildId), id(p.UserId), p.params.enable),
    'member.card': (p: any) => client.setGroupCard(id(p.GuildId), id(p.UserId), p.params.card),
    'member.title': (p: any) => client.setGroupSpecialTitle(id(p.GuildId), id(p.UserId), p.params.title),
    'request.friend': (p: any) => client.setFriendAddRequest(p.event?.value?.flag ?? p.params?.flag, p.params?.approve),
    'request.guild': (p: any) => client.setGroupAddRequest(p.event?.value?.flag ?? p.params?.flag, p.params?.approve, p.params?.reason)
  };

  return { client, actions: withMedia(actions), start: () => client.login(id(c.uin), c.password), stop: () => client.logout() };
}

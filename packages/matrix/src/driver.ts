import * as matrix from 'matrix-js-sdk';
import { bytes, required, withMedia, sendActions, text, messageId, type Context } from './utils.js';

export function createDriver(ctx: Context, SDK: any = matrix) {
  const c = ctx.config;

  required(c, 'base_url', 'access_token', 'user_id');
  const client = SDK.createClient({ baseUrl: c.base_url, accessToken: c.access_token, userId: c.user_id, deviceId: c.device_id });
  let live = false;

  client.on('sync', (state: string) => {
    if (state === 'PREPARED' || state === 'SYNCING') {
      live = true;
      ctx.ready(c.user_id);
    } else {
      ctx.state('reconnecting');
    }
  });
  client.on('Room.timeline', (e: any, room: any, old: boolean, removed: boolean, data: any) => {
    if (!live || old || removed || data?.liveEvent === false || e.getSender() === c.user_id) {
      return;
    }
    const content = e.getContent();
    const type = e.getType();

    if (type === 'm.room.encrypted') {
      return;
    } // Never pretend ciphertext is readable text.
    const name = type === 'm.reaction' ? 'reaction.add' : type === 'm.room.redaction' ? 'message.delete' : undefined;

    if (type !== 'm.room.message' && !name) {
      return;
    }
    ctx.emit({
      name,
      user: e.getSender(),
      id: e.getId(),
      channel: room.roomId,
      text: content.body ?? '',
      reply: content['m.relates_to']?.['m.in_reply_to']?.event_id,
      raw: e.event,
      media: content.url
        ? [
            {
              Type: content.msgtype === 'm.image' ? 'image' : content.msgtype === 'm.audio' ? 'audio' : content.msgtype === 'm.video' ? 'video' : 'file',
              FileId: content.url,
              FileName: content.body
            }
          ]
        : []
    });
  });
  const actions = {
    ...sendActions(
      async (t, f, p) => {
        if (t.private && t.scope !== 'direct') {
          throw new Error('Matrix proactive sends require an explicit room ID; use channel/direct target');
        }
        const results = [];

        for (const n of f) {
          let content: any;

          if (['Image', 'ImageURL', 'ImageFile', 'Audio', 'Video', 'Attachment'].includes(n.type)) {
            if (client.isRoomEncrypted(t.id)) {
              throw new Error('Encrypted media requires native SDK encryption and crypto storage');
            }
            const uploaded = await client.uploadContent(await bytes(n.value), { name: n.options?.filename ?? 'upload' });

            content = {
              msgtype: n.type.startsWith('Image') ? 'm.image' : n.type === 'Audio' ? 'm.audio' : n.type === 'Video' ? 'm.video' : 'm.file',
              body: n.options?.filename ?? 'upload',
              url: uploaded.content_uri
            };
          } else {
            content = { msgtype: 'm.text', body: text([n]) };
          }
          if (p.params?.replyId) {
            content['m.relates_to'] = { 'm.in_reply_to': { event_id: p.params.replyId } };
          }
          const r = await client.sendMessage(t.id, content);

          results.push(messageId(r, r.event_id));
        }
        if (!results.length) {
          throw new Error('Empty message');
        }

        return results.length === 1 ? results[0] : results;
      },
      { user: false }
    ),
    'me.info': () => client.whoami(),
    'user.info': (p: any) => client.getProfileInfo(p.UserId ?? p.params?.userId),
    'guild.list': () => client.getJoinedRooms(),
    'channel.list': () => client.getJoinedRooms(),
    'member.list': (p: any) => client.getJoinedRoomMembers(p.GuildId),
    'member.kick': (p: any) => client.kick(p.GuildId, p.UserId, p.params?.reason),
    'member.ban': (p: any) => client.ban(p.GuildId, p.UserId, p.params?.reason),
    'member.unban': (p: any) => client.unban(p.GuildId, p.UserId),
    'guild.leave': (p: any) => client.leave(p.GuildId),
    'channel.create': (p: any) => client.createRoom({ name: p.params.name, visibility: p.params.type === 'public' ? 'public' : 'private' }),
    'channel.update': (p: any) => client.setRoomName(p.ChannelId, p.params.name),
    'message.get': (p: any) => client.fetchRoomEvent(p.ChannelId ?? p.event?.ChannelId ?? p.target?.targetId, p.MessageId),
    'message.delete': (p: any) => client.redactEvent(p.ChannelId ?? p.event?.ChannelId, p.MessageId),
    'message.edit': (p: any) =>
      client.sendMessage(p.ChannelId, {
        msgtype: 'm.text',
        body: `* ${text(p.params?.format)}`,
        'm.new_content': { msgtype: 'm.text', body: text(p.params?.format) },
        'm.relates_to': { rel_type: 'm.replace', event_id: p.MessageId }
      }),
    'reaction.add': (p: any) =>
      client.sendEvent(p.ChannelId, 'm.reaction', { 'm.relates_to': { rel_type: 'm.annotation', event_id: p.MessageId, key: p.EmojiId } }),
    'history.list': (p: any) => client.createMessagesRequest(p.ChannelId, p.params?.before, p.params?.limit ?? 20, 'b')
  };

  return { client, actions: withMedia(actions), start: () => client.startClient({ initialSyncLimit: 0 }), stop: () => client.stopClient() };
}

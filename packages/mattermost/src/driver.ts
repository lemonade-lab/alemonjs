import { createRequire } from 'node:module';
export const NativeSDK = createRequire(import.meta.url)('@mattermost/client');
const { Client4, WebSocketClient } = NativeSDK;

import WebSocket from 'ws';
import { bytes, messageId, required, withMedia, sendActions, text, type Context } from './utils.js';

export function createDriver(ctx: Context, SDK: any = { Client4, WebSocketClient }) {
  const c = ctx.config;

  required(c, 'base_url', 'token');
  const client = new SDK.Client4();

  client.setUrl(c.base_url);
  client.setToken(c.token);
  const socket = new SDK.WebSocketClient();
  let bot = '';

  socket.setEventCallback((e: any) => {
    if (e.event === 'posted' || e.event === 'post_edited' || e.event === 'post_deleted') {
      const p = JSON.parse(e.data.post);

      if (p.user_id === bot && e.event === 'posted') {
        return;
      }
      ctx.emit({
        name: e.event === 'post_deleted' ? 'message.delete' : e.event === 'post_edited' ? 'message.update' : undefined,
        user: p.user_id,
        username: e.data.sender_name,
        id: p.id,
        channel: p.channel_id,
        private: e.data.channel_type === 'D',
        target: { scope: e.data.channel_type === 'D' ? 'direct' : 'channel', targetId: p.channel_id },
        text: p.message,
        reply: p.root_id,
        media: p.file_ids?.map((id: string) => ({ Type: 'file', FileId: id })),
        raw: p
      });
    }
  });
  socket.setCloseCallback(() => ctx.state('reconnecting'));
  socket.setFirstConnectCallback?.(() => ctx.ready(bot));
  socket.setReconnectCallback?.(() => ctx.ready(bot));
  const actions = {
    ...sendActions(async (t, f, p) => {
      const ch = t.private && t.scope !== 'direct' ? (await client.createDirectChannel([bot, t.id])).id : t.id;
      const content = f.filter(n => !['Image', 'ImageURL', 'ImageFile', 'Audio', 'Video', 'Attachment'].includes(n.type));
      const fileIds = [];

      for (const n of f.filter(n => !content.includes(n))) {
        const form = new FormData();

        form.append('channel_id', ch);
        form.append('files', new Blob([new Uint8Array(await bytes(n.value))]), n.options?.filename ?? 'upload');
        const r = await client.uploadFile(form);

        fileIds.push(...r.file_infos.map((x: any) => x.id));
      }
      const r = await client.createPost({ channel_id: ch, message: text(content), root_id: p.params?.replyId ?? '', file_ids: fileIds });

      return messageId(r, r.id);
    }),
    'me.info': () => client.getMe(),
    'user.info': (p: any) => client.getUser(p.UserId ?? p.params?.userId),
    'guild.list': () => client.getMyTeams(),
    'guild.info': (p: any) => client.getTeam(p.GuildId),
    'channel.info': (p: any) => client.getChannel(p.ChannelId),
    'channel.list': (p: any) => client.getMyChannels(p.GuildId),
    'channel.create': (p: any) =>
      client.createChannel({
        team_id: p.GuildId,
        name: p.params.name,
        display_name: p.params.name,
        type: p.params.type === 'private' ? 'P' : 'O'
      }),
    'channel.update': (p: any) => client.patchChannel(p.ChannelId, { display_name: p.params.name, header: p.params.topic }),
    'channel.delete': (p: any) => client.deleteChannel(p.ChannelId),
    'member.list': (p: any) => client.getChannelMembers(p.GuildId, 0, p.params?.limit ?? 60),
    'member.kick': (p: any) => client.removeFromChannel(p.UserId, p.GuildId),
    'message.get': (p: any) => client.getPost(p.MessageId),
    'message.edit': (p: any) => client.patchPost({ id: p.MessageId, message: text(p.params?.format) }),
    'message.delete': (p: any) => client.deletePost(p.MessageId),
    'message.pin': (p: any) => client.pinPost(p.MessageId),
    'message.unpin': (p: any) => client.unpinPost(p.MessageId),
    'reaction.add': (p: any) => client.addReaction(bot, p.MessageId, p.EmojiId),
    'reaction.remove': (p: any) => client.removeReaction(bot, p.MessageId, p.EmojiId),
    'reaction.list': (p: any) => client.getReactionsForPost(p.MessageId),
    'history.list': (p: any) =>
      p.params?.before ? client.getPostsBefore(p.ChannelId, p.params.before, 0, p.params.limit ?? 20) : client.getPosts(p.ChannelId, 0, p.params?.limit ?? 20)
  };

  return {
    client,
    actions: withMedia(actions),
    start: async () => {
      bot = (await client.getMe()).id;
      if (!globalThis.WebSocket) {
        (globalThis as any).WebSocket = WebSocket;
      }
      socket.initialize(`${c.base_url.replace(/^http/, 'ws').replace(/\/$/, '')}/api/v4/websocket`, c.token);
    },
    stop: () => socket.close()
  };
}

import { ChatClient } from '@twurple/chat';
import { StaticAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import { messageId, required, sendActions, text, type Context } from './utils.js';

export function createDriver(ctx: Context, SDK: any = { ChatClient, StaticAuthProvider, ApiClient, EventSubWsListener }) {
  const c = ctx.config;

  required(c, 'client_id', 'access_token', 'user_id', 'channels');
  const authProvider = new SDK.StaticAuthProvider(c.client_id, c.access_token, c.scopes);
  const api = new SDK.ApiClient({ authProvider });
  const chat = new SDK.ChatClient({ authProvider, channels: c.channels });

  chat.onConnect(() => ctx.ready(c.user_id));
  chat.onDisconnect(() => ctx.state('reconnecting'));
  chat.onMessage((channel: string, user: string, content: string, m: any) => {
    if (m.userInfo.userId === c.user_id) {
      return;
    }
    ctx.emit({
      user: m.userInfo.userId,
      username: m.userInfo.displayName ?? user,
      id: m.id,
      channel: m.channelId,
      text: content,
      reply: m.tags?.get('reply-parent-msg-id'),
      atMe: content.includes(`@${c.username ?? ''}`) && Boolean(c.username),
      raw: { channel, text: content, tags: Object.fromEntries(m.tags ?? []) }
    });
  });
  chat.onMessageRemove((channel: string, message: string, m: any) =>
    ctx.emit({ name: 'message.delete', user: c.user_id, id: message, channel: m.channelId ?? channel, raw: { channel, message } })
  );
  const events = c.whispers ? new SDK.EventSubWsListener({ apiClient: api }) : undefined;

  if (events) {
    events.onUserWhisperMessage(c.user_id, (e: any) =>
      ctx.emit({
        user: e.senderUserId,
        username: e.senderUserDisplayName,
        id: e.id,
        private: true,
        text: e.messageText,
        raw: { fromUserId: e.senderUserId, toUserId: e.userId, whisperId: e.id, text: e.messageText }
      })
    );
    events.onSubscriptionCreateFailure(() => ctx.state('offline'));
  }
  const client = { api, chat, events };
  const actions = {
    ...sendActions(async (t, f, p) => {
      if (t.private) {
        await api.whispers.sendWhisper(c.user_id, t.id, text(f));

        return { accepted: true }; // Whisper API returns 204, without a message ID.
      }
      const r = await api.chat.sendChatMessage(t.id, text(f), { replyParentMessageId: p.params?.replyId });

      if (!r.isSent) {
        throw new Error(`Twitch message dropped: ${r.dropReasonMessage ?? 'unknown reason'}`);
      }

      return messageId(r, r.id);
    }),
    'me.info': () => api.users.getUserById(c.user_id),
    'user.info': (p: any) => api.users.getUserById(p.UserId ?? p.params?.userId),
    'channel.info': (p: any) => api.channels.getChannelInfoById(p.ChannelId),
    'message.delete': (p: any) => api.moderation.deleteChatMessages(p.ChannelId, p.MessageId),
    'member.ban': (p: any) => api.moderation.banUser(p.GuildId, { user: p.UserId, reason: p.params?.reason, duration: p.params?.duration }),
    'member.unban': (p: any) => api.moderation.unbanUser(p.GuildId, p.UserId),
    'member.list': (p: any) => api.chat.getChatters(p.GuildId, { first: p.params?.limit, after: p.params?.after })
  };

  return {
    client,
    actions,
    start: () => {
      events?.start();
      chat.connect();
    },
    stop: () => {
      events?.stop();
      chat.quit();
    }
  };
}

import { App } from '@microsoft/teams.apps';
import { isContextTarget, required, withMedia, sendActions, text, messageId, type Context } from './utils.js';

export function createDriver(ctx: Context, SDK: any = { App }) {
  const c = ctx.config;

  required(c, 'client_id', 'client_secret', 'tenant_id');
  const app = new SDK.App({ clientId: c.client_id, clientSecret: c.client_secret, tenantId: c.tenant_id });
  const conversations = new Map<string, string>();

  app.on('message', ({ activity }: any) => {
    const privateMessage = activity.conversation?.conversationType === 'personal';

    if (privateMessage) {
      conversations.set(activity.from.id, activity.conversation.id);
    }
    while (conversations.size > 2000) {
      conversations.delete(conversations.keys().next().value);
    }
    ctx.emit({
      name: activity.value ? 'interaction.create' : undefined,
      user: activity.from.id,
      username: activity.from.name,
      bot: activity.recipient?.id,
      id: activity.id,
      channel: activity.conversation.id,
      guild: activity.channelData?.team?.id,
      private: privateMessage,
      target: { scope: privateMessage ? 'direct' : 'channel', targetId: activity.conversation.id },
      text: activity.value?.action ?? activity.text,
      interaction: activity.value,
      reply: activity.replyToId,
      media: activity.attachments?.map((a: any) => ({ Type: 'file', Url: a.contentUrl, MimeType: a.contentType, FileName: a.name })),
      raw: activity
    });
  });
  const encode = (format: any[]) => {
    const attachments = [];
    const content = [];

    for (const node of format) {
      if (['Image', 'ImageURL', 'Audio', 'Video', 'Attachment'].includes(node.type) && /^https:\/\//.test(node.value)) {
        attachments.push({
          contentType: node.type.startsWith('Image')
            ? 'image/png'
            : node.type === 'Audio'
            ? 'audio/mpeg'
            : node.type === 'Video'
            ? 'video/mp4'
            : 'application/octet-stream',
          contentUrl: node.value,
          name: node.options?.filename
        });
      } else if (['ButtonGroup', 'BT.group'].includes(node.type)) {
        attachments.push({
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [],
            actions: node.value
              .flatMap((r: any) => r.value)
              .map((b: any) =>
                b.options?.type === 'link'
                  ? { type: 'Action.OpenUrl', title: b.value, url: b.options.data }
                  : { type: 'Action.Submit', title: b.value, data: { action: b.options?.data ?? b.value } }
              )
          }
        });
      } else {
        content.push(node);
      }
    }

    return { type: 'message', text: text(content), attachments };
  };
  const actions = {
    ...sendActions(async (t, f, p) => {
      const conversation = (isContextTarget(p, t) ? p.event?.ChannelId : undefined) ?? (t.private && t.scope !== 'direct' ? conversations.get(t.id) : t.id);

      if (!conversation) {
        throw new Error('Teams requires a known conversation; send to its channel/direct-session ID');
      }
      const activity = encode(f);
      const r = p.params?.replyId ? await app.reply(conversation, p.params.replyId, activity) : await app.send(conversation, activity);

      return messageId(r, r.id);
    }),
    'message.delete': (p: any) => app.api.conversations.deleteActivity(p.ChannelId ?? p.event?.ChannelId, p.MessageId),
    'message.edit': (p: any) => app.api.conversations.updateActivity(p.ChannelId, p.MessageId, encode(p.params?.format ?? [])),
    'member.list': (p: any) => app.api.conversations.getPagedMembers(p.GuildId, p.params?.limit, p.params?.after),
    'member.info': (p: any) => app.api.conversations.getMemberById(p.params.guildId, p.params.userId),
    'reaction.add': (p: any) => app.api.conversations.addReaction(p.ChannelId, p.MessageId, p.EmojiId),
    'reaction.remove': (p: any) => app.api.conversations.deleteReaction(p.ChannelId, p.MessageId, p.EmojiId)
  };

  return {
    client: app,
    actions: withMedia(actions),
    start: async () => {
      await app.start(c.port ?? 18082);
      ctx.ready(c.client_id);
    },
    stop: () => app.stop()
  };
}

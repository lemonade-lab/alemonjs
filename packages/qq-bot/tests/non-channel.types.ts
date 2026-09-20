// Application contracts: import only framework types/hooks, never an adapter SDK.
import { useInteraction, useMenu, usePanel, useMember, useRequest, useMessage, useMedia, useGuild, useMe, useConnection, type Events } from 'alemonjs';
const context = { Platform: 'qq-bot', BotId: 'app', Target: { scope: 'group' as const, targetId: 'g' }, GuildId: 'g' };
const [menu] = useMenu(context);
await menu.set({
  items: [
    { type: 'message', name: '帮助', text: '/help' },
    { type: 'switch', name: '搜索', id: 'search', default: true }
  ]
});
const [panel] = usePanel(context);
const created = await panel.create({ scope: 'group', audience: 'specific', guildIds: ['g'], panel: { items: [{ type: 'command', name: '帮助' }] } });
await panel.get(created.data.id);
// @ts-expect-error scope is required
panel.list({ pagination: { Limit: 10 } });
// @ts-expect-error channel is intentionally excluded from the non-channel panel surface
panel.list({ scope: 'channel' });
// @ts-expect-error menu items must contain semantic content, not QQ wire fields
menu.set({ items: [{ type: 'message', name: 'help', send_message: '/help' }] });
const [members] = useMember(context);
const listed = await members.list({ pagination: { Cursor: 'next' } });
listed.data.Items[0].UserId;
await members.kickMany({ userIds: ['u'], blacklist: true });
// @ts-expect-error array required
members.kickMany({ userIds: 'u' });
const [requests] = useRequest(context);
await requests.decide({ userId: 'u', requestId: 'r', approve: true });
await requests.decide({ userId: 'u', approve: true });
const policy = await requests.policies.create({ guildIds: ['g'], enabled: true });
await requests.policies.updateWhitelist({ id: policy.data.id, operation: 'add', userIds: ['u'] });
await useGuild(context)[0].botInfo();
await useMe(context)[0].share({ data: 'campaign' });
await useConnection(context)[0].gateway();
const [messages] = useMessage(context);
await messages.send({
  content: {
    markdown: { content: '# hi', verifyImages: true },
    keyboard: { rows: [[{ id: 'b', label: 'go', action: { type: 'callback', data: 'go', permission: { type: 'users', userIds: ['u'] } } }]] }
  },
  eventId: 'e',
  referenceId: 'ref',
  sequence: 2
});
await messages.stream({ target: { scope: 'c2c', targetId: 'u' }, text: 'hello', state: 'complete', index: 0 });
await useMedia(context)[0].prepare({ type: 'image', name: 'a.png', size: '4', hashes: { md5: 'a', sha1: 'b', headMd5: 'a' } });
declare const notice: Events['notice.create'];
if (notice.Notice?.type === 'subscription') notice.Notice.subscriptions[0].subscriptionId;
if (notice.Notice?.type === 'join-request')
  await requests.decide({ userId: notice.Notice.request.userId, requestId: notice.Notice.request.id, approve: false });
declare const interaction: Events['private.interaction.create'];
interaction.Interaction?.authorization?.scope;
declare const message: Events['private.message.create'];
message.MessageContent?.elements?.[0].attachments?.[0].Transcript;

await useInteraction({ BotId: 'app' })[0].ack({ InteractionId: 'stored-interaction' });
const whitelistResult = await requests.policies.updateWhitelist({ id: 'p', operation: 'add', userIds: ['u'] });
whitelistResult.data.whitelistCount;
// @ts-expect-error cannot mix group IDs and group numbers when creating a policy
requests.policies.create({ guildIds: ['g'], guildNumbers: ['123'] });

await useMedia(context)[0].send({ type: 'image', fileId: 'existing' });

// @ts-expect-error upload cannot silently discard message reply options
useMedia(context)[0].upload({ type: 'image', fileId: 'f', replyId: 'r' });

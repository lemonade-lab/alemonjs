import type { ActionTarget, EventKeys, Events } from '../types/index.js';
import { FormatEvent } from '../platform/event-format.js';

export type TestEventOptions = {
  text?: string;
  userId?: string;
  groupId?: string;
  channelId?: string;
  botId?: string;
  platform?: string;
  messageId?: string;
};

/** Framework fields are defaults; overrides allow adapter-specific payloads. */
export function createTestEvents(now: () => number = Date.now) {
  let sequence = 0;
  const event = <T extends EventKeys>(name: T, overrides: Partial<Events[T]> = {}): Events[T] =>
    ({
      ...FormatEvent.create(name).value,
      Platform: 'test',
      BotId: 'test-bot',
      UserId: 'test-user',
      MessageId: `test-message-${++sequence}`,
      MessageText: '',
      IsPrivate: name.startsWith('private.'),
      Timestamp: now(),
      ...overrides
    } as Events[T]);
  const message = <T extends EventKeys>(name: T, scope: ActionTarget['scope'], options: TestEventOptions, overrides: Partial<Events[T]>) => {
    const targetId = scope === 'c2c' ? options.userId ?? 'test-user' : options.groupId ?? options.channelId ?? 'test-room';

    return event(name, {
      UserId: options.userId ?? 'test-user',
      BotId: options.botId ?? 'test-bot',
      Platform: options.platform ?? 'test',
      MessageText: options.text ?? '',
      ...(options.messageId && { MessageId: options.messageId }),
      Target: { scope, targetId, BotId: options.botId ?? 'test-bot' },
      ...(scope === 'group' ? { SpaceId: `GROUP:${targetId}`, ChannelId: targetId, GuildId: targetId } : {}),
      ...(scope === 'channel' ? { SpaceId: `GUILD:${targetId}`, ChannelId: targetId } : {}),
      ...overrides
    } as Partial<Events[T]>);
  };

  return {
    event,
    groupMessage: (options: TestEventOptions = {}, overrides: Partial<Events['message.create']> = {}) => message('message.create', 'group', options, overrides),
    channelMessage: (options: TestEventOptions = {}, overrides: Partial<Events['message.create']> = {}) =>
      message('message.create', 'channel', options, overrides),
    privateMessage: (options: TestEventOptions = {}, overrides: Partial<Events['private.message.create']> = {}) =>
      message('private.message.create', 'c2c', options, overrides),
    interaction: (options: TestEventOptions & { private?: boolean } = {}, overrides: Partial<Events['interaction.create']> = {}) =>
      message(options.private ? 'private.interaction.create' : 'interaction.create', options.private ? 'c2c' : 'group', options, overrides)
  };
}

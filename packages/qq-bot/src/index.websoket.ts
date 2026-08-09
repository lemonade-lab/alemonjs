import { getQQBotBots, getQQBotConfig } from './config';
import { IntentsEnum } from './sdk/intents';
import { QQBotRegistry } from './sdk/registry';

let activeRegistry: QQBotRegistry | undefined;

export const getQQBotRegistry = () => activeRegistry;
export const start = () => {
  const config = getQQBotConfig();
  const { bots, defaultBot } = getQQBotBots();
  const registry = new QQBotRegistry(defaultBot);
  activeRegistry = registry;

  const notPrivateIntents = [
    'GUILDS', // base
    'GUILD_MEMBERS', // base
    'GUILD_MESSAGE_REACTIONS',
    'DIRECT_MESSAGE',
    'PUBLIC_GUILD_MESSAGES'
  ] as IntentsEnum[];

  const isPrivateIntents = [
    'GUILDS', // base
    'GUILD_MEMBERS', // base
    'GUILD_MESSAGES',
    'GUILD_MESSAGE_REACTIONS',
    'DIRECT_MESSAGE',
    'FORUMS_EVENT'
  ] as IntentsEnum[];

  const isGroupIntents = ['GROUP_AND_C2C_EVENT'] as IntentsEnum[];

  const pubIntents = ['INTERACTION'] as IntentsEnum[];

  const intents = [] as IntentsEnum[];

  if (config?.is_private) {
    intents.push(...isPrivateIntents, ...pubIntents);
  } else {
    intents.push(...notPrivateIntents, ...isGroupIntents, ...pubIntents);
  }

  for (const [botId, botConfig] of bots) {
    const client = registry.add(botId, {
      ...botConfig,
      intents: botConfig.intents || intents,
      is_private: botConfig.is_private ?? false,
      sandbox: botConfig.sandbox ?? false,
      shard: botConfig.shard ?? [0, 1]
    });

    void client.connect(botConfig.gatewayURL);
  }
};

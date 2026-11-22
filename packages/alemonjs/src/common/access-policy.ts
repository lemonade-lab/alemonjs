import type { ActionTarget } from '../types/index.js';

export type AccessSelector = {
  platform?: string;
  botId?: string;
  channelId?: string;
  scope?: 'channel' | 'private';
};

export type AccessPolicy = { allow?: AccessSelector[]; deny?: AccessSelector[] };

export type AccessEvent = {
  Platform?: string;
  BotId?: string;
  ChannelId?: string;
  SpaceId?: string;
  OpenId?: string;
  Target?: ActionTarget;
  IsPrivate?: boolean;
};

export function getAccessTarget(name: string, event: AccessEvent): AccessSelector | undefined {
  if (!['message.create', 'private.message.create', 'interaction.create', 'private.interaction.create'].includes(name)) return;
  const target = event.Target;
  const isPrivate =
    name.startsWith('private.') || event.IsPrivate || (target ? target.scope === 'direct' || target.scope === 'c2c' : event.OpenId?.startsWith('DIRECT:'));
  const channelId = isPrivate ? undefined : target?.targetId ?? (event.SpaceId?.startsWith('GROUP:') ? event.SpaceId.slice(6) : event.ChannelId);
  return { platform: event.Platform, botId: target?.BotId ?? event.BotId, scope: isPrivate ? 'private' : 'channel', channelId };
}

function matches(selector: AccessSelector, target: AccessSelector): boolean {
  return Object.entries(selector).every(([key, value]) => target[key] === value);
}

type PolicyConfig = { access?: AccessPolicy; channelMentionOnly?: boolean; channelMentionOnlyByChannel?: Record<string, boolean> };

/** A framework denial always applies. A configured allow list requires a match. */
export function evaluateAccess(config: { processor?: PolicyConfig; apps?: unknown }, target: AccessSelector, appName?: string, checkMention = false) {
  const apps = config.apps;
  const entry = appName && isRecord(apps) && Object.hasOwn(apps, appName) ? apps[appName] : undefined;
  const policies = [
    ['processor', config.processor],
    [`apps.${appName}`, isRecord(entry) ? (entry as PolicyConfig) : undefined]
  ] as const;
  const matched: string[] = [];
  for (const [path, section] of policies) {
    if (!section) continue;
    const policy = section.access;
    if (!policy) continue;
    const denied = policy.deny?.findIndex(selector => matches(selector, target)) ?? -1;
    if (denied >= 0) return { allowed: false, rule: `${path}.access.deny[${denied}]`, matched };
    if (policy.allow === undefined) continue;
    const allowed = policy.allow.findIndex(selector => matches(selector, target));
    if (allowed < 0) return { allowed: false, rule: `${path}.access.allow (no match)`, matched };
    matched.push(`${path}.access.allow[${allowed}]`);
  }
  if (checkMention && target.scope === 'channel' && target.channelId) {
    for (const [path, section] of policies) {
      if (section?.channelMentionOnly === true) return { allowed: false, rule: `${path}.channelMentionOnly`, matched };
      const channels = section?.channelMentionOnlyByChannel;
      if (channels && Object.hasOwn(channels, target.channelId) && channels[target.channelId] === true) {
        return { allowed: false, rule: `${path}.channelMentionOnlyByChannel.${target.channelId}`, matched };
      }
    }
  }
  return { allowed: true, rule: matched.at(-1) ?? 'default', matched };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function validateAccessConfig(config: unknown): void {
  if (config == null) return;
  if (!isRecord(config)) throw new Error('Configuration must be a mapping');

  const validate = (section: Record<string, unknown>, path: string) => {
    if (section.channelMentionOnly !== undefined && typeof section.channelMentionOnly !== 'boolean') {
      throw new Error(`${path}.channelMentionOnly must be a boolean`);
    }
    if (section.channelMentionOnlyByChannel !== undefined) {
      const channels = section.channelMentionOnlyByChannel;
      if (!isRecord(channels) || Object.entries(channels).some(([key, value]) => !key.trim() || typeof value !== 'boolean')) {
        throw new Error(`${path}.channelMentionOnlyByChannel must map channel IDs to booleans`);
      }
    }
    if (section.access === undefined) return;
    const policy = section.access;
    if (!isRecord(policy)) throw new Error(`${path}.access must be a mapping`);
    for (const [key, rules] of Object.entries(policy)) {
      const listPath = `${path}.access.${key}`;
      if (key !== 'allow' && key !== 'deny') throw new Error(`${listPath} is unknown; use allow or deny`);
      if (!Array.isArray(rules)) throw new Error(`${listPath} must be an array`);
      rules.forEach((rule, index) => {
        const rulePath = `${listPath}[${index}]`;
        if (!isRecord(rule) || !Object.keys(rule).length) throw new Error(`${rulePath} must specify at least one selector`);
        for (const [field, value] of Object.entries(rule)) {
          if (field === 'scope' && (value === 'channel' || value === 'private')) continue;
          if (['platform', 'botId', 'channelId'].includes(field) && typeof value === 'string' && value.trim() === value && value.length) continue;
          throw new Error(`${rulePath}.${field} is not a valid selector`);
        }
        if (rule.scope === 'private' && Object.hasOwn(rule, 'channelId')) throw new Error(`${rulePath}.channelId cannot match private events`);
        if (Object.hasOwn(rule, 'channelId') && !Object.hasOwn(rule, 'platform')) throw new Error(`${rulePath}.platform is required with channelId`);
      });
    }
  };

  if (config.processor != null && !isRecord(config.processor)) throw new Error('processor must be a mapping');
  if (isRecord(config.processor)) {
    if (config.processor.accessDiagnostics !== undefined && typeof config.processor.accessDiagnostics !== 'boolean') {
      throw new Error('processor.accessDiagnostics must be a boolean');
    }
    validate(config.processor, 'processor');
  }
  if (config.apps !== undefined && config.apps !== null && !isRecord(config.apps) && !Array.isArray(config.apps)) {
    throw new Error('apps must be a mapping or a list of app names');
  }
  if (isRecord(config.apps)) {
    for (const [name, entry] of Object.entries(config.apps)) {
      if (isRecord(entry)) validate(entry, `apps.${name}`);
    }
  }
}

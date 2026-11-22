import { getConfigValue } from '../../common/config.js';
import { evaluateAccess, getAccessTarget } from '../../common/access-policy.js';
import { logger } from '../../common/logger.js';
import type { EventKeys, Events } from '../../types/index.js';

const loggedDenials = new WeakMap<object, Set<string>>();
export const mentionReplayTargets = new WeakMap<Events[EventKeys], ReadonlySet<string>>();
export const blockedBeforeDispatch = new WeakSet<Events[EventKeys]>();

export function requiresChannelMention(event: Events[EventKeys], appName: string): boolean {
  const target = getAccessTarget('message.create', event);
  if (target?.scope !== 'channel' || !target.channelId) return false;
  const config = getConfigValue();
  return evaluateAccess(config, target, appName).allowed && !evaluateAccess(config, target, appName, true).allowed;
}

export function skipConfiguredEvent(name: EventKeys, event: Events[EventKeys], appName?: string): boolean {
  const replayTargets = mentionReplayTargets.get(event);
  if (replayTargets && (!appName || !replayTargets.has(appName))) return true;

  const target = getAccessTarget(name, event);
  if (!target) return false;

  const config = getConfigValue();
  const decision = evaluateAccess(config, target, appName, name === 'message.create' && !event.IsAtMe);
  if (decision.allowed || config.processor?.accessDiagnostics !== true) return !decision.allowed;

  const rules = loggedDenials.get(event) ?? new Set<string>();
  if (!rules.has(decision.rule)) {
    rules.add(decision.rule);
    loggedDenials.set(event, rules);
    logger.info('[access] Event denied', { name, messageId: event.MessageId, ...target, appName, rule: decision.rule });
  }
  return true;
}

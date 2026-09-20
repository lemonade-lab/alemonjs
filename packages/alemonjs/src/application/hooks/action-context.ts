import type { ActionContext, ActionTarget, MessagingActionMap } from '../../types';
import { createResult, ResultCode, sendAction, getCurrentEvent, type Result } from './common';

export const resolveActionContext = (context?: ActionContext): ActionContext => {
  const event = context ?? getCurrentEvent() ?? {};
  const target = resolveActionTarget(event);

  return {
    ...event,
    ...(target && { Target: target }),
    BotId: target?.BotId ?? event.BotId,
    GuildId: event.GuildId ?? (target?.scope === 'group' ? target.targetId : undefined),
    ChannelId: event.ChannelId ?? (target && ['group', 'channel'].includes(target.scope) ? target.targetId : undefined),
    UserId: event.UserId ?? (target?.scope === 'c2c' ? target.targetId : undefined)
  };
};
export const resolveActionTarget = (context: ActionContext): ActionTarget | undefined => {
  if (context.Target) {
    return context.Target;
  }
  if (context.SpaceId?.startsWith('GROUP:')) {
    return { scope: 'group', targetId: context.SpaceId.slice(6), BotId: context.BotId };
  }
  if (context.SpaceId?.startsWith('GUILD:')) {
    return { scope: 'channel', targetId: context.ChannelId || context.SpaceId.slice(6), BotId: context.BotId };
  }
  if (context.IsPrivate && context.UserId) {
    return { scope: 'c2c', targetId: context.UserId, BotId: context.BotId };
  }

  return undefined;
};

/** Internal typed action dispatcher, shared by semantic public hooks. */
export const createActionCaller = (context?: ActionContext) => {
  const event = resolveActionContext(context);

  return async <K extends keyof MessagingActionMap>(action: K, params: MessagingActionMap[K][0]): Promise<Result<MessagingActionMap[K][1]>> => {
    try {
      const explicit = 'target' in params ? params.target : undefined;
      const target = explicit ? { ...explicit, BotId: explicit.BotId ?? event.BotId } : resolveActionTarget(event);
      const results = await sendAction({ action, payload: { params, event, target, BotId: target?.BotId ?? event.BotId } });

      return results.find(result => result.code === ResultCode.Ok) ?? results[0] ?? createResult(ResultCode.Warn, `${action} is not supported`, null);
    } catch (error) {
      return createResult(ResultCode.Fail, action, error) as Result<MessagingActionMap[K][1]>;
    }
  };
};

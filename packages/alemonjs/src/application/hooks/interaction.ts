import { translate } from '../../common/i18n.js';
import { ActionTarget, ActionContext } from '../../types';
import { resolveActionContext, resolveActionTarget } from './action-context';
import { EventKeys, Events, Result, ResultCode, createResult, sendAction } from './common';

/** Acknowledge a platform interaction using the identifier supplied by the event. */
export const useInteraction = <T extends EventKeys>(event?: Events[T] | ActionContext) => {
  const valueEvent = resolveActionContext(event);

  const ack = async (params?: { InteractionId?: string; code?: number; target?: ActionTarget }): Promise<Result> => {
    const interactionId = params?.InteractionId || (valueEvent as { InteractionId?: string }).InteractionId;
    const eventTarget = resolveActionTarget(valueEvent);
    const target = params?.target || eventTarget;

    if (!interactionId) {
      return createResult(ResultCode.FailParams, translate('result.missing.interactionid'), null);
    }

    try {
      const results = await sendAction({
        action: 'interaction.ack',
        payload: {
          InteractionId: interactionId,
          event: valueEvent,
          BotId: target?.BotId ?? valueEvent.BotId,
          ...(target && { target }),
          params: { code: params?.code }
        }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || results[0] || createResult(ResultCode.Warn, translate('result.interaction.acknowledgement.is.not.supported'), null);
    } catch {
      return createResult(ResultCode.Fail, translate('result.failed.to.acknowledge.interaction'), null);
    }
  };

  return [{ ack }] as const;
};

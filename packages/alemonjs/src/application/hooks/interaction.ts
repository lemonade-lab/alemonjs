import { ActionTarget, EventKeys, Events, Result, ResultCode, createResult, getEventOrThrow, sendAction } from './common';

/** Acknowledge a platform interaction using the identifier supplied by the event. */
export const useInteraction = <T extends EventKeys>(event?: Events[T]) => {
  const valueEvent = getEventOrThrow(event);

  const ack = async (params?: { InteractionId?: string; code?: number; target?: ActionTarget }): Promise<Result> => {
    const interactionId = params?.InteractionId || (valueEvent as { InteractionId?: string }).InteractionId;
    const eventTarget = (valueEvent as { Target?: ActionTarget; BotId?: string }).Target;
    const target = params?.target || eventTarget;

    if (!interactionId) {
      return createResult(ResultCode.FailParams, 'Missing InteractionId', null);
    }

    try {
      const results = await sendAction({
        action: 'interaction.ack',
        payload: {
          InteractionId: interactionId,
          ...(target && { target }),
          params: { code: params?.code }
        }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Interaction acknowledgement is not supported', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to acknowledge interaction', null);
    }
  };

  return [{ ack }] as const;
};

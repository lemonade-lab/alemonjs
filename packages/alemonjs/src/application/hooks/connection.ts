import type { ActionContext } from '../../types';
import { createActionCaller, resolveActionContext } from './action-context';
import { ConnectionStatus } from '../../types';
import { Result, ResultCode, createResult, sendAction } from './common';

/** Read the current transport state without coupling applications to a platform SDK. */
export const useConnection = (context?: ActionContext) => {
  const event = resolveActionContext(context);
  const call = createActionCaller(event);
  const getStatus = async (params?: { BotId?: string }): Promise<Result<ConnectionStatus>> => {
    try {
      const results = await sendAction({
        action: 'connection.status',
        payload: { BotId: params?.BotId ?? event.BotId }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || results[0] || createResult(ResultCode.Warn, 'Connection status is not supported', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to get connection status', null);
    }
  };

  return [{ getStatus, gateway: () => call('connection.gateway', {}) }] as const;
};

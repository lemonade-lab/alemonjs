import { ConnectionStatus } from '../../types';
import { Result, ResultCode, createResult, sendAction } from './common';

/** Read the current transport state without coupling applications to a platform SDK. */
export const useConnection = () => {
  const getStatus = async (params?: { BotId?: string }): Promise<Result<ConnectionStatus>> => {
    try {
      const results = await sendAction({
        action: 'connection.status',
        payload: params || {}
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Connection status is not supported', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to get connection status', null);
    }
  };

  return [{ getStatus }] as const;
};

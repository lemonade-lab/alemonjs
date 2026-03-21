import { EventKeys, Events } from '../../types';
import { ResultCode } from '../../core/variable';

/**
 * 频道处理
 * @deprecated 待支持
 * @param event
 * @returns
 */
export const useChannel = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    });
    throw new Error('Invalid event: event must be an object');
  }

  // // 退出
  // const exit = async (channel_id?: string) => {
  //   return createResult(ResultCode.Warn, '暂未支持', channel_id)
  // }

  // // 加入
  // const join = async (channel_id?: string) => {
  //   return createResult(ResultCode.Warn, '暂未支持', channel_id)
  // }

  const channel = {
    // exit,
    // join
  };

  return [channel] as const;
};

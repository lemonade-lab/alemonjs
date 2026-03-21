import { EventKeys, Events } from '../../types';
import { ResultCode } from '../../core/variable';

/**
 * 用户处理
 * @deprecated 待支持
 * @param event
 * @returns
 */
export const useMember = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    });
    throw new Error('Invalid event: event must be an object');
  }

  // /**
  //  * 获取用户信息
  //  * @param user_id
  //  * @returns
  //  */
  // const information = async (user_id?: string) => {
  //   return createResult(ResultCode.Warn, '暂未支持', user_id)
  // }

  // /**
  //  * 禁言
  //  * @param all 是否是全体
  //  * @returns
  //  */
  // const mute = async (all: boolean = false) => {
  //   return createResult(ResultCode.Warn, '暂未支持', all)
  // }

  // /**
  //  * 解除禁言
  //  * @param all 是否是全体
  //  * @returns
  //  */
  // const unmute = async (all: boolean = false) => {
  //   return createResult(ResultCode.Warn, '暂未支持', all)
  // }

  // /**
  //  * 移除用户
  //  * @param user_id
  //  * @returns
  //  */
  // const remove = async (user_id?: string) => {
  //   return createResult(ResultCode.Warn, '暂未支持', user_id)
  // }

  const member = {
    // information,
    // mute,
    // unmute,
    // remove
  };

  return [member] as const;
};

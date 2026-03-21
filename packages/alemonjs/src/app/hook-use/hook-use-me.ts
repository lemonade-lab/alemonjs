import { User } from '../../types';
import { ResultCode } from '../../core/variable';
import { createResult, Result } from '../../core/utils';
import { sendAction } from '../../cbp/processor/actions';
/**
 * 获取我相关的数据
 */
export const useMe = () => {
  /**
   * 个人信息
   * @returns
   */
  const info = async (): Promise<Result<User | null>> => {
    try {
      const results = await sendAction({
        action: 'me.info',
        payload: {}
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      if (result) {
        const data: User | null = result?.data ?? null;

        return createResult(ResultCode.Ok, 'Successfully retrieved bot information', data);
      }

      return createResult(ResultCode.Warn, 'No bot information found', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to get bot information', null);
    }
  };

  /**
   * 加入的服务器列表
   */

  /**
   * 好友列表
   */

  /**
   * 私聊线程列表
   */

  const control = {
    info
  };

  return [control] as const;
};

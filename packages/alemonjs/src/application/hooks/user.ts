import { translate } from '../../common/i18n.js';
import { Result, ResultCode, User, createResult, sendAction } from './common';

/**
 * 用户信息查询（无需群/服务器上下文）
 */
export const useUser = () => {
  /**
   * 获取用户信息
   * @param userId 用户 ID
   */
  const info = async (params: { userId: string }): Promise<Result<User | null>> => {
    if (!params.userId) {
      return createResult(ResultCode.FailParams, translate('result.missing.userid'), null);
    }
    try {
      const results = await sendAction({
        action: 'user.info',
        payload: { UserId: params.userId }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      if (result) {
        return createResult(ResultCode.Ok, translate('result.successfully.retrieved.user.info'), result.data ?? null);
      }

      return createResult(ResultCode.Warn, translate('result.no.user.info.found'), null);
    } catch {
      return createResult(ResultCode.Fail, translate('result.failed.to.get.user.info'), null);
    }
  };

  const user = {
    info
  };

  return [user] as const;
};

import { EventKeys, Events, Options, Result, ResultCode, User, createResult, getEventOrThrow, sendAction } from './common';

/**
 * 使用提及。
 * @param {Object} event - 事件对象，包含触发提及的相关信息。
 * @throws {Error} - 如果 event 无效，抛出错误。
 */
export const useMention = <T extends EventKeys>(
  event?: Events[T]
): [
  {
    find: (options?: Options) => Promise<
      Result<User[]> & {
        count: number;
      }
    >;
    findOne: (options?: Options) => Promise<
      Result<User | null> & {
        count: number;
      }
    >;
  }
] => {
  const valueEvent = getEventOrThrow(event);

  // 提及数据缓存
  let res: User[] = null;

  /** 加载数据（带缓存） */
  const load = async () => {
    if (res) {
      return;
    }
    // 获取提及数据
    const results = await sendAction({
      action: 'mention.get',
      payload: { event: valueEvent }
    });
    // 提及数据通常在 results 中，找到 code 为 Ok 的项目，并将其 data 作为提及数据缓存起来
    const result = results.find(item => item.code === ResultCode.Ok);

    if (result) {
      res = result.data as User[];
    }
  };

  /** 按条件过滤，默认排除 bot */
  const match = (item: User, options: Options) => {
    if (options.UserId !== undefined && item.UserId !== options.UserId) {
      return false;
    }
    if (options.UserKey !== undefined && item.UserKey !== options.UserKey) {
      return false;
    }
    if (options.UserName !== undefined && item.UserName !== options.UserName) {
      return false;
    }
    if (options.IsMaster !== undefined && item.IsMaster !== options.IsMaster) {
      return false;
    }
    if (options.IsBot !== undefined && item.IsBot !== options.IsBot) {
      return false;
    }
    // 默认排除 bot
    if (options.IsBot === undefined && item.IsBot) {
      return false;
    }

    return true;
  };

  const mention = {
    find: async (options: Options = {}) => {
      try {
        await load();
      } catch (err) {
        const result = createResult<User[]>(ResultCode.Fail, err?.message || 'Failed to get mention data', null);

        return {
          ...result,
          count: 0
        };
      }
      if (!Array.isArray(res)) {
        return {
          ...createResult<User[]>(ResultCode.Warn, 'No mention data found', null),
          count: 0
        };
      }

      const data = res.filter(item => match(item, options));

      const result = createResult(ResultCode.Ok, 'Successfully retrieved mention data', data);

      return {
        ...result,
        count: data.length || 0
      };
    },
    findOne: async (options: Options = {}) => {
      const results = await mention.find(options);

      if (results.code !== ResultCode.Ok || !results.data?.length) {
        const result = createResult<User | null>(results.code, results.message, null);

        return {
          ...result,
          count: 0
        };
      }

      const data = results?.data[0];

      const result = createResult<User | null>(ResultCode.Ok, results.message, data);

      return {
        ...result,
        count: results.data?.length || 0
      };
    }
  };

  return [mention] as const;
};

import { EventKeys, Events, GuildInfo, Result, ResultCode, User, createResult, getEventOrThrow, sendAction } from './common';

/**
 * 获取我相关的数据
 * @param event 事件上下文；不传时使用当前事件上下文
 */
export const useMe = <T extends EventKeys>(event?: Events[T]) => {
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
   * 当前消息是否 @ 了机器人。
   *
   * 平台适配器会在标准化事件时填充 `IsAtMe`；未提供该能力的平台或非消息事件返回 `false`。
   */
  const isAtMe = (targetEvent?: Events[T]): boolean => {
    return Boolean(getEventOrThrow<T>(targetEvent ?? event).IsAtMe);
  };

  /**
   * @deprecated 请使用 isAtMe。该方法保留原有 Result 返回结构。
   */
  const isMentionMe = (targetEvent?: Events[T]): Result<boolean> => {
    return createResult(ResultCode.Ok, 'Successfully checked whether the bot was mentioned', isAtMe(targetEvent));
  };

  /**
   * 加入的服务器列表
   */
  const guilds = async (): Promise<Result<GuildInfo[]>> => {
    try {
      const results = await sendAction({
        action: 'me.guilds',
        payload: {}
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      if (result) {
        return createResult(ResultCode.Ok, 'Successfully retrieved guild list', result.data ?? []);
      }

      return createResult(ResultCode.Warn, 'No guild list found', []);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to get guild list', []);
    }
  };

  /**
   * 私聊线程列表
   */
  const threads = async (): Promise<Result<User | null>> => {
    try {
      const results = await sendAction({
        action: 'me.threads',
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
   * 好友列表
   */
  const friends = async (): Promise<Result<User | null>> => {
    try {
      const results = await sendAction({
        action: 'me.friends',
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

  const control = {
    info,
    isAtMe,
    isMentionMe,
    guilds,
    threads,
    friends
  };

  return [control] as const;
};

import { DataEnums, EventKeys, Events, User } from '../types';
import { ResultCode } from '../core/variable';
import { ChildrenApp } from './store';
import { createResult, Result } from '../core/utils';
import { sendAction } from '../cbp/processor/actions';
import { sendAPI } from '../cbp/processor/api';
import { BT, Format, Image, ImageFile, ImageURL, Link, MD, Mention, Text } from './message-format';

type Options = {
  UserId?: string;
  UserKey?: string;
  UserName?: string;
  IsMaster?: boolean;
  IsBot?: boolean;
};

/**
 * 使用提及。
 * @param {Object} event - 事件对象，包含触发提及的相关信息。
 * @throws {Error} - 如果 event 无效，抛出错误。
 */
export const useMention = <T extends EventKeys>(
  event: Events[T]
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
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    });
    throw new Error('Invalid event: event must be an object');
  }

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
      payload: { event }
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

/**
 * 消息处理
 * @param event
 * @returns
 */
export const useMessage = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    });
    throw new Error('Invalid event: event must be an object');
  }

  /**
   * 消息参数类型
   */
  type MessageParams = {
    format: Format | DataEnums[];
  };

  /**
   * 将 format 参数解析为 DataEnums[]
   */
  const resolveFormat = (params: MessageParams): DataEnums[] => {
    if (params.format instanceof Format) {
      return params.format.value;
    }

    return params.format;
  };

  /**
   * 发送消息（内部方法，兼容旧API）
   * @param val
   * @returns
   */
  const sendRaw = async (val: DataEnums[]): Promise<Result[]> => {
    if (!val || val.length === 0) {
      return [createResult(ResultCode.FailParams, 'Invalid val: val must be a non-empty array', null)];
    }
    const result = await sendAction({
      action: 'message.send',
      payload: {
        event,
        params: {
          format: val
        }
      }
    });

    return Array.isArray(result) ? result : [result];
  };

  // 新的消息处理接口

  class MessageController {
    #format: DataEnums[] = [];

    get currentFormat() {
      return this.#format;
    }

    // Text 相关方法
    addText(...args: Parameters<typeof Text>) {
      this.#format.push(Text(...args));

      return this;
    }

    addLink(...args: Parameters<typeof Link>) {
      this.#format.push(Link(...args));

      return this;
    }

    // Image 相关方法
    addImage(...args: Parameters<typeof Image>) {
      this.#format.push(Image(...args));

      return this;
    }

    addImageFile(...args: Parameters<typeof ImageFile>) {
      this.#format.push(ImageFile(...args));

      return this;
    }

    addImageURL(...args: Parameters<typeof ImageURL>) {
      this.#format.push(ImageURL(...args));

      return this;
    }

    // Mention 方法
    addMention(...args: Parameters<typeof Mention>) {
      this.#format.push(Mention(...args));

      return this;
    }

    addButtonGroup(...args: Parameters<typeof BT.group>) {
      this.#format.push(BT.group(...args));

      return this;
    }

    addButtonTemplate(...args: Parameters<typeof BT.template>) {
      this.#format.push(BT.template(...args));

      return this;
    }

    // Markdown 相关方法
    addMarkdown(...args: Parameters<typeof MD>) {
      this.#format.push(MD(...args));

      return this;
    }

    addMarkdownTemplate(...args: Parameters<typeof MD.template>) {
      this.#format.push(MD.template(...args));

      return this;
    }

    addFormat(val: DataEnums[]) {
      this.#format.push(...val);

      return this;
    }

    // 其他实用方法
    clear() {
      this.#format = [];

      return this;
    }

    /**
     * 发送消息
     * @param params 消息参数，支持 { format: Format } 或 DataEnums[]
     */
    send(params?: MessageParams | DataEnums[]) {
      if (!params) {
        // 不传参数时使用内部缓存
        return sendRaw(this.#format);
      }
      if (Array.isArray(params)) {
        // 兼容旧API：直接传入 DataEnums[]
        const dataToSend = params.length > 0 ? params : this.#format;

        return sendRaw(dataToSend);
      }

      // 新API：传入 { format }
      return sendRaw(resolveFormat(params));
    }
  }

  return [new MessageController()] as const;
};

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

/**
 * 废弃，请使用 useMessage
 * @deprecated
 * @param event
 * @returns
 */
export const useSend = <T extends EventKeys>(event: Events[T]) => {
  const [message] = useMessage(event);
  const send = (...val: DataEnums[]) => {
    return message.send(val);
  };

  return send;
};

/**
 * 废弃，请使用 useMessage
 * @deprecated
 * @param event
 * @returns
 */
export const useSends = <T extends EventKeys>(event: Events[T]) => {
  const [message] = useMessage(event);

  return [message.send] as const;
};

/**
 * 卸载模块
 * @param name
 * @throws {Error} - 如果 name 无效，抛出错误。
 */
export const unChildren = (name = 'main') => {
  if (!name || typeof name !== 'string') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid name: name must be a string',
      data: null
    });
    throw new Error('Invalid name: name must be a string');
  }
  const app = new ChildrenApp(name);

  app.un();
};

/**
 * 创建选择器
 * @param values
 * @returns
 */
export const onSelects = <T extends EventKeys[] | EventKeys>(values: T) => values;
global.onSelects = onSelects;

/**
 * 废弃,请使用onSelects
 * @deprecated
 * @param values
 * @returns
 */
export const createSelects = onSelects;

/**
 * 使用客户端
 * @param event
 * @param _ApiClass
 * @returns
 */
export const useClient = <T extends object>(event: any, _ApiClass: new (...args: any[]) => T) => {
  const client = new Proxy({} as T, {
    get(_target, prop) {
      return (...args: any[]) => {
        return sendAPI({
          action: 'client.api',
          payload: {
            event,
            key: String(prop),
            params: args
          }
        });
      };
    }
  });

  return [client] as const;
};

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

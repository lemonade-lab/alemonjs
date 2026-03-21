import { DataEnums, EventKeys, Events } from '../../types';
import { ResultCode } from '../../core/variable';
import { createResult, Result } from '../../core/utils';
import { sendAction } from '../../cbp/processor/actions';
import { Format } from '../message/message-format.js';

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

  const lightweight = {
    send(params?: MessageParams | DataEnums[]) {
      // send 直接走快速路径，无需创建完整 controller
      if (!params) {
        return sendRaw([]);
      }
      if (Array.isArray(params)) {
        return sendRaw(params.length > 0 ? params : []);
      }

      return sendRaw(resolveFormat(params));
    }
  };

  return [lightweight] as const;
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

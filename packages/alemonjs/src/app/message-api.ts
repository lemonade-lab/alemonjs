import { DataEnums, OnDataFormatFunc } from '../types';
import { ResultCode } from '../core/variable';
import { sendAction } from '../cbp/actions';

type BaseMap = {
  [key: string]: any;
};

/**
 * 创建原生value映射
 * @param event
 * @returns
 */
export const createEventValue = <T extends keyof R, R extends BaseMap>(event: { value: R[T] }) => {
  return event.value;
};

/**
 * 创建数据格式。
 * @param {...DataEnums[]} data - 要格式化的数据。
 * @returns {DataEnums[]} - 返回格式化后的数据数组。
 * @throws {Error} - 如果 data 无效，抛出错误。
 */
export const format: OnDataFormatFunc = (...data) => {
  if (!data || data.length === 0) {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid data: data cannot be empty',
      data: null
    });
    throw new Error('Invalid data: data cannot be empty');
  }

  return data;
};

global.format = format;

/**
 * 创建数据格式。
 * @param {...DataEnums[]} data - 要格式化的数据。
 * @returns {DataEnums[]} - 返回格式化后的数据数组。
 * @throws {Error} - 如果 data 无效，抛出错误。
 * 废弃，请使用 format
 * @deprecated
 */
export const createDataFormat = format;

/**
 * 向指定频道发送消息。
 * @param {string} SpaceId - 空间ID，可能是服务器ID、频道ID、群ID、聊天ID，或者是复合ID。总之，是框架给指定空间的唯一标识。也就是说，不能使用ChannelId作为该参数。
 * @param {DataEnums[]} data - 要发送的数据。
 * @throws {Error} - 如果 SpaceId 无效或发送失败，抛出错误。
 */
export const sendToChannel = async (SpaceId: string, data: DataEnums[]) => {
  if (!SpaceId || typeof SpaceId !== 'string') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid SpaceId: SpaceId must be a string',
      data: null
    });
    throw new Error('Invalid SpaceId: SpaceId must be a string');
  }

  return await sendAction({
    action: 'message.send.channel',
    payload: {
      ChannelId: SpaceId,
      params: {
        format: data
      }
    }
  });
};

/**
 * 向指定用户发送消息。
 * @param {string} OpenID - 开放ID，可能是用户ID、聊天ID，或是复合ID。总之，是框架给指定用户的唯一标识。也就说，不能使用UserId作为该参数。
 * @param {DataEnums[]} data - 要发送的数据。
 * @throws {Error} - 如果 user_id 无效或发送失败，抛出错误。
 */
export const sendToUser = async (OpenID: string, data: DataEnums[]) => {
  if (!OpenID || typeof OpenID !== 'string') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid OpenID: OpenID must be a string',
      data: null
    });
    throw new Error('Invalid OpenID: OpenID must be a string');
  }

  return await sendAction({
    action: 'message.send.user',
    payload: {
      UserId: OpenID,
      params: {
        format: data
      }
    }
  });
};

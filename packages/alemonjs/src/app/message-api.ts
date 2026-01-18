import { DataEnums, OnDataFormatFunc } from '../types';
import { ResultCode } from '../core/variable';
import { sendAction } from '../cbp/processor/actions';
import { createResult, Result } from '../core';

type BaseMap = {
  [key: string]: unknown;
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

type IntentResult = {
  // 仅允许bol和int类型作为意图值
  [key: string]: boolean | number;
  // 定义框架必须告知开发者的意图
  // 1. 图片相关
  // 图片发送最大数量。为0则禁止发送图片
  maxImageCount?: number;
  // 图片发送最大大小。单位：字节。为0则禁止发送图片
  maxImageSize?: number;
  // 2. 文字相关
  // 文字发送最大长度。为0则禁止发送文字
  maxTextLength?: number;
  // 3. markdown相关
  // markdown发送最大长度。为0则禁止发送markdown
  maxMarkdownLength?: number;
  // markdown 是否允许发送link
  allowMarkdownLink?: boolean;
  // markdown 是否允许发送图片
  allowMarkdownImage?: boolean;
  // markdown 是否允许发送mention
  allowMarkdownMention?: boolean;
  // 4. 文件相关
  // 文件发送最大数量。为0则禁止发送文件
  maxFileCount?: number;
  // 文件发送最大大小。单位：字节。为0则禁止发送文件
  maxFileSize?: number;
  // 5. 视频相关
  // 视频发送最大数量。为0则禁止发送视频
  maxVideoCount?: number;
  // 视频发送最大大小。单位：字节。为0则禁止发送视频
  maxVideoSize?: number;
  // 6. 平台组件相关
  // 是否允许发送按钮
  allowButton?: boolean;
  // 7. 组合拳
  // 是否允许图文混合发送
  allowMixImageText?: boolean;
  // 是否允许markdown与按钮混合发送
  allowMixMarkdownButton?: boolean;
};

/**
 * 得到消息意图。
 * 用于多平台下的降级消费。
 * @param event
 * @param data
 * @returns
 */
export const getMessageIntent = async (): Promise<Result<IntentResult>> => {
  const results = await sendAction({
    action: 'message.intent',
    payload: {}
  });

  return createResult(ResultCode.Ok, '获取成功', results[0]?.data ?? null);
};

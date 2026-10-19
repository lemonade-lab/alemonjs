import { Result } from "../../common/result.js";
import { DataEnums } from "../../types/message/index.js";
import { OnDataFormatFunc } from "../../types/event/index.js";
import "../../types/index.js";
import "../../common/index.js";
import { Format } from "./message-format.js";
//#region src/application/format/message-api.d.ts
/**
 * 创建数据格式。
 * @param {...DataEnums[]} data - 要格式化的数据。
 * @returns {DataEnums[]} - 返回格式化后的数据数组。
 * @throws {Error} - 如果 data 无效，抛出错误。
 * @deprecated 废弃，请使用 Format
 */
declare const format: OnDataFormatFunc;
/**
 * 创建数据格式。
 * @param {...DataEnums[]} data - 要格式化的数据。
 * @returns {DataEnums[]} - 返回格式化后的数据数组。
 * @throws {Error} - 如果 data 无效，抛出错误。
 * @deprecated 废弃，请使用 format
 */
declare const createDataFormat: OnDataFormatFunc;
/**
 * 主动消息 API
 */
declare class MessageDirect {
  static create(): MessageDirect;
  /**
   * 发送到频道
   * @param params
   */
  sendToChannel(params: {
    SpaceId: string;
    format: Format | DataEnums[];
    replyId?: string;
    BotId?: string;
  }): Promise<Result[]>;
  /**
   * 私信
   * @param params
   */
  sendToUser(params: {
    OpenID: string;
    format: Format | DataEnums[];
    BotId?: string;
  }): Promise<Result[]>;
  /**
   * Send to an explicitly scoped destination. Prefer this for group/C2C
   * platforms where the destination identifier is not a channel or user ID.
   */
  sendToTarget(params: {
    target: {
      scope: 'group' | 'c2c' | 'channel' | 'direct';
      targetId: string;
      BotId?: string;
    };
    format: Format | DataEnums[];
    replyId?: string;
  }): Promise<Result[]>;
}
/**
 * 向指定频道发送消息。
 * @param {string} SpaceId - 空间ID，可能是服务器ID、频道ID、群ID、聊天ID，或者是复合ID。总之，是框架给指定空间的唯一标识。也就是说，不能使用ChannelId作为该参数。
 * @param {DataEnums[]} data - 要发送的数据。
 * @throws {Error} - 如果 SpaceId 无效或发送失败，抛出错误。
 * @deprecated 废弃，推荐使用 MessageDirect.create().sendToChannel()
 */
declare const sendToChannel: (SpaceId: string, data: DataEnums[]) => Promise<Result[]>;
/**
 * 向指定用户发送消息。
 * @param {string} OpenID - 开放ID，可能是用户ID、聊天ID，或是复合ID。总之，是框架给指定用户的唯一标识。也就说，不能使用UserId作为该参数。
 * @param {DataEnums[]} data - 要发送的数据。
 * @throws {Error} - 如果 user_id 无效或发送失败，抛出错误。
 * @deprecated 废弃，推荐使用 MessageDirect.create().sendToUser()
 */
declare const sendToUser: (OpenID: string, data: DataEnums[]) => Promise<Result[]>;
type IntentResult = {
  [key: string]: boolean | number;
  maxImageCount?: number;
  maxImageSize?: number;
  maxTextLength?: number;
  maxMarkdownLength?: number;
  allowMarkdownLink?: boolean;
  allowMarkdownImage?: boolean;
  allowMarkdownMention?: boolean;
  maxFileCount?: number;
  maxFileSize?: number;
  maxVideoCount?: number;
  maxVideoSize?: number;
  allowButton?: boolean;
  allowMixImageText?: boolean;
  allowMixMarkdownButton?: boolean;
};
/**
 * 得到消息意图。
 * 用于多平台下的降级消费。
 * @deprecated 试验性功能，请勿使用
 * @param event
 * @param data
 * @returns
 */
declare const getMessageIntent: () => Promise<Result<IntentResult>>;
//#endregion
export { MessageDirect, createDataFormat, format, getMessageIntent, sendToChannel, sendToUser };
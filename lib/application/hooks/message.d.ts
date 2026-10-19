import { Result } from "../../common/result.js";
import { DataEnums } from "../../types/message/index.js";
import { ActionContext, MessageDelivery, MessageReceipt, MessagingActionMap, OutgoingMessage, StreamReceipt } from "../../types/messaging.js";
import { EventKeys, Events } from "../../types/event/map.js";
import { TypingOptions } from "../typing.js";
import "../../types/index.js";
import { Format } from "../format/message-format.js";
import "../index.js";
import "./common.js";
//#region src/application/hooks/message.d.ts
/**
 * 消息处理
 * @param event
 * @returns
 */
declare const useMessage: <T extends EventKeys>(event?: Events[T] | ActionContext) => readonly [{
  /** Keep input notifications alive for an explicitly awaited business task. */
  withTyping: <R>(task: () => Promise<R>, options?: TypingOptions) => Promise<R>;
  typing: (params?: MessagingActionMap['message.typing'][0]) => Promise<Result<MessageReceipt>>;
  stream: (params: MessagingActionMap['message.stream'][0]) => Promise<Result<StreamReceipt>>;
  /**
   * 发送消息
   * @param params 消息参数或 DataEnums 数组
   */
  send(params?: (MessageDelivery & {
    format?: Format | DataEnums[];
    content?: OutgoingMessage;
  }) | DataEnums[]): Promise<Result<MessageReceipt>[]>;
  /**
   * 删除消息
   * @param params.messageId 消息 ID，不传则删除触发消息
   */
  delete(params?: {
    messageId?: string;
  }): Promise<Result>;
  /**
   * 编辑消息
   * @param params 编辑参数
   */
  edit(params: {
    format: Format | DataEnums[];
    messageId?: string;
  }): Promise<Result>;
  /**
   * 置顶消息
   * @param params.messageId 消息 ID，不传则置顶触发消息
   */
  pin(params?: {
    messageId?: string;
  }): Promise<Result>;
  /**
   * 取消置顶消息
   * @param params.messageId 消息 ID，不传则取消置顶触发消息
   */
  unpin(params?: {
    messageId?: string;
  }): Promise<Result>;
  /**
   * 获取消息详情
   * @param params.messageId 消息 ID
   */
  get(params?: {
    messageId?: string;
  }): Promise<Result>;
}];
/**
 * 废弃，请使用 useMessage
 * @deprecated
 * @param event
 * @returns
 */
declare const useSend: <T extends EventKeys>(event?: Events[T]) => (...val: DataEnums[]) => Promise<Result<MessageReceipt>[]>;
/**
 * 废弃，请使用 useMessage
 * @deprecated
 * @param event
 * @returns
 */
declare const useSends: <T extends EventKeys>(event?: Events[T]) => readonly [(params?: (MessageDelivery & {
  format?: Format | DataEnums[];
  content?: OutgoingMessage;
}) | DataEnums[]) => Promise<Result<MessageReceipt>[]>];
//#endregion
export { useMessage, useSend, useSends };
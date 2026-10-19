import { Result } from "../../common/result.js";
import { ActionTarget } from "../../types/actions.js";
import { ActionContext, MediaReceipt, MediaUploadSession, MessageDelivery, MessagingActionMap } from "../../types/messaging.js";
import "../../types/index.js";
import "../index.js";
import "./common.js";
//#region src/application/hooks/media.d.ts
/**
 * 媒体管理（图片/音频/视频/文件）
 * @param event 事件上下文
 */
declare const useMedia: (event?: ActionContext) => readonly [{
  prepare: (params: MessagingActionMap['media.prepare'][0]) => Promise<Result<MediaUploadSession>>;
  finishPart: (params: MessagingActionMap['media.part.finish'][0]) => Promise<Result<unknown>>;
  complete: (params: MessagingActionMap['media.complete'][0]) => Promise<Result<MediaReceipt>>;
  upload: (params: Omit<MessageDelivery & {
    type: "audio" | "file" | "image" | "video";
    url?: string;
    data?: string;
    filePath?: string;
    fileId?: string;
    name?: string;
    content?: string;
  }, "content" | keyof MessageDelivery> & {
    target?: ActionTarget;
    send?: boolean;
  }) => Promise<Result<MediaReceipt>>;
  sendChannel: (params: (MessageDelivery & {
    type: "audio" | "file" | "image" | "video";
    url?: string;
    data?: string;
    filePath?: string;
    fileId?: string;
    name?: string;
    content?: string;
  }) & {
    channelId?: string;
    BotId?: string;
  }) => Promise<Result>;
  sendUser: (params: (MessageDelivery & {
    type: "audio" | "file" | "image" | "video";
    url?: string;
    data?: string;
    filePath?: string;
    fileId?: string;
    name?: string;
    content?: string;
  }) & {
    userId: string;
    BotId?: string;
  }) => Promise<Result>;
  send: (params: MessageDelivery & {
    type: "audio" | "file" | "image" | "video";
    url?: string;
    data?: string;
    filePath?: string;
    fileId?: string;
    name?: string;
    content?: string;
  }) => Promise<Result>;
}];
//#endregion
export { useMedia };
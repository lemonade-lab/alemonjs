import { Result } from "../../common/result.js";
import { ActionContext } from "../../types/messaging.js";
import { EventKeys, Events } from "../../types/event/map.js";
import "../../types/index.js";
import "./common.js";
//#region src/application/hooks/reaction.d.ts
/**
 * 表情回应管理
 * @param event 事件上下文
 */
declare const useReaction: <T extends EventKeys>(event?: Events[T] | ActionContext) => readonly [{
  add: (params: {
    emojiId: string;
    messageId?: string;
    channelId?: string;
  }) => Promise<Result>;
  remove: (params: {
    emojiId: string;
    messageId?: string;
    channelId?: string;
  }) => Promise<Result>;
  list: (params: {
    emojiId: string;
    messageId?: string;
    limit?: number;
    channelId?: string;
  }) => Promise<Result>;
}];
//#endregion
export { useReaction };
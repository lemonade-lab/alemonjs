import { Result } from "../../common/result.js";
import { EventKeys, Events } from "../../types/event/map.js";
import "./common.js";
//#region src/application/hooks/history.d.ts
/**
 * 消息历史记录
 * @param event 事件上下文
 */
declare const useHistory: <T extends EventKeys>(event?: Events[T]) => readonly [{
  list: (params?: {
    channelId?: string;
    limit?: number;
    before?: string;
    after?: string;
  }) => Promise<Result>;
}];
//#endregion
export { useHistory };
import { Result } from "../../common/result.js";
import { ActionContext } from "../../types/messaging.js";
import { EventKeys, Events } from "../../types/event/map.js";
import "../../types/index.js";
import "./common.js";
//#region src/application/hooks/announce.d.ts
/**
 * 频道公告管理
 * @param event 事件上下文
 */
declare const useAnnounce: <T extends EventKeys>(event?: Events[T] | ActionContext) => readonly [{
  set: (params: {
    messageId: string;
    channelId?: string;
    guildId?: string;
  }) => Promise<Result>;
  remove: (params?: {
    messageId?: string;
    guildId?: string;
  }) => Promise<Result>;
}];
//#endregion
export { useAnnounce };
import { Result } from "../../common/result.js";
import { ChannelInfo } from "../../types/standard.js";
import { ActionContext } from "../../types/messaging.js";
import { EventKeys, Events } from "../../types/event/map.js";
import "../../types/index.js";
import "./common.js";
//#region src/application/hooks/channel.d.ts
/**
 * 频道管理
 * @param event 事件上下文
 */
declare const useChannel: <T extends EventKeys>(event?: Events[T] | ActionContext) => readonly [{
  info: (params?: {
    channelId?: string;
  }) => Promise<Result<ChannelInfo | null>>;
  list: (params?: {
    guildId?: string;
  }) => Promise<Result<ChannelInfo[]>>;
  create: (params: {
    name: string;
    type?: string;
    parentId?: string;
    guildId?: string;
  }) => Promise<Result<ChannelInfo | null>>;
  update: (params: {
    channelId: string;
    name?: string;
    topic?: string;
    position?: number;
  }) => Promise<Result>;
  delete: (params: {
    channelId: string;
  }) => Promise<Result>;
}];
//#endregion
export { useChannel };
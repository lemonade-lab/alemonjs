import { Result } from "../../common/result.js";
import { User } from "../../types/event/base/user.js";
import { BotInfo, GuildInfo } from "../../types/standard.js";
import { ActionContext } from "../../types/messaging.js";
import { EventKeys, Events } from "../../types/event/map.js";
import "../../types/index.js";
import "./common.js";
//#region src/application/hooks/me.d.ts
/**
 * 获取我相关的数据
 * @param event 事件上下文；不传时使用当前事件上下文
 */
declare const useMe: <T extends EventKeys>(event?: Events[T] | ActionContext) => readonly [{
  share: (params?: {
    data?: string;
  }) => Promise<Result<{
    url: string;
  }>>;
  info: () => Promise<Result<BotInfo | null>>;
  isAtMe: (targetEvent?: Events[T]) => boolean;
  isMentionMe: (targetEvent?: Events[T]) => Result<boolean>;
  guilds: () => Promise<Result<GuildInfo[]>>;
  threads: () => Promise<Result<User | null>>;
  friends: () => Promise<Result<User | null>>;
}];
//#endregion
export { useMe };
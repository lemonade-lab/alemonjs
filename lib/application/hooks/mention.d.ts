import { Result } from "../../common/result.js";
import { User } from "../../types/event/base/user.js";
import { EventKeys, Events } from "../../types/event/map.js";
import { Options } from "./common.js";
//#region src/application/hooks/mention.d.ts
/**
 * 使用提及。
 * @param {Object} event - 事件对象，包含触发提及的相关信息。
 * @throws {Error} - 如果 event 无效，抛出错误。
 */
declare const useMention: <T extends EventKeys>(event?: Events[T]) => [{
  find: (options?: Options) => Promise<Result<User[]> & {
    count: number;
  }>;
  findOne: (options?: Options) => Promise<Result<User | null> & {
    count: number;
  }>;
}];
//#endregion
export { useMention };
import { Result } from "../../common/result.js";
import { User } from "../../types/event/base/user.js";
import "./common.js";
//#region src/application/hooks/user.d.ts
/**
 * 用户信息查询（无需群/服务器上下文）
 */
declare const useUser: () => readonly [{
  info: (params: {
    userId: string;
  }) => Promise<Result<User | null>>;
}];
//#endregion
export { useUser };
import { Result } from "../../common/result.js";
import { ActionContext } from "../../types/messaging.js";
import { ConnectionStatus } from "../../types/connection.js";
import "../../types/index.js";
import "./common.js";
//#region src/application/hooks/connection.d.ts
/** Read the current transport state without coupling applications to a platform SDK. */
declare const useConnection: (context?: ActionContext) => readonly [{
  readonly getStatus: (params?: {
    BotId?: string;
  }) => Promise<Result<ConnectionStatus>>;
  readonly gateway: () => Promise<Result<{
    url: string;
  }>>;
}];
//#endregion
export { useConnection };
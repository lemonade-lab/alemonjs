import { Result } from "../../../../common/result.js";
import { Apis } from "../../../../types/apis.js";
import "../../../../types/index.js";
import "../../../../common/index.js";
//#region src/application/runtime/cbp/processor/api.d.ts
/**
 * 发送接口请求
 * 优先级：直连通道 > fork IPC > WebSocket
 * @param data
 */
declare const sendAPI: (data: Apis) => Promise<Result[]>;
//#endregion
export { sendAPI };
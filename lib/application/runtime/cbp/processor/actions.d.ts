import { Result } from "../../../../common/result.js";
import { Actions } from "../../../../types/actions.js";
import "../../../../types/index.js";
import "../../../../common/index.js";
//#region src/application/runtime/cbp/processor/actions.d.ts
/**
 * 发送行为
 * 优先级：直连通道 > fork IPC > WebSocket
 * @param data
 */
declare const sendAction: (data: Actions) => Promise<Result[]>;
//#endregion
export { sendAction };
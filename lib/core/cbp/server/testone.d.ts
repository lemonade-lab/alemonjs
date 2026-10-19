import { ParsedMessage } from "../../../common/cbp/typings.js";
import { WebSocket } from "ws";
import { IncomingMessage } from "http";
//#region src/core/cbp/server/testone.d.ts
/**
 * @param ws
 * @param request
 */
declare const createTestOneController: (ws: WebSocket, _request: IncomingMessage) => {
  onMessage: (parsedMessage: ParsedMessage) => void;
  close: () => void;
  error: (err: Error) => void;
};
//#endregion
export { createTestOneController };
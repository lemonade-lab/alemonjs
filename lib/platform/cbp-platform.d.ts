import { EventsEnum } from "../types/event/map.js";
import "../types/index.js";
import { ActionReplyFunc, ApiReplyFunc } from "../common/cbp/typings.js";
//#region src/platform/cbp-platform.d.ts
declare const cbpPlatform: (url?: string, options?: {
  open: () => void;
}) => {
  send: (data: EventsEnum) => void;
  onactions: (reply: ActionReplyFunc) => void;
  onapis: (reply: ApiReplyFunc) => void;
};
//#endregion
export { cbpPlatform };
import { Result } from "../../common/result.js";
import { ActionTarget } from "../../types/actions.js";
import { ActionContext } from "../../types/messaging.js";
import { EventKeys, Events } from "../../types/event/map.js";
import "../../types/index.js";
import "./common.js";
//#region src/application/hooks/interaction.d.ts
/** Acknowledge a platform interaction using the identifier supplied by the event. */
declare const useInteraction: <T extends EventKeys>(event?: Events[T] | ActionContext) => readonly [{
  readonly ack: (params?: {
    InteractionId?: string;
    code?: number;
    target?: ActionTarget;
  }) => Promise<Result>;
}];
//#endregion
export { useInteraction };
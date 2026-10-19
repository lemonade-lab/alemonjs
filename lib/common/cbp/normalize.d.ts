import { Result } from "../result.js";
import { Actions } from "../../types/actions.js";
import { Apis } from "../../types/apis.js";
import "../../types/index.js";
import { CBPEnvelope, CBPError, CBPResult, NormalizedActionRequestMessage, NormalizedApiRequestMessage, NormalizedCBPMessage } from "./typings.js";
//#region src/common/cbp/normalize.d.ts
declare const isCBPEnvelope: (input: unknown) => input is CBPEnvelope;
declare const normalizeInboundMessage: (input: unknown) => NormalizedCBPMessage | null;
declare const toLegacyActionData: (message: NormalizedActionRequestMessage) => Actions;
declare const toLegacyApiData: (message: NormalizedApiRequestMessage) => Apis;
declare const isNormalizedActionRequest: (message: NormalizedCBPMessage | null | undefined) => message is NormalizedActionRequestMessage;
declare const isNormalizedApiRequest: (message: NormalizedCBPMessage | null | undefined) => message is NormalizedApiRequestMessage;
declare const getNormalizedDeviceId: (message: NormalizedCBPMessage) => string;
declare const getNormalizedEventRouteId: (message: NormalizedCBPMessage) => string;
declare const createActionRequestEnvelope: (data: Actions) => CBPEnvelope;
declare const createApiRequestEnvelope: (data: Apis) => CBPEnvelope;
declare const createActionResponseEnvelope: (data: Actions, payload: CBPResult[] | Result[], error?: CBPError) => CBPEnvelope;
declare const createApiResponseEnvelope: (data: Apis, payload: CBPResult[] | Result[], error?: CBPError) => CBPEnvelope;
declare const createEventEnvelope: (data: Record<string, unknown>) => CBPEnvelope;
//#endregion
export { createActionRequestEnvelope, createActionResponseEnvelope, createApiRequestEnvelope, createApiResponseEnvelope, createEventEnvelope, getNormalizedDeviceId, getNormalizedEventRouteId, isCBPEnvelope, isNormalizedActionRequest, isNormalizedApiRequest, normalizeInboundMessage, toLegacyActionData, toLegacyApiData };
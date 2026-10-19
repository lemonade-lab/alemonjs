import { Result } from "../result.js";
import { Actions } from "../../types/actions.js";
import { EventKeys } from "../../types/event/map.js";
import { Apis } from "../../types/apis.js";
import "../../types/index.js";
import "../index.js";
//#region src/common/cbp/typings.d.ts
/**
 * Legacy CBP message shape kept only for compatibility at protocol boundaries.
 * New internal logic should prefer `CBPEnvelope` or `NormalizedCBPMessage`.
 * @deprecated
 */
type ParsedMessage = {
  apiId?: string;
  actionId?: string;
  testID?: string;
  ChannelId?: string;
  GuildId?: string;
  name?: EventKeys;
  DeviceId?: string;
  activeId?: string;
  /**
   * 负载
   */
  payload?: any;
  [key: string]: any;
};
type CBPProtocolRole = 'platform' | 'app-client' | 'server';
type CBPMessageType = 'event' | 'action.req' | 'action.res' | 'api.req' | 'api.res' | 'control';
type CBPEndpoint = {
  role: CBPProtocolRole;
  deviceId?: string;
  appName?: string;
  platform?: string;
};
type CBPError = {
  code: string;
  message: string;
  retryable?: boolean;
  details?: unknown;
};
type CBPResult = {
  code: number;
  message: string;
  data?: unknown;
};
type CBPCapability = 'event' | 'action' | 'api' | 'full-receive';
type CBPControlPayload = {
  op: 'hello';
  capabilities?: CBPCapability[];
} | {
  op: 'heartbeat';
} | {
  op: 'goodbye';
  reason?: string;
} | {
  op: 'error';
  code: string;
  message: string;
} | {
  op: 'sync';
  env?: Record<string, string>;
};
type CBPEventPayload = {
  name: EventKeys | string;
  event: Record<string, unknown>;
  raw?: unknown;
};
type CBPActionRequestPayload = {
  action: string;
  input: Record<string, unknown>;
};
type CBPActionResponsePayload = {
  results: CBPResult[] | Result[];
};
type CBPApiRequestPayload = {
  api: string;
  input: Record<string, unknown>;
};
type CBPApiResponsePayload = {
  results: CBPResult[] | Result[];
};
type CBPEnvelope = {
  protocol: 'cbp';
  version: 1;
  type: CBPMessageType;
  id: string;
  replyTo?: string;
  timestamp: number;
  source: CBPEndpoint;
  target?: CBPEndpoint;
  payload?: CBPEventPayload | CBPActionRequestPayload | CBPActionResponsePayload | CBPApiRequestPayload | CBPApiResponsePayload | CBPControlPayload | unknown;
  error?: CBPError;
  meta?: Record<string, unknown>;
};
type NormalizedEventMessage = {
  kind: 'event';
  id: string;
  timestamp: number;
  deviceId?: string;
  sourceRole?: CBPProtocolRole;
  targetRole?: CBPProtocolRole;
  eventName: EventKeys | string;
  event: Record<string, unknown>;
  raw?: unknown;
  meta?: Record<string, unknown>;
};
type NormalizedActionRequestMessage = {
  kind: 'action.req';
  id: string;
  timestamp: number;
  deviceId?: string;
  sourceRole?: CBPProtocolRole;
  targetRole?: CBPProtocolRole;
  action: string;
  input: Record<string, unknown>;
  meta?: Record<string, unknown>;
};
type NormalizedActionResponseMessage = {
  kind: 'action.res';
  id: string;
  replyTo: string;
  timestamp: number;
  deviceId?: string;
  sourceRole?: CBPProtocolRole;
  targetRole?: CBPProtocolRole;
  results: Result[];
  error?: CBPError;
  meta?: Record<string, unknown>;
};
type NormalizedApiRequestMessage = {
  kind: 'api.req';
  id: string;
  timestamp: number;
  deviceId?: string;
  sourceRole?: CBPProtocolRole;
  targetRole?: CBPProtocolRole;
  api: string;
  input: Record<string, unknown>;
  meta?: Record<string, unknown>;
};
type NormalizedApiResponseMessage = {
  kind: 'api.res';
  id: string;
  replyTo: string;
  timestamp: number;
  deviceId?: string;
  sourceRole?: CBPProtocolRole;
  targetRole?: CBPProtocolRole;
  results: Result[];
  error?: CBPError;
  meta?: Record<string, unknown>;
};
type NormalizedControlMessage = {
  kind: 'control';
  id: string;
  timestamp: number;
  deviceId?: string;
  sourceRole?: CBPProtocolRole;
  targetRole?: CBPProtocolRole;
  op: CBPControlPayload['op'];
  payload?: Record<string, unknown>;
  error?: CBPError;
  meta?: Record<string, unknown>;
};
type NormalizedCBPMessage = NormalizedEventMessage | NormalizedActionRequestMessage | NormalizedActionResponseMessage | NormalizedApiRequestMessage | NormalizedApiResponseMessage | NormalizedControlMessage;
type CBPClientOptions = {
  open?: () => void;
  isFullReceive?: boolean;
};
type ActionReplyFunc = (data: Actions, consume: (payload: Result[]) => void) => void;
type ApiReplyFunc = (data: Apis, consume: (payload: Result[]) => void) => void;
//#endregion
export { ActionReplyFunc, ApiReplyFunc, CBPActionRequestPayload, CBPActionResponsePayload, CBPApiRequestPayload, CBPApiResponsePayload, CBPCapability, CBPClientOptions, CBPControlPayload, CBPEndpoint, CBPEnvelope, CBPError, CBPEventPayload, CBPMessageType, CBPProtocolRole, CBPResult, NormalizedActionRequestMessage, NormalizedActionResponseMessage, NormalizedApiRequestMessage, NormalizedApiResponseMessage, NormalizedCBPMessage, NormalizedControlMessage, NormalizedEventMessage, ParsedMessage };
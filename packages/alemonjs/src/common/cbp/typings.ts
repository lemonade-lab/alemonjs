import type { EventKeys, Apis, Actions } from '../../types/index.js';
import type { Result } from '../index.js';

/**
 * Legacy CBP message shape kept only for compatibility at protocol boundaries.
 * New internal logic should prefer `CBPEnvelope` or `NormalizedCBPMessage`.
 * @deprecated
 */
export type ParsedMessage = {
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
  // 其他信息
  [key: string]: any;
};

export type CBPProtocolRole = 'platform' | 'app-client' | 'server';

export type CBPMessageType = 'event' | 'action.req' | 'action.res' | 'api.req' | 'api.res' | 'control';

export type CBPEndpoint = {
  role: CBPProtocolRole;
  deviceId?: string;
  appName?: string;
  platform?: string;
};

export type CBPError = {
  code: string;
  message: string;
  retryable?: boolean;
  details?: unknown;
};

export type CBPResult = {
  code: number;
  message: string;
  data?: unknown;
};

export type CBPCapability = 'event' | 'action' | 'api' | 'full-receive';

export type CBPControlPayload =
  | {
      op: 'hello';
      capabilities?: CBPCapability[];
    }
  | {
      op: 'heartbeat';
    }
  | {
      op: 'goodbye';
      reason?: string;
    }
  | {
      op: 'error';
      code: string;
      message: string;
    }
  | {
      // 内部兼容旧 active=sync
      op: 'sync';
      env?: Record<string, string>;
    };

export type CBPEventPayload = {
  name: EventKeys | string;
  event: Record<string, unknown>;
  raw?: unknown;
};

export type CBPActionRequestPayload = {
  action: string;
  input: Record<string, unknown>;
};

export type CBPActionResponsePayload = {
  results: CBPResult[] | Result[];
};

export type CBPApiRequestPayload = {
  api: string;
  input: Record<string, unknown>;
};

export type CBPApiResponsePayload = {
  results: CBPResult[] | Result[];
};

export type CBPEnvelope = {
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

export type NormalizedEventMessage = {
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

export type NormalizedActionRequestMessage = {
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

export type NormalizedActionResponseMessage = {
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

export type NormalizedApiRequestMessage = {
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

export type NormalizedApiResponseMessage = {
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

export type NormalizedControlMessage = {
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

export type NormalizedCBPMessage =
  | NormalizedEventMessage
  | NormalizedActionRequestMessage
  | NormalizedActionResponseMessage
  | NormalizedApiRequestMessage
  | NormalizedApiResponseMessage
  | NormalizedControlMessage;

export type CBPClientOptions = {
  open?: () => void;
  isFullReceive?: boolean; // 是否全量接收
};

export type ActionReplyFunc = (data: Actions, consume: (payload: Result[]) => void) => void;

export type ApiReplyFunc = (data: Apis, consume: (payload: Result[]) => void) => void;

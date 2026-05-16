import type { Actions, Apis } from '../../types/index.js';
import type { Result } from '../result.js';
import type {
  CBPEnvelope,
  CBPError,
  CBPResult,
  NormalizedActionRequestMessage,
  NormalizedApiRequestMessage,
  NormalizedCBPMessage,
  ParsedMessage
} from './typings';

const now = () => Date.now();

const asRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
};

const asResults = (value: unknown) => {
  return Array.isArray(value) ? (value as CBPResult[]) : [];
};

const inferEventRouteId = (event: Record<string, unknown>) => {
  const channelId = event.ChannelId;
  const guildId = event.GuildId;
  const deviceId = event.DeviceId;

  if (typeof channelId === 'string' && channelId) {
    return channelId;
  }
  if (typeof guildId === 'string' && guildId) {
    return guildId;
  }
  if (typeof deviceId === 'string' && deviceId) {
    return deviceId;
  }

  return undefined;
};

const createRequestEnvelope = (type: 'action.req' | 'api.req', id: string, deviceId: string | undefined, payload: Record<string, unknown>): CBPEnvelope => {
  return {
    protocol: 'cbp',
    version: 1,
    type,
    id,
    timestamp: now(),
    source: {
      role: 'app-client',
      deviceId
    },
    payload
  };
};

const createResponseEnvelope = (
  type: 'action.res' | 'api.res',
  replyTo: string,
  deviceId: string | undefined,
  payload: CBPResult[] | Result[],
  error?: CBPError
): CBPEnvelope => {
  return {
    protocol: 'cbp',
    version: 1,
    type,
    id: `${replyTo}:res`,
    replyTo,
    timestamp: now(),
    source: {
      role: 'platform',
      deviceId
    },
    target: {
      role: 'app-client',
      deviceId
    },
    payload: {
      results: payload as CBPResult[]
    },
    error
  };
};

const normalizeEnvelopeMessage = (input: CBPEnvelope): NormalizedCBPMessage | null => {
  const payload = input.payload;
  const meta = asRecord(input.meta);
  const deviceId = input.source?.deviceId ?? input.target?.deviceId;
  const sourceRole = input.source?.role;
  const targetRole = input.target?.role;

  switch (input.type) {
    case 'event': {
      const eventPayload = asRecord(payload);
      const event = asRecord(eventPayload.event);

      return {
        kind: 'event',
        id: input.id,
        timestamp: input.timestamp,
        deviceId,
        sourceRole,
        targetRole,
        eventName: String(eventPayload.name ?? ''),
        event,
        raw: eventPayload.raw,
        meta
      };
    }
    case 'action.req': {
      const actionPayload = asRecord(payload);

      return {
        kind: 'action.req',
        id: input.id,
        timestamp: input.timestamp,
        deviceId,
        sourceRole,
        targetRole,
        action: String(actionPayload.action ?? ''),
        input: asRecord(actionPayload.input),
        meta
      };
    }
    case 'action.res':
      return {
        kind: 'action.res',
        id: input.id,
        replyTo: String(input.replyTo ?? ''),
        timestamp: input.timestamp,
        deviceId,
        sourceRole,
        targetRole,
        results: asResults(asRecord(payload).results) as any,
        error: input.error,
        meta
      };
    case 'api.req': {
      const apiPayload = asRecord(payload);

      return {
        kind: 'api.req',
        id: input.id,
        timestamp: input.timestamp,
        deviceId,
        sourceRole,
        targetRole,
        api: String(apiPayload.api ?? ''),
        input: asRecord(apiPayload.input),
        meta
      };
    }
    case 'api.res':
      return {
        kind: 'api.res',
        id: input.id,
        replyTo: String(input.replyTo ?? ''),
        timestamp: input.timestamp,
        deviceId,
        sourceRole,
        targetRole,
        results: asResults(asRecord(payload).results) as any,
        error: input.error,
        meta
      };
    case 'control': {
      const controlPayload = asRecord(payload);

      return {
        kind: 'control',
        id: input.id,
        timestamp: input.timestamp,
        deviceId,
        sourceRole,
        targetRole,
        op: String(controlPayload.op ?? 'error') as any,
        payload: controlPayload,
        error: input.error,
        meta
      };
    }
    default:
      return null;
  }
};

const normalizeLegacyMessage = (input: ParsedMessage & { action?: string; active?: string }): NormalizedCBPMessage | null => {
  if (input?.apiId) {
    if (Array.isArray(input.payload)) {
      return {
        kind: 'api.res',
        id: String(input.apiId),
        replyTo: String(input.apiId),
        timestamp: now(),
        deviceId: typeof input.DeviceId === 'string' ? input.DeviceId : undefined,
        results: input.payload as any,
        meta: {}
      };
    }

    return {
      kind: 'api.req',
      id: String(input.apiId),
      timestamp: now(),
      deviceId: typeof input.DeviceId === 'string' ? input.DeviceId : undefined,
      api: typeof input.action === 'string' ? input.action : '',
      input: asRecord(input.payload),
      meta: {}
    };
  }

  if (input?.actionId) {
    if (Array.isArray(input.payload)) {
      return {
        kind: 'action.res',
        id: String(input.actionId),
        replyTo: String(input.actionId),
        timestamp: now(),
        deviceId: typeof input.DeviceId === 'string' ? input.DeviceId : undefined,
        results: input.payload as any,
        meta: {}
      };
    }

    return {
      kind: 'action.req',
      id: String(input.actionId),
      timestamp: now(),
      deviceId: typeof input.DeviceId === 'string' ? input.DeviceId : undefined,
      action: typeof input.action === 'string' ? input.action : '',
      input: asRecord(input.payload),
      meta: {}
    };
  }

  if (input?.activeId && input?.active === 'sync') {
    const payload = asRecord(input.payload);

    return {
      kind: 'control',
      id: String(input.activeId),
      timestamp: now(),
      deviceId: typeof input.DeviceId === 'string' ? input.DeviceId : undefined,
      op: 'sync',
      payload,
      meta: {}
    };
  }

  if (input?.name) {
    const event = input as unknown as Record<string, unknown>;

    return {
      kind: 'event',
      id: typeof input.MessageId === 'string' ? input.MessageId : typeof input.DeviceId === 'string' ? input.DeviceId : `${input.name}:${now()}`,
      timestamp: typeof input.CreateAt === 'number' ? input.CreateAt : now(),
      deviceId: typeof input.DeviceId === 'string' ? input.DeviceId : undefined,
      eventName: input.name,
      event,
      raw: input.value,
      meta: {}
    };
  }

  return null;
};

export const isCBPEnvelope = (input: unknown): input is CBPEnvelope => {
  if (!input || typeof input !== 'object') {
    return false;
  }

  const value = input as Record<string, unknown>;

  return value.protocol === 'cbp' && value.version === 1 && typeof value.type === 'string' && typeof value.id === 'string';
};

export const normalizeInboundMessage = (input: unknown): NormalizedCBPMessage | null => {
  if (!input || typeof input !== 'object') {
    return null;
  }

  if (isCBPEnvelope(input)) {
    return normalizeEnvelopeMessage(input);
  }

  return normalizeLegacyMessage(input as ParsedMessage & { action?: string; active?: string });
};

export const toLegacyActionData = (message: NormalizedActionRequestMessage): Actions => {
  return {
    action: message.action,
    payload: message.input as Actions['payload'],
    actionId: message.id,
    DeviceId: message.deviceId
  } as Actions;
};

export const toLegacyApiData = (message: NormalizedApiRequestMessage): Apis => {
  const input = message.input;
  const key = typeof input.key === 'string' ? input.key : '';
  const params = Array.isArray(input.params) ? input.params : [];

  return {
    action: message.api,
    payload: {
      event: input.event,
      key,
      params
    },
    apiId: message.id,
    DeviceId: message.deviceId
  };
};

export const isNormalizedActionRequest = (message: NormalizedCBPMessage | null | undefined): message is NormalizedActionRequestMessage => {
  return message?.kind === 'action.req';
};

export const isNormalizedApiRequest = (message: NormalizedCBPMessage | null | undefined): message is NormalizedApiRequestMessage => {
  return message?.kind === 'api.req';
};

export const getNormalizedDeviceId = (message: NormalizedCBPMessage) => {
  return message.deviceId;
};

export const getNormalizedEventRouteId = (message: NormalizedCBPMessage) => {
  if (message.kind !== 'event') {
    return undefined;
  }

  return inferEventRouteId(message.event);
};

export const createActionRequestEnvelope = (data: Actions): CBPEnvelope => {
  return createRequestEnvelope('action.req', String(data.actionId ?? ''), data.DeviceId, {
    action: data.action,
    input: asRecord(data.payload)
  });
};

export const createApiRequestEnvelope = (data: Apis): CBPEnvelope => {
  return createRequestEnvelope('api.req', String(data.apiId ?? ''), data.DeviceId, {
    api: data.action,
    input: asRecord(data.payload)
  });
};

export const createActionResponseEnvelope = (data: Actions, payload: CBPResult[] | Result[], error?: CBPError): CBPEnvelope => {
  return createResponseEnvelope('action.res', String(data.actionId ?? ''), data.DeviceId, payload, error);
};

export const createApiResponseEnvelope = (data: Apis, payload: CBPResult[] | Result[], error?: CBPError): CBPEnvelope => {
  return createResponseEnvelope('api.res', String(data.apiId ?? ''), data.DeviceId, payload, error);
};

export const createEventEnvelope = (data: Record<string, unknown>): CBPEnvelope => {
  const deviceId = typeof data.DeviceId === 'string' ? data.DeviceId : undefined;
  const eventName = typeof data.name === 'string' ? data.name : '';
  const event = { ...data };

  return {
    protocol: 'cbp',
    version: 1,
    type: 'event',
    id: typeof data.MessageId === 'string' ? data.MessageId : typeof deviceId === 'string' ? `${deviceId}:${now()}` : `${eventName}:${now()}`,
    timestamp: typeof data.CreateAt === 'number' ? data.CreateAt : now(),
    source: {
      role: 'platform',
      deviceId
    },
    payload: {
      name: eventName,
      event,
      raw: data.value
    },
    meta: {
      routeId: inferEventRouteId(event)
    }
  };
};

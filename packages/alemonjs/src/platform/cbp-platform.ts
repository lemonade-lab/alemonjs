import * as flattedJSON from 'flatted';
import { WebSocket } from 'ws';
import { Result, ResultCode, createWSConnector, deviceId, sanitizeForSerialization } from '../common/index.js';
import type { ActionReplyFunc, ApiReplyFunc } from '../common/cbp/typings.js';
import type { Actions, Apis, EventsEnum } from '../types/index.js';
import { createDirectClient, type DirectChannel } from '../common/direct-channel.js';
import {
  createActionResponseEnvelope,
  createApiResponseEnvelope,
  createEventEnvelope,
  isNormalizedActionRequest,
  isNormalizedApiRequest,
  normalizeInboundMessage,
  toLegacyActionData,
  toLegacyApiData
} from '../common/cbp/normalize.js';

const dispatchLegacyActionHandlers = (actionReplys: ActionReplyFunc[], replyAction: (data: Actions, payload: Result[]) => void, input: unknown) => {
  const normalized = normalizeInboundMessage(input);

  if (!isNormalizedActionRequest(normalized)) {
    return false;
  }

  const legacy = toLegacyActionData(normalized);

  for (const cb of actionReplys) {
    void cb(legacy, val => replyAction(legacy, val));
  }

  return true;
};

const dispatchLegacyApiHandlers = (apiReplys: ApiReplyFunc[], replyApi: (data: Apis, payload: Result[]) => void, input: unknown) => {
  const normalized = normalizeInboundMessage(input);

  if (!isNormalizedApiRequest(normalized)) {
    return false;
  }

  const legacy = toLegacyApiData(normalized);

  for (const cb of apiReplys) {
    void cb(legacy, val => replyApi(legacy, val));
  }

  return true;
};

const cbpPlatformDirect = (sockPath: string, open: () => void) => {
  const actionReplys: ActionReplyFunc[] = [];
  const apiReplys: ApiReplyFunc[] = [];
  let channel: DirectChannel | null = null;
  const pendingQueue: unknown[] = [];

  const send = (data: EventsEnum) => {
    data.DeviceId = deviceId;
    data.CreateAt = Date.now();
    const envelope = createEventEnvelope(data as unknown as Record<string, unknown>);

    if (channel) {
      channel.send(envelope);
    } else {
      pendingQueue.push(envelope);
    }
  };

  const replyAction = (data: Actions, payload: Result[]) => {
    channel?.send(createActionResponseEnvelope(data, payload));
  };

  const replyApi = (data: Apis, payload: Result[]) => {
    channel?.send(createApiResponseEnvelope(data, payload));
  };

  const onactions = (reply: ActionReplyFunc) => {
    actionReplys.push(reply);
  };

  const onapis = (reply: ApiReplyFunc) => {
    apiReplys.push(reply);
  };

  createDirectClient(sockPath, (data: unknown) => {
    if (dispatchLegacyApiHandlers(apiReplys, replyApi, data)) {
      return;
    }

    dispatchLegacyActionHandlers(actionReplys, replyAction, data);
  })
    .then(ch => {
      channel = ch;
      for (const msg of pendingQueue) {
        channel.send(msg);
      }
      pendingQueue.length = 0;

      open();

      logger.debug({
        code: ResultCode.Ok,
        message: '平台端已启用直连通道模式（Unix Domain Socket）',
        data: null
      });
    })
    .catch(err => {
      logger.error({
        code: ResultCode.Fail,
        message: '平台端直连通道建立失败，回退 fork IPC',
        data: err
      });
      cbpPlatformIPC(open, actionReplys, apiReplys);
    });

  return { send, onactions, onapis };
};

const cbpPlatformIPC = (open: () => void, existingActionReplys?: ActionReplyFunc[], existingApiReplys?: ApiReplyFunc[]) => {
  const actionReplys: ActionReplyFunc[] = existingActionReplys ?? [];
  const apiReplys: ApiReplyFunc[] = existingApiReplys ?? [];

  const send = (data: EventsEnum) => {
    if (typeof process.send === 'function') {
      data.DeviceId = deviceId;
      data.CreateAt = Date.now();
      const envelope = createEventEnvelope(data as unknown as Record<string, unknown>);

      process.send({ type: 'ipc:data', data: sanitizeForSerialization(envelope) });
    }
  };

  const replyAction = (data: Actions, payload: Result[]) => {
    if (typeof process.send === 'function') {
      process.send({
        type: 'ipc:data',
        data: sanitizeForSerialization(createActionResponseEnvelope(data, payload))
      });
    }
  };

  const replyApi = (data: Apis, payload: Result[]) => {
    if (typeof process.send === 'function') {
      process.send({
        type: 'ipc:data',
        data: sanitizeForSerialization(createApiResponseEnvelope(data, payload))
      });
    }
  };

  const onactions = (reply: ActionReplyFunc) => {
    actionReplys.push(reply);
  };

  const onapis = (reply: ApiReplyFunc) => {
    apiReplys.push(reply);
  };

  process.on('message', (message: unknown) => {
    try {
      const msg = typeof message === 'string' ? JSON.parse(message) : message;

      if (msg?.type === 'ipc:data') {
        if (dispatchLegacyApiHandlers(apiReplys, replyApi, msg.data)) {
          return;
        }

        dispatchLegacyActionHandlers(actionReplys, replyAction, msg.data);
      }
    } catch (error) {
      logger.error({
        code: ResultCode.Fail,
        message: 'IPC 平台端解析消息失败',
        data: error
      });
    }
  });

  open();

  logger.debug({
    code: ResultCode.Ok,
    message: '平台端已启用 IPC 极速通讯模式',
    data: null
  });

  return {
    send,
    onactions,
    onapis
  };
};

export const cbpPlatform = (
  url?: string,
  options = {
    open: () => {}
  }
) => {
  const { open = () => {} } = options;

  if (process.env.__ALEMON_DIRECT_SOCK && typeof process.send === 'function') {
    return cbpPlatformDirect(process.env.__ALEMON_DIRECT_SOCK, open);
  }

  if (process.env.__ALEMON_IPC === '1' && typeof process.send === 'function') {
    return cbpPlatformIPC(open);
  }

  const createCurrentURL = () => {
    if (url) {
      if (url.startsWith('ws://') || url.startsWith('wss://')) {
        return url;
      }

      if (/^\d+$/.test(url)) {
        return `ws://localhost:${url}`;
      }
    }

    if (process.env.__ALEMON_PLATFORM_WS_URL) {
      return process.env.__ALEMON_PLATFORM_WS_URL;
    }
  };
  const currentURL = createCurrentURL() || `ws://localhost:${process.env.port || 17117}`;

  const send = (data: EventsEnum) => {
    if (global.chatbotPlatform?.readyState === WebSocket.OPEN) {
      data.DeviceId = deviceId;
      data.CreateAt = Date.now();
      const envelope = createEventEnvelope(data as unknown as Record<string, unknown>);

      global.chatbotPlatform.send(flattedJSON.stringify(sanitizeForSerialization(envelope)));
    }
  };
  const actionReplys: ActionReplyFunc[] = [];
  const apiReplys: ApiReplyFunc[] = [];

  const replyAction = (data: Actions, payload: Result[]) => {
    if (global.chatbotPlatform?.readyState === WebSocket.OPEN) {
      global.chatbotPlatform.send(flattedJSON.stringify(createActionResponseEnvelope(data, payload)));
    }
  };

  const replyApi = (data: Apis, payload: Result[]) => {
    if (global.chatbotPlatform?.readyState === WebSocket.OPEN) {
      global.chatbotPlatform.send(flattedJSON.stringify(createApiResponseEnvelope(data, payload)));
    }
  };

  const onactions = (reply: ActionReplyFunc) => {
    actionReplys.push(reply);
  };

  const onapis = (reply: ApiReplyFunc) => {
    apiReplys.push(reply);
  };

  createWSConnector({
    url: currentURL,
    role: 'platform',
    globalKey: 'chatbotPlatform',
    onOpen: open,
    onMessage: (messageStr: string) => {
      try {
        const data = flattedJSON.parse(messageStr);

        if (dispatchLegacyApiHandlers(apiReplys, replyApi, data)) {
          return;
        }

        dispatchLegacyActionHandlers(actionReplys, replyAction, data);
      } catch (error) {
        logger.error({
          code: ResultCode.Fail,
          message: '解析消息失败',
          data: error
        });
      }
    }
  });

  return {
    send,
    onactions,
    onapis
  };
};

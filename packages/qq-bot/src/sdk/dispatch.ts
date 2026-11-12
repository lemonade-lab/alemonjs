export type RawDispatch = { op: 0; t: string; d: unknown; id?: string };
export type RawDispatchListener = (dispatch: RawDispatch) => void | Promise<void>;

export const isDispatch = (message: unknown): message is RawDispatch =>
  !!message &&
  typeof message === 'object' &&
  'op' in message &&
  message.op === 0 &&
  't' in message &&
  typeof message.t === 'string' &&
  message.t.length > 0 &&
  Object.hasOwn(message, 'd');

export const isDispatchObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

export const normalizeDispatch = <T extends RawDispatch>(message: T): T => {
  if (typeof message.id !== 'string' || !message.id || !isDispatchObject(message.d)) {
    return message;
  }

  const data = { ...message.d };

  if (message.t === 'INTERACTION_CREATE') {
    data.event_id = message.id;
  }
  if (data.id === undefined || data.id === null || data.id === '') {
    data.id = message.id;
  }

  return { ...message, d: data };
};

export const isControlEvent = (type: string) => type === 'READY' || type === 'RESUMED' || type === 'ERROR';

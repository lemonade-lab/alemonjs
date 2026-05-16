export const USER_AGENT_HEADER = 'user-agent';

export const USER_AGENT_HEADER_VALUE_MAP = {
  platform: 'platform',
  client: 'client',
  testone: 'testone'
} as const;

export const DEVICE_ID_HEADER = 'x-device-id';

export const FULL_RECEIVE_HEADER = 'x-full-receive';

export const timeoutTime = 1000 * 60 * 3;

export const reconnectInterval = 1000 * 6;

export const HEARTBEAT_INTERVAL = 1000 * 18;

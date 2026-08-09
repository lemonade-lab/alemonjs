import type { OneBotConnectionStatus } from './api';

let provider: (() => OneBotConnectionStatus) | undefined;

export const setConnectionStatusProvider = (next: () => OneBotConnectionStatus) => {
  provider = next;
};

export const getPublishedConnectionStatus = () => provider?.();

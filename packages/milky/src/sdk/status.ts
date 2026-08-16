import type { MilkyConnectionStatus } from './api';

let provider: (() => MilkyConnectionStatus) | undefined;

export const setConnectionStatusProvider = (next: () => MilkyConnectionStatus) => {
  provider = next;
};

export const getPublishedConnectionStatus = () => provider?.();

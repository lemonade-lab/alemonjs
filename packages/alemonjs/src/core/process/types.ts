export type AdapterPhase = 'idle' | 'booting' | 'control_ready' | 'transport_ready' | 'app_ready' | 'stopping' | 'failed';

export type AdapterProtocolVersion = 'legacy' | 'v2';

export type AdapterTransportMode = 'unknown' | 'ipc' | 'direct' | 'ws' | 'import';

export type AdapterBootTimings = {
  forkToReadyMs?: number;
  readyToTransportReadyMs?: number;
  transportReadyToAppReadyMs?: number;
};

export type ProcessAdapterState = {
  phase: AdapterPhase;
  protocolVersion: AdapterProtocolVersion;
  transportMode: AdapterTransportMode;
  restartCount: number;
  consecutiveFailures: number;
  legacyReadyMode: boolean;
  startedAt?: number;
  lastReadyAt?: number;
  lastTransportReadyAt?: number;
  lastAppReadyAt?: number;
  bootTimings: AdapterBootTimings;
  lastError?: string | null;
};

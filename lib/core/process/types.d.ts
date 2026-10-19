//#region src/core/process/types.d.ts
type AdapterPhase = 'idle' | 'booting' | 'control_ready' | 'transport_ready' | 'app_ready' | 'stopping' | 'failed';
type AdapterProtocolVersion = 'legacy' | 'v2';
type AdapterTransportMode = 'unknown' | 'ipc' | 'direct' | 'ws' | 'import';
type AdapterBootTimings = {
  forkToReadyMs?: number;
  readyToTransportReadyMs?: number;
  transportReadyToAppReadyMs?: number;
};
type ProcessAdapterState = {
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
//#endregion
export { AdapterBootTimings, AdapterPhase, AdapterProtocolVersion, AdapterTransportMode, ProcessAdapterState };
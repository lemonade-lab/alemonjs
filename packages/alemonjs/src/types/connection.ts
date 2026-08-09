/** Platform connection lifecycle state. */
export type ConnectionState = 'idle' | 'connecting' | 'ready' | 'reconnecting' | 'offline' | 'stopped';

export type ConnectionBotStatus = {
  BotId: string;
  state: ConnectionState;
  transport?: string | null;
  reconnectAttempts?: number;
  heartbeatAcknowledged?: boolean;
  resumed?: boolean;
  lastError?: string;
};

/** A platform-level view. `bots` is always present, including single-bot platforms. */
export type ConnectionStatus = {
  Platform?: string;
  state: ConnectionState;
  bots: ConnectionBotStatus[];
};

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

/** Retained, non-secret state for an interactive platform login challenge. */
export type ConnectionLoginStatus = {
  state: 'not_required' | 'awaiting_qrcode' | 'authorized' | 'failed';
  type?: 'qrcode';
  loginId?: string;
  qrcode?: {
    url: string;
    imageBase64?: string;
    format?: 'png';
    refreshed?: boolean;
  };
  updatedAt: number;
  lastError?: string;
};

/** A platform-level view. `bots` is always present, including single-bot platforms. */
export type ConnectionStatus = {
  Platform?: string;
  state: ConnectionState;
  bots: ConnectionBotStatus[];
  /** Present when the adapter supports interactive credential acquisition. */
  login?: ConnectionLoginStatus;
};

/**
 * Connection lifecycle events are intentionally not message events.  The
 * index signature lets generic event hooks safely inspect their common
 * diagnostic fields without pretending that a QR challenge has a message.
 */
type PlatformLifecycleEventBase = {
  /** Kept for compatibility with generic event hooks; lifecycle events carry no message body. */
  value: string;
  GuildId?: string;
  ChannelId?: string;
  UserId?: string;
  UserKey?: string;
  MessageId?: string;
  MessageText?: string;
  _sendAttempted?: boolean;
  _has_send_attempt?: boolean;
  _sendSucceeded?: boolean;
  _has_send_success?: boolean;
  _lastSendError?: string | null;
  _last_send_error?: string | null;
};

/** A QR code challenge emitted by a platform before credentials are available. */
export type PlatformLoginQRCodeEvent = PlatformLifecycleEventBase & {
  name: 'login.qrcode';
  Platform: string;
  /** Stable only for this QR challenge. Use it to correlate refreshed QR codes and completion. */
  LoginId: string;
  LoginType: 'qrcode';
  QRCode: {
    url: string;
    /** PNG encoded as base64 so remote consumers do not need access to the adapter filesystem. */
    imageBase64?: string;
    format?: 'png';
    refreshed?: boolean;
  };
};

/** Emitted after an interactive login has completed and its credentials have been persisted. */
export type PlatformLoginSuccessEvent = PlatformLifecycleEventBase & {
  name: 'login.success';
  Platform: string;
  LoginId: string;
  LoginType: 'qrcode';
  BotId?: string;
  UserId?: string;
};

/** Emitted when the platform's usable transport is ready, with or without interactive login. */
export type PlatformConnectionReadyEvent = PlatformLifecycleEventBase & {
  name: 'connection.ready';
  Platform: string;
  BotId?: string;
  transport?: string | null;
  resumed?: boolean;
};

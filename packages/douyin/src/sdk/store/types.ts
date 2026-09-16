// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
export interface AccountSession {
  cookies: string;
  /** msToken 单独存以便快速过期检查 */
  msToken?: string;
  /** Desktop IM 稳定设备 ID（324+7 位数字，webid 形态；Cookie 通道发送必需） */
  deviceId?: string;
  /** 上次验证时间（ISO） */
  verifiedAt?: string;
}

/** ticket_guard 密钥记录（与 ImClient 的 StoredTicketGuard 结构一致） */
export interface TicketGuardRecord {
  privateKeyPem: string;
  createdAt: string;
}

/** 落盘的账号会话记录，对应 `<accountsDir>/<platformUid>/session.json` */
export interface AccountRecord {
  platformUid: string;
  session: AccountSession;
  /** 登录接口返回的 user_data 等原始资料 */
  userData?: Record<string, unknown>;
  screenName?: string;
  avatarUrl?: string;
  /** ticket_guard 密钥（ImClient 持久化用） */
  ticketGuard?: TicketGuardRecord;
  /** 登录时的桌面设备身份（device_register 签发，参考 douyin-im deviceProfile） */
  deviceProfile?: { deviceId: string; installId: string; guid: string };
  createdAt: string;
  updatedAt: string;
}

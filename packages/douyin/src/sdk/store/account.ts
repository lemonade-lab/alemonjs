// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync, renameSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { AccountRecord, TicketGuardRecord } from './types.js';

const SESSION_FILE = 'session.json';

function validateUid(uid: string): void {
  if (!/^[1-9]\d*$/.test(uid)) {
    throw new Error('platformUid must be a positive decimal ID');
  }
}

export interface AccountStoreOptions {
  /** 账号数据根目录，默认 `./data/accounts` */
  accountsDir?: string;
}

/** 账号会话持久化：每个账号一个目录 `<accountsDir>/<platformUid>/session.json` */
export class AccountStore {
  private readonly accountsDir: string;

  constructor(options: AccountStoreOptions = {}) {
    this.accountsDir = options.accountsDir ?? join(process.cwd(), 'data', 'accounts');
    mkdirSync(this.accountsDir, { recursive: true });
  }

  /** 读取单个账号；不存在返回 undefined */
  load(platformUid: string): AccountRecord | undefined {
    validateUid(platformUid);
    const file = join(this.accountsDir, platformUid, SESSION_FILE);

    if (!existsSync(file)) {
      return undefined;
    }

    return JSON.parse(readFileSync(file, 'utf8')) as AccountRecord;
  }

  /** 写入/覆盖账号 */
  save(platformUid: string, data: AccountRecord): void {
    validateUid(platformUid);
    if (data.platformUid !== platformUid) {
      throw new Error('Session account ID mismatch');
    }
    const dir = join(this.accountsDir, platformUid);

    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const temporary = join(dir, `${SESSION_FILE}.${randomUUID()}.tmp`);

    try {
      writeFileSync(temporary, JSON.stringify(data, null, 2), { mode: 0o600, flag: 'wx' });
      renameSync(temporary, join(dir, SESSION_FILE));
    } finally {
      if (existsSync(temporary)) {
        unlinkSync(temporary);
      }
    }
  }

  /** 更新 ticket_guard 密钥（ImClient 持久化用） */
  updateTicketGuard(platformUid: string, record: TicketGuardRecord): void {
    const prev = this.load(platformUid);

    if (!prev) {
      return;
    }
    this.save(platformUid, { ...prev, ticketGuard: record, updatedAt: new Date().toISOString() });
  }

  /** Desktop IM 稳定设备 ID（324+7 位数字）；无则生成并立即落盘 */
  ensureDeviceId(platformUid: string): string {
    const current = this.load(platformUid)?.session.deviceId?.trim();

    if (current) {
      return current;
    }
    const deviceId = `324${String(Math.floor(Math.random() * 10_000_000)).padStart(7, '0')}`;
    const record = this.load(platformUid);

    if (record) {
      this.save(platformUid, {
        ...record,
        session: { ...record.session, deviceId },
        updatedAt: new Date().toISOString()
      });
    }

    return deviceId;
  }

  /** 列出所有已落盘账号 */
  list(): AccountRecord[] {
    if (!existsSync(this.accountsDir)) {
      return [];
    }

    return readdirSync(this.accountsDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && /^[1-9]\d*$/.test(d.name))
      .map(d => this.load(d.name))
      .filter((a): a is AccountRecord => a !== undefined);
  }

  /** 删除该账号的会话文件，不删除同目录内的其他用户文件。 */
  remove(platformUid: string): void {
    validateUid(platformUid);
    const file = join(this.accountsDir, platformUid, SESSION_FILE);

    if (existsSync(file)) {
      unlinkSync(file);
    }
  }
}

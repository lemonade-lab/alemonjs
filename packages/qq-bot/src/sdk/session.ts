import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';

export type PersistedSession = { botId: string; sessionId: string; sequence: number };

export interface SessionStore {
  load(botId: string): Promise<PersistedSession | null>;
  save(session: PersistedSession): Promise<void>;
  clear(botId: string): Promise<void>;
}

/** Default store. Sessions contain no access token or application secret. */
export class FileSessionStore implements SessionStore {
  #queues = new Map<string, Promise<void>>();
  #generations = new Map<string, number>();

  constructor(private readonly root = join(process.cwd(), '.data', 'qq-bot', 'sessions')) {}

  #path(botId: string) {
    return join(this.root, `${encodeURIComponent(botId)}.json`);
  }

  async load(botId: string): Promise<PersistedSession | null> {
    try {
      const value = JSON.parse(await readFile(this.#path(botId), 'utf8')) as PersistedSession;

      return value?.botId === botId && typeof value.sessionId === 'string' && Number.isFinite(value.sequence) ? value : null;
    } catch {
      return null;
    }
  }

  async save(session: PersistedSession) {
    const generation = this.#generations.get(session.botId) || 0;
    await this.#enqueue(session.botId, async () => {
      // An invalid-session clear happened after this save was scheduled.
      if (generation !== (this.#generations.get(session.botId) || 0)) return;
      const path = this.#path(session.botId);
      const temp = `${path}.${process.pid}.${randomUUID()}.tmp`;

      await mkdir(dirname(path), { recursive: true });
      await writeFile(temp, JSON.stringify(session), 'utf8');
      await rename(temp, path);
    });
  }

  async clear(botId: string) {
    this.#generations.set(botId, (this.#generations.get(botId) || 0) + 1);
    await this.#enqueue(botId, async () => {
      await unlink(this.#path(botId)).catch(() => undefined);
    });
  }

  #enqueue(botId: string, task: () => Promise<void>) {
    const previous = this.#queues.get(botId) || Promise.resolve();
    const next = previous.catch(() => undefined).then(task);
    this.#queues.set(botId, next);
    void next
      .finally(() => {
        if (this.#queues.get(botId) === next) this.#queues.delete(botId);
      })
      .catch(() => undefined);

    return next;
  }
}

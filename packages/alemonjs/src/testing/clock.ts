import { AsyncResource } from 'node:async_hooks';
import { runtimeExecution, trackRuntimeTask } from '../common/runtime-scope.js';

/** Only framework-managed timers use this clock. Native timers remain native. */
export function createTestClock(initial = 0) {
  if (!Number.isFinite(initial)) {
    throw new Error('Initial clock time must be finite');
  }
  let time = initial;
  let sequence = 0;
  const tasks = new Map<number, { at: number; ms: number; repeat: boolean; callback: () => void }>();

  return {
    now: () => time,
    timers: {
      set(callback: () => void, ms: number, repeat: boolean) {
        const id = ++sequence;
        // Preserve event/owner context, but attribute timer work to the advancing run.
        const bound = AsyncResource.bind((execution: ReturnType<typeof runtimeExecution.getStore>) => runtimeExecution.run(execution, callback));

        tasks.set(id, { at: time + ms, ms, repeat, callback: () => bound(runtimeExecution.getStore()) });

        return id;
      },
      clear(id: number) {
        tasks.delete(id);
      }
    },
    async advance(ms: number) {
      if (!Number.isFinite(ms) || ms < 0) {
        throw new Error('Clock advance must be finite and non-negative');
      }
      const end = time + ms;

      for (let count = 0; ; count++) {
        let next: [number, { at: number; ms: number; repeat: boolean; callback: () => void }] | undefined;

        for (const entry of tasks) {
          if (entry[1].at <= end && (!next || entry[1].at < next[1].at)) {
            next = entry;
          }
        }
        if (!next) {
          break;
        }
        if (count >= 10000) {
          throw new Error('Virtual timer limit exceeded');
        }
        const [id, task] = next;

        time = task.at;
        if (task.repeat) {
          task.at += task.ms;
        } else {
          tasks.delete(id);
        }
        trackRuntimeTask(task.callback());
        await new Promise<void>(resolve => setImmediate(resolve));
      }
      time = end;
    },
    clear() {
      tasks.clear();
    },
    get pending() {
      return tasks.size;
    }
  };
}

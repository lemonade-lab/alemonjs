import {
  runtimeScope,
  trackRuntimeTask,
  runtimeSetTimeout as setTimeout,
  runtimeSetInterval as setInterval,
  runtimeClearTimeout as clearTimeout,
  runtimeClearInterval as clearInterval
} from '../common/runtime-scope.js';
export type TypingOptions = {
  duration?: number;
  intervalMs?: number;
  maxDurationMs?: number;
  signal?: AbortSignal;
  onError?: (error: unknown) => void | Promise<void>;
};

/** Starts immediately, never overlaps requests, and only stops local refreshes.
 * The platform's already-visible indicator expires on its own. */
export const startTypingIndicator = (send: (duration: number) => Promise<unknown>, options: TypingOptions = {}) => {
  const duration = options.duration ?? 60;
  const intervalMs = options.intervalMs ?? Math.min(50000, Math.floor(duration * 1000 * 0.9));
  const maxDurationMs = options.maxDurationMs ?? 5 * 60 * 1000;

  if (
    !Number.isInteger(duration) ||
    duration < 1 ||
    duration > 60 ||
    !Number.isSafeInteger(intervalMs) ||
    intervalMs < 1 ||
    intervalMs >= duration * 1000 ||
    !Number.isSafeInteger(maxDurationMs) ||
    maxDurationMs < 1
  ) {
    throw new Error('Invalid typing duration, refresh interval or maximum duration');
  }
  let stopped = false;
  let sending = false;
  let interval: ReturnType<typeof setInterval> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  const scope = runtimeScope.getStore();
  const stop = () => {
    scope?.cleanups.delete(stop);
    stopped = true;
    clearInterval(interval);
    clearTimeout(deadline);
    options.signal?.removeEventListener('abort', stop);
  };

  scope?.cleanups.add(stop);
  const tick = () => {
    if (stopped || sending) {
      return;
    }
    sending = true;
    void trackRuntimeTask(
      Promise.resolve()
        .then(() => (stopped ? undefined : send(duration)))
        .catch(async error => {
          try {
            await options.onError?.(error);
          } catch {
            // Diagnostics must not turn a failed input indicator into an unhandled rejection.
          }
        })
        .finally(() => {
          sending = false;
        })
    );
  };

  if (options.signal?.aborted) {
    stop();
  } else {
    interval = setInterval(tick, intervalMs);
    deadline = setTimeout(stop, maxDurationMs);
    interval.unref?.();
    deadline.unref?.();
    options.signal?.addEventListener('abort', stop, { once: true });
    tick();
  }

  return stop;
};

export const runWithTyping = async <T>(send: (duration: number) => Promise<unknown>, task: () => Promise<T>, options?: TypingOptions): Promise<T> => {
  const stop = startTypingIndicator(send, options);

  try {
    return await task();
  } finally {
    stop();
  }
};

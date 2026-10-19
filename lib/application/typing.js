import { runtimeClearInterval, runtimeClearTimeout, runtimeScope, runtimeSetInterval, runtimeSetTimeout, trackRuntimeTask } from "../common/runtime-scope.js";

//#region src/application/typing.ts
/** Starts immediately, never overlaps requests, and only stops local refreshes.
* The platform's already-visible indicator expires on its own. */
const startTypingIndicator = (send, options = {}) => {
	const duration = options.duration ?? 60;
	const intervalMs = options.intervalMs ?? Math.min(5e4, Math.floor(duration * 1e3 * .9));
	const maxDurationMs = options.maxDurationMs ?? 3e5;
	if (!Number.isInteger(duration) || duration < 1 || duration > 60 || !Number.isSafeInteger(intervalMs) || intervalMs < 1 || intervalMs >= duration * 1e3 || !Number.isSafeInteger(maxDurationMs) || maxDurationMs < 1) throw new Error("Invalid typing duration, refresh interval or maximum duration");
	let stopped = false;
	let sending = false;
	let interval;
	let deadline;
	const scope = runtimeScope.getStore();
	const stop = () => {
		scope?.cleanups.delete(stop);
		stopped = true;
		runtimeClearInterval(interval);
		runtimeClearTimeout(deadline);
		options.signal?.removeEventListener("abort", stop);
	};
	scope?.cleanups.add(stop);
	const tick = () => {
		if (stopped || sending) return;
		sending = true;
		trackRuntimeTask(Promise.resolve().then(() => stopped ? void 0 : send(duration)).catch(async (error) => {
			try {
				await options.onError?.(error);
			} catch {}
		}).finally(() => {
			sending = false;
		}));
	};
	if (options.signal?.aborted) stop();
	else {
		interval = runtimeSetInterval(tick, intervalMs);
		deadline = runtimeSetTimeout(stop, maxDurationMs);
		interval.unref?.();
		deadline.unref?.();
		options.signal?.addEventListener("abort", stop, { once: true });
		tick();
	}
	return stop;
};
const runWithTyping = async (send, task, options) => {
	const stop = startTypingIndicator(send, options);
	try {
		return await task();
	} finally {
		stop();
	}
};

//#endregion
export { runWithTyping, startTypingIndicator };
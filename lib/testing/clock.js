import { runtimeExecution, trackRuntimeTask } from "../common/runtime-scope.js";
import { AsyncResource } from "node:async_hooks";

//#region src/testing/clock.ts
/** Only framework-managed timers use this clock. Native timers remain native. */
function createTestClock(initial = 0) {
	if (!Number.isFinite(initial)) throw new Error("Initial clock time must be finite");
	let time = initial;
	let sequence = 0;
	const tasks = /* @__PURE__ */ new Map();
	return {
		now: () => time,
		timers: {
			set(callback, ms, repeat) {
				const id = ++sequence;
				const bound = AsyncResource.bind((execution) => runtimeExecution.run(execution, callback));
				tasks.set(id, {
					at: time + ms,
					ms,
					repeat,
					callback: () => bound(runtimeExecution.getStore())
				});
				return id;
			},
			clear(id) {
				tasks.delete(id);
			}
		},
		async advance(ms) {
			if (!Number.isFinite(ms) || ms < 0) throw new Error("Clock advance must be finite and non-negative");
			const end = time + ms;
			for (let count = 0;; count++) {
				let next;
				for (const entry of tasks) if (entry[1].at <= end && (!next || entry[1].at < next[1].at)) next = entry;
				if (!next) break;
				if (count >= 1e4) throw new Error("Virtual timer limit exceeded");
				const [id, task] = next;
				time = task.at;
				if (task.repeat) task.at += task.ms;
				else tasks.delete(id);
				trackRuntimeTask(task.callback());
				await new Promise((resolve) => setImmediate(resolve));
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

//#endregion
export { createTestClock };
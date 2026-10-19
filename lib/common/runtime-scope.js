import { AsyncLocalStorage } from "node:async_hooks";

//#region src/common/runtime-scope.ts
const runtimeScope = new AsyncLocalStorage();
const runtimeExecution = new AsyncLocalStorage();
const runtimeNow = () => runtimeScope.getStore()?.now() ?? Date.now();
function scopedResource(key, create, fallback) {
	const scope = runtimeScope.getStore();
	if (!scope) return fallback;
	if (scope.disposed) throw new Error("Test app is disposed");
	if (!scope.resources.has(key)) scope.resources.set(key, create());
	return scope.resources.get(key);
}
/** Proxy keeps exported collection references stable while isolating their contents. */
function scopedMap() {
	const key = Symbol();
	const fallback = /* @__PURE__ */ new Map();
	return new Proxy(fallback, { get(_target, property) {
		const target = scopedResource(key, () => /* @__PURE__ */ new Map(), fallback);
		const value = Reflect.get(target, property, target);
		return typeof value === "function" ? value.bind(target) : value;
	} });
}
function scopedSet() {
	const key = Symbol();
	const fallback = /* @__PURE__ */ new Set();
	return new Proxy(fallback, { get(_target, property) {
		const target = scopedResource(key, () => /* @__PURE__ */ new Set(), fallback);
		const value = Reflect.get(target, property, target);
		return typeof value === "function" ? value.bind(target) : value;
	} });
}
/** Observe detached framework work without changing production rejection semantics. */
function trackRuntimeTask(task, reportError = true) {
	const execution = runtimeExecution.getStore();
	if (execution && task && typeof task.then === "function") {
		const promise = Promise.resolve(task);
		execution.pending.add(promise);
		promise.then(() => execution.pending.delete(promise), (error) => {
			if (reportError) execution.errors.push(error);
			execution.pending.delete(promise);
		});
	}
	return task;
}
const recordRuntimeError = (error) => {
	runtimeExecution.getStore()?.errors.push(error);
};
const scheduledCallback = (callback) => () => {
	if (runtimeScope.getStore()?.disposed) return;
	if (runtimeExecution.getStore()?.closed) return runtimeExecution.run(void 0, callback);
	return callback();
};
const runtimeSetTimeout = ((callback, ms) => {
	const timers = runtimeScope.getStore()?.timers;
	return timers ? timers.set(scheduledCallback(callback), ms, false) : setTimeout(scheduledCallback(callback), ms);
});
const runtimeSetInterval = ((callback, ms) => {
	const timers = runtimeScope.getStore()?.timers;
	return timers ? timers.set(scheduledCallback(callback), ms, true) : setInterval(scheduledCallback(callback), ms);
});
const runtimeClearTimeout = (handle) => {
	const timers = runtimeScope.getStore()?.timers;
	if (timers) timers.clear(handle);
	else clearTimeout(handle);
};
const runtimeClearInterval = (handle) => {
	const timers = runtimeScope.getStore()?.timers;
	if (timers) timers.clear(handle);
	else clearInterval(handle);
};

//#endregion
export { recordRuntimeError, runtimeClearInterval, runtimeClearTimeout, runtimeExecution, runtimeNow, runtimeScope, runtimeSetInterval, runtimeSetTimeout, scopedMap, scopedResource, scopedSet, trackRuntimeTask };
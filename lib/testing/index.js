import { runtimeExecution, runtimeScope } from "../common/runtime-scope.js";
import { ResultCode } from "../common/variable.js";
import { getConfig } from "../common/config.js";
import { createResult } from "../common/result.js";
import "../common/utils.js";
import { registerExpose } from "../application/expose.js";
import { dispatchAppDispose, dispatchAppReady } from "../application/runtime/lifecycle-callbacks.js";
import { ChildrenApp, listChildrenApps } from "../application/runtime/store.js";
import { finishCurrentTrace, withEventContext, withProcessorTrace } from "../application/runtime/hook-event-context.js";
import { scheduleCancelAll, scheduleCancelByApp } from "../application/runtime/schedule-store.js";
import { clearContexts, validateContextRegistration } from "../application/context.js";
import { onProcessor } from "../application/runtime/event-processor.js";
import { createTestClock } from "./clock.js";
import { createTestEvents } from "./events.js";
import { inspectMessage } from "./messages.js";

//#region src/testing/index.ts
/** Snapshot values without mutating Format instances or retaining mutable events. */
function snapshot(value, seen = /* @__PURE__ */ new WeakMap()) {
	if (!value || typeof value !== "object") return value;
	if (Buffer.isBuffer(value)) return Buffer.from(value);
	if (value instanceof Uint8Array) return value.slice();
	if (value instanceof Date) return new Date(value);
	if (seen.has(value)) return seen.get(value);
	const copy = Array.isArray(value) ? [] : {};
	seen.set(value, copy);
	for (const key of Object.keys(value)) if (typeof value[key] !== "function") copy[key] = snapshot(value[key], seen);
	return copy;
}
/** Offline test harness. No platform connections, config files, or module mocking. */
function createTestApp(options = {}) {
	const timeoutMs = options.timeoutMs ?? 5e3;
	if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error("timeoutMs must be positive and finite");
	const clock = createTestClock(options.clock === false ? Date.now() : options.clock?.now ?? 0);
	const records = [];
	const executionRecords = /* @__PURE__ */ new WeakMap();
	const executionMessages = /* @__PURE__ */ new WeakMap();
	const actionHandlers = /* @__PURE__ */ new Map();
	const apiHandlers = /* @__PURE__ */ new Map();
	const active = /* @__PURE__ */ new Set();
	let disposed = false;
	let disposePromise;
	let mounting = false;
	const scope = {
		resources: /* @__PURE__ */ new Map(),
		cleanups: /* @__PURE__ */ new Set(),
		disposed: false,
		now: options.clock === false ? Date.now : clock.now,
		timers: options.clock === false ? void 0 : clock.timers,
		action: (request) => perform("action", request),
		api: (request) => perform("api", request)
	};
	const inScope = (callback) => runtimeScope.run(scope, callback);
	const assertOpen = () => {
		if (disposed) throw new Error("Test app is disposed");
	};
	const events = createTestEvents(scope.now);
	inScope(() => getConfig().saveValue(snapshot(options.config ?? {})));
	actionHandlers.set("message.send", () => [createResult(ResultCode.Ok, "Test delivery", { id: `test-receipt-${records.length}` })]);
	async function perform(kind, request) {
		const execution = runtimeExecution.getStore();
		const name = kind === "api" ? request.payload.key : request.action;
		const record = {
			kind,
			name,
			request: snapshot(request)
		};
		records.push(record);
		let index = -1;
		if (execution) index = (executionRecords.get(execution)?.push(record) ?? 0) - 1;
		const payload = request.payload;
		if (kind === "action" && request.action.startsWith("message.send")) {
			const nodes = snapshot(payload.params?.format?.value ?? payload.params?.format ?? []);
			const content = snapshot(payload.params?.content);
			const message = {
				nodes,
				content,
				...inspectMessage(nodes),
				target: snapshot(payload.target),
				actionIndex: index
			};
			if (content !== void 0 && nodes.length === 0) {
				message.text = typeof content === "string" ? content : content?.text ?? content?.markdown?.content ?? "";
				message.commands = content?.keyboard?.rows?.flatMap((row) => row.filter((button) => button.action.type === "command").map((button) => button.action.data)) ?? [];
			}
			if (execution) executionMessages.get(execution)?.push(message);
		}
		const handler = kind === "action" ? actionHandlers.get(name) : apiHandlers.get(name);
		if (!handler) {
			const error = /* @__PURE__ */ new Error(`Unmocked ${kind}: ${name}`);
			execution?.errors.push(error);
			record.error = error;
			throw error;
		}
		try {
			const results = await handler(request);
			if (!Array.isArray(results) || results.some((item) => !item || typeof item.code !== "number")) {
				const error = /* @__PURE__ */ new Error(`Invalid mock results for ${name}: expected Result[]`);
				execution?.errors.push(error);
				throw error;
			}
			record.results = snapshot(results);
			return results;
		} catch (error) {
			record.error = error;
			throw error;
		}
	}
	async function drain(execution) {
		while (execution.pending.size) await Promise.allSettled([...execution.pending]);
	}
	function execute(event, runner, appName = "main") {
		assertOpen();
		const execution = {
			appName,
			pending: /* @__PURE__ */ new Set(),
			errors: [],
			reasons: [],
			contextClaimed: false
		};
		const actions = [];
		const messages = [];
		const nextCalls = [];
		executionRecords.set(execution, actions);
		executionMessages.set(execution, messages);
		const next = (...args) => {
			nextCalls.push(args);
		};
		const task = inScope(() => runtimeExecution.run(execution, async () => {
			let timer;
			const work = async () => {
				let value;
				try {
					value = await (event ? withEventContext(event, next, () => runner(next), {
						appName,
						phase: "response"
					}) : runner(next));
				} catch (error) {
					execution.errors.push(error);
				}
				await drain(execution);
				if (event) finishCurrentTrace(execution.errors.length ? "error" : "completed");
				await drain(execution);
				const errors = [...new Set(execution.errors)];
				if (errors.length && options.failOnError !== false) throw new AggregateError(errors, `Test execution failed: ${errors.map((error) => error instanceof Error ? error.message : String(error)).join("; ")}`);
				return {
					value,
					actions,
					messages,
					nextCalls,
					errors,
					reasons: execution.reasons,
					context: { claimed: execution.contextClaimed }
				};
			};
			try {
				return await Promise.race([event ? withProcessorTrace(event.name, event, work) : work(), new Promise((_resolve, reject) => {
					timer = setTimeout(() => reject(/* @__PURE__ */ new Error(`Test execution timed out after ${timeoutMs}ms`)), timeoutMs);
				})]);
			} finally {
				clearTimeout(timer);
				execution.closed = true;
			}
		}));
		active.add(task);
		task.then(() => active.delete(task), () => active.delete(task));
		return task;
	}
	const mockController = (handlers) => ({
		on(name, handler) {
			assertOpen();
			handlers.set(name, handler);
		},
		remove(name) {
			assertOpen();
			handlers.delete(name);
		},
		get calls() {
			return records.filter((record) => handlers === actionHandlers ? record.kind === "action" : record.kind === "api");
		}
	});
	return {
		events,
		actions: mockController(actionHandlers),
		apis: mockController(apiHandlers),
		/** Lifetime action log; each run also returns its own isolated records. */
		get calls() {
			return records.slice();
		},
		clock: {
			now: scope.now,
			get pending() {
				return clock.pending;
			},
			advance: (ms) => {
				if (options.clock === false) throw new Error("Cannot advance a real clock");
				return execute(void 0, () => clock.advance(ms));
			}
		},
		configure(config) {
			assertOpen();
			inScope(() => getConfig().saveValue(snapshot(config)));
		},
		/** Explicit escape hatch for importing/creating app-owned services inside this scope. */
		run(callback) {
			assertOpen();
			return inScope(callback);
		},
		invoke(event, callback, appName = "main") {
			return execute(event, callback, appName);
		},
		runHandler(handler, event, appName = "main") {
			return execute(event, (next) => {
				let forwarded = false;
				const forward = (...args) => {
					forwarded = true;
					next(...args);
				};
				const visit = async (current) => {
					if (typeof current === "function") return withEventContext(event, forward, () => current(event, forward), {
						appName,
						phase: "response"
					});
					if (!current || typeof current !== "object") throw new TypeError("Expected a function or onResponse/onMiddleware handler; mount route definitions instead");
					if ("default" in current) return visit(current.default);
					if (current.select && !(Array.isArray(current.select) ? current.select : [current.select]).includes(event.name)) return;
					if (Array.isArray(current.current)) {
						for (const child of current.current) {
							const value = await visit(child);
							if (forwarded || value !== true) return value;
						}
						return true;
					}
					return visit(current.current);
				};
				return visit(handler);
			}, appName);
		},
		async mount(definition, lifecycle = {}, name = "main") {
			assertOpen();
			if (mounting || active.size) throw new Error("Mount apps before starting event executions");
			mounting = true;
			try {
				await execute(void 0, async () => {
					if (listChildrenApps().some((app) => app.name === name)) throw new Error(`App already mounted: ${name}`);
					let register;
					let cycle = lifecycle;
					const app = new ChildrenApp(name);
					try {
						if ("_name" in definition && definition._name === "app") {
							const callbacks = typeof definition.callback === "function" ? await definition.callback() : definition.callback;
							cycle = {
								...callbacks,
								...lifecycle
							};
							await cycle.onCreated?.();
							register = await callbacks.register?.() ?? {};
						} else {
							register = definition;
							await cycle.onCreated?.();
						}
						validateContextRegistration(register);
						app.register(register);
						app.pushCycle(cycle);
						app.on();
						if (register.expose) registerExpose(name, register.expose.getConfigs());
						const store = {
							response: [],
							responseMiddleware: {},
							middleware: []
						};
						await cycle.onMounted?.(store);
						await dispatchAppReady(name, store);
					} catch (error) {
						app.pushCycle(cycle);
						app.on();
						await dispatchAppDispose(name, error);
						scheduleCancelByApp(name);
						app.un();
						throw error;
					}
				}, name);
			} finally {
				mounting = false;
			}
		},
		/** Production processor: filtering, subscriptions, middleware, Context and routes. */
		dispatch(event) {
			return execute(event, () => onProcessor(event.name, event));
		},
		async unmount(name = "main") {
			assertOpen();
			if (active.size) throw new Error("Wait for event executions before unmounting");
			await execute(void 0, async () => {
				await dispatchAppDispose(name);
				scheduleCancelByApp(name);
				new ChildrenApp(name).un();
			}, name);
		},
		dispose() {
			if (disposePromise !== void 0) return disposePromise;
			disposed = true;
			disposePromise = (async () => {
				await Promise.allSettled([...active]);
				let timer;
				try {
					await Promise.race([inScope(async () => {
						for (const app of listChildrenApps()) {
							await dispatchAppDispose(app.name);
							new ChildrenApp(app.name).un();
						}
					}), new Promise((_resolve, reject) => {
						timer = setTimeout(() => reject(/* @__PURE__ */ new Error("Test app disposal timed out")), timeoutMs);
					})]);
				} finally {
					clearTimeout(timer);
					inScope(() => {
						for (const cleanup of scope.cleanups) cleanup();
						scope.cleanups.clear();
						clearContexts();
						scheduleCancelAll();
						clock.clear();
						getConfig().dispose();
					});
					scope.disposed = true;
					scope.resources.clear();
				}
			})();
			return disposePromise;
		}
	};
}

//#endregion
export { createTestApp, createTestEvents, inspectMessage };
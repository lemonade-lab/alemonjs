import { trackRuntimeTask } from "../../common/runtime-scope.js";
import { showErrorModule } from "../../common/utils.js";
import "../../common/index.js";
import { finishCurrentTrace, withEventContext } from "./hook-event-context.js";
import { dispatchEventError } from "./event-error.js";

//#region src/application/runtime/event-processor-callHandler.ts
const createCallHandler = (valueEvent) => {
	const callHandler = (currents, nextEvent, meta) => {
		let index = 0;
		let isClose = false;
		let isNext = false;
		const start = async () => {
			if (index >= currents.length) return;
			if (isNext) return;
			if (isClose) return;
			try {
				const nextFn = (...cns) => {
					isNext = true;
					nextEvent(...cns);
				};
				if (await withEventContext(valueEvent, nextFn, () => currents[index](valueEvent, nextFn), {
					appName: meta?.appName,
					phase: meta?.phase
				}) !== true) {
					if (!isNext) {
						finishCurrentTrace("consumed");
						return;
					}
					isClose = true;
				}
			} catch (err) {
				finishCurrentTrace("error");
				const shouldContinue = meta?.appName && meta?.phase ? await dispatchEventError({
					event: valueEvent,
					error: err,
					appName: meta.appName,
					phase: meta.phase
				}) : false;
				showErrorModule(err);
				if (shouldContinue) {
					nextEvent();
					return;
				}
				return;
			}
			++index;
			trackRuntimeTask(start());
		};
		trackRuntimeTask(start());
	};
	return callHandler;
};

//#endregion
export { createCallHandler };
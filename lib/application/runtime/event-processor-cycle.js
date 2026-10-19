import { trackRuntimeTask } from "../../common/runtime-scope.js";
import { finishCurrentTrace } from "./hook-event-context.js";
import { expendContext } from "../context.js";
import { expendEvent } from "./event-processor-event.js";
import { expendMiddleware } from "./event-processor-middleware.js";
import { expendSubscribeCreate, expendSubscribeMount, expendSubscribeUnmount } from "./event-processor-subscribe.js";

//#region src/application/runtime/event-processor-cycle.ts
/**
* 消息体处理机制
* @param event
* @param key
*/
const expendCycle = (valueEvent, select, _config) => {
	const nextEnd = () => {
		finishCurrentTrace("completed");
	};
	const nextUnMount = (cn, ...cns) => {
		if (cn) {
			nextEnd(...cns);
			return;
		}
		trackRuntimeTask(expendSubscribeUnmount(valueEvent, select, nextEnd));
	};
	const nextEvent = (cn, ...cns) => {
		if (cn) {
			nextUnMount(...cns);
			return;
		}
		trackRuntimeTask(expendEvent(valueEvent, select, nextUnMount));
	};
	const nextResponseContent = (cn, ...cns) => {
		if (cn) {
			nextEvent(...cns);
			return;
		}
		trackRuntimeTask(expendContext(valueEvent, select, nextEvent, "response"));
	};
	const nextMount = (cn, ...cns) => {
		if (cn) {
			nextResponseContent(...cns);
			return;
		}
		trackRuntimeTask(expendSubscribeMount(valueEvent, select, nextResponseContent));
	};
	const nextMiddlewareContent = (cn, ...cns) => {
		if (cn) {
			nextMount(...cns);
			return;
		}
		trackRuntimeTask(expendContext(valueEvent, select, nextMount, "middleware"));
	};
	const nextCreate = (cn, ...cns) => {
		if (cn) {
			nextMiddlewareContent(...cns);
			return;
		}
		trackRuntimeTask(expendMiddleware(valueEvent, select, nextMiddlewareContent));
	};
	trackRuntimeTask(expendSubscribeCreate(valueEvent, select, nextCreate));
};

//#endregion
export { expendCycle };
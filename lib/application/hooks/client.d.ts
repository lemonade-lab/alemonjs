import { EventKeys, Events } from "../../types/event/map.js";
import "../../types/index.js";
//#region src/application/hooks/client.d.ts
declare function useClient<T extends object, K extends EventKeys = EventKeys>(eventOrClass?: Events[K] | (new (...args: any[]) => T), _ApiClass?: new (...args: any[]) => T): readonly [T];
//#endregion
export { useClient };
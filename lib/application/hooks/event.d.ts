import { EventKeys, Events } from "../../types/event/map.js";
import "../../types/index.js";
//#region src/application/hooks/event.d.ts
type UseEventOptions<T extends EventKeys> = {
  selects: T | T[];
  regular?: RegExp;
  prefix?: string;
  exact?: string;
};
type UseEventResult<T extends EventKeys> = {
  current: Events[T];
  value: Events[T]['value'];
  match: {
    selects: boolean;
    regular: boolean;
    prefix: boolean;
    exact: boolean;
  };
};
declare function useEvent<T extends EventKeys>(options?: UseEventOptions<T>): readonly [UseEventResult<T>, (...args: boolean[]) => void];
declare function useEvent<T extends EventKeys>(event?: Events[T], options?: UseEventOptions<T>): readonly [UseEventResult<T>, (...args: boolean[]) => void];
/**
 * 创建event
 * @deprecated 该函数不建议直接使用，推荐使用useEvent
 * @param options
 * @returns
 */
declare function createEvent<T extends EventKeys>(options: {
  event: any;
  selects: T | T[];
  regular?: RegExp;
  prefix?: string;
  exact?: string;
}): Events[T] & {
  selects: boolean;
  regular: boolean;
  prefix: boolean;
  exact: boolean;
  value: Events[T]["value"];
};
//#endregion
export { createEvent, useEvent };
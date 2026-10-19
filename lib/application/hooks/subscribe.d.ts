import { EventKeys, Events } from "../../types/event/map.js";
import { Current } from "../../types/event/index.js";
import { EventCycleEnum } from "../../types/cycle/index.js";
import "../../types/index.js";
//#region src/application/hooks/subscribe.d.ts
/**
 * 订阅事件
 * @param eventOrSelects
 * @param maybeSelects
 * @returns
 */
declare function useSubscribe<T extends EventKeys>(selects: T | T[]): readonly [{
  create: (callback: Current<T>, keys: (keyof Events[T])[]) => {
    id: string;
    selects: T[];
    choose: EventCycleEnum;
  };
  mount: (callback: Current<T>, keys: (keyof Events[T])[]) => {
    id: string;
    selects: T[];
    choose: EventCycleEnum;
  };
  unmount: (callback: Current<T>, keys: (keyof Events[T])[]) => {
    id: string;
    selects: T[];
    choose: EventCycleEnum;
  };
  cancel: (value: {
    id: string;
    selects: T[];
    choose: EventCycleEnum;
  }) => void;
}];
declare function useSubscribe<T extends EventKeys>(event: Events[T] | undefined, selects: T | T[]): readonly [{
  create: (callback: Current<T>, keys: (keyof Events[T])[]) => {
    id: string;
    selects: T[];
    choose: EventCycleEnum;
  };
  mount: (callback: Current<T>, keys: (keyof Events[T])[]) => {
    id: string;
    selects: T[];
    choose: EventCycleEnum;
  };
  unmount: (callback: Current<T>, keys: (keyof Events[T])[]) => {
    id: string;
    selects: T[];
    choose: EventCycleEnum;
  };
  cancel: (value: {
    id: string;
    selects: T[];
    choose: EventCycleEnum;
  }) => void;
}];
/**
 * 使用观察者模式订阅事件
 * @param event
 * @param selects
 * @returns
 * 废弃，请使用 useSubscribe
 * @deprecated
 */
declare function useObserver<T extends EventKeys>(selects: T | T[]): readonly [(callback: Current<T>, keys: (keyof Events[T])[]) => {
  id: string;
  selects: T[];
  choose: EventCycleEnum;
}, (value: {
  id: string;
  selects: T[];
  choose: EventCycleEnum;
}) => void];
declare function useObserver<T extends EventKeys>(event: Events[T] | undefined, selects: T | T[]): readonly [(callback: Current<T>, keys: (keyof Events[T])[]) => {
  id: string;
  selects: T[];
  choose: EventCycleEnum;
}, (value: {
  id: string;
  selects: T[];
  choose: EventCycleEnum;
}) => void];
//#endregion
export { useObserver, useSubscribe };
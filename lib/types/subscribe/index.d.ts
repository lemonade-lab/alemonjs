import { EventKeys } from "../event/map.js";
import { EventCycleEnum } from "../cycle/index.js";
import { SinglyLinkedList } from "../../common/SinglyLinkedList.js";
//#region src/types/subscribe/index.d.ts
/**
 * subscribe
 */
type SubscribeValue = {
  appName?: string;
  choose: EventCycleEnum;
  selects: EventKeys[];
  keys: {
    [key: string]: string | number | boolean;
  };
  status?: 'active' | 'paused';
  current: (...arg: any[]) => any;
  id: string;
};
type SubscribeMap = Map<string, SinglyLinkedList<SubscribeValue>>;
type SubscribeKeysMap = {
  create: SubscribeMap;
  mount: SubscribeMap;
  unmount: SubscribeMap;
};
/**
 * state subscribe
 */
interface StateSubscribeMap {
  [key: string]: Array<(value: boolean) => void>;
}
//#endregion
export { StateSubscribeMap, SubscribeKeysMap, SubscribeMap, SubscribeValue };
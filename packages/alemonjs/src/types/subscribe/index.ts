import { SinglyLinkedList } from '../../app/SinglyLinkedList';
import { EventCycleEnum } from '../cycle';
import { EventKeys } from '../event/map';

/**
 * subscribe
 */
export type SubscribeValue = {
  choose: EventCycleEnum;
  selects: EventKeys[];
  keys: {
    [key: string]: string | number | boolean;
  };
  status?: 'active' | 'paused'; // 订阅状态： 激活中，执行中，已暂停
  current: (...arg: any[]) => any;
  id: string;
};

export type SubscribeMap = Map<string, SinglyLinkedList<SubscribeValue>>;

export type SubscribeKeysMap = {
  create: SubscribeMap;
  mount: SubscribeMap;
  unmount: SubscribeMap;
};

/**
 * state subscribe
 */
export interface StateSubscribeMap {
  [key: string]: Array<(value: boolean) => void>;
}

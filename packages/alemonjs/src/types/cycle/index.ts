import { StoreMiddlewareItem, StoreResponseItem } from '../store/res';

type StroreParam = { response: StoreResponseItem[]; middleware: StoreMiddlewareItem[] };

/**
 * 子模块生命周期
 */
export type ChildrenCycle = {
  /**
   * 创建时
   * @returns
   */
  onCreated?: () => void | Promise<void>;
  /**
   * 挂载时。得到属于自己的 store
   * @returns
   */
  onMounted?: (store: StroreParam) => void | Promise<void>;
  /**
   * 卸载时
   * @returns
   */
  unMounted?: (error: any) => void | Promise<void>;
};

/**
 * 控制生命周期
 * ***
 * next() 在同一个周期中继续
 * ***
 * next(true) 在下一个周期中继续
 * ***
 * next(true,true) 在下下个周期中继续
 * 以此类推。。。
 */
export type Next = (...cns: boolean[]) => void;

/**
 * 事件周期
 */
export type EventCycleEnum = 'create' | 'mount' | 'unmount';

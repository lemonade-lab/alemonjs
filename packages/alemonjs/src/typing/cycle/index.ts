import { StoreMiddlewareItem, StoreResponseItem } from '../store/res'

/**
 * 子模块生命周期
 */
export type ChildrenCycle = {
  /**
   * 创建时
   * @returns
   */
  onCreated?: () => void
  /**
   * 挂载时。得到属于自己的 store
   * @returns
   */
  onMounted?: (strore: { response: StoreResponseItem[]; middleware: StoreMiddlewareItem[] }) => void
  /**
   * 卸载时
   * @returns
   */
  unMounted?: (error: any) => void
}

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
export type Next = (...cns: boolean[]) => void

/**
 * 事件周期
 */
export type EventCycleEnum = 'create' | 'mount' | 'unmount'

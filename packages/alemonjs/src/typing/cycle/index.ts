/**
 *
 */
export type ChildrenCycle = {
  /**
   * 创建时
   * @returns
   */
  onCreated?: () => void
  /**
   * 挂载时
   * @returns
   */
  onMounted?: () => void
  /**
   * 卸载时
   * @returns
   */
  unMounted?: () => void
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

export type EventCycle = 'create' | 'mount' | 'mountAfter' | 'unmount'

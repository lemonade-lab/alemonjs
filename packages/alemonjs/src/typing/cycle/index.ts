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

export type Next = (isCycle?: boolean) => void

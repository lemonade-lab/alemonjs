import { ChildrenCycle } from '../typing/cycle'
/**
 *
 * @param callback
 * @returns
 */
export const defineChildren = (callback: () => ChildrenCycle) => callback
global.defineChildren = defineChildren

import { ChildrenCycle } from '../typing/cycle'
export const defineChildren = (callback: () => ChildrenCycle) => callback
global.defineChildren = defineChildren

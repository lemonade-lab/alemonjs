import { ClientAPI } from '../typing/global'
/**
 *
 * @param callback
 * @returns
 */
export const defineBot = (callback: () => ClientAPI) => callback

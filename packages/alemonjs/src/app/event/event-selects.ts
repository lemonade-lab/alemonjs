import { EventKeys } from '../../types';

/**
 * 创建选择器
 * @param values
 * @returns
 */
export const onSelects = <T extends EventKeys[] | EventKeys>(values: T) => values;
global.onSelects = onSelects;

/**
 * @deprecated 废弃,请使用onSelects
 * @param values
 * @returns
 */
export const createSelects = onSelects;

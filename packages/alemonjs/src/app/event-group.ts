import { OnGroupFunc } from '../typings';

/**
 * 定义一组标准执行导出
 * @param calls
 * @returns
 */
const onGroup: OnGroupFunc = (...calls) => {
  if (calls.length === 0) {
    throw new Error('onGroup: 至少需要一个响应或中间件');
  }
  const firstItem = calls[0];
  const baseSelects = firstItem.select;
  // 把如果item是数组的，豆扁平起来。
  const currents = calls.reduce((acc, item) => {
    if (Array.isArray(item.current)) {
      return acc.concat(item.current);
    } else {
      return acc.concat(item.current);
    }
  }, [] as (typeof firstItem.current)[]);

  return {
    select: baseSelects,
    current: currents
  } as typeof firstItem;
};

global.onGroup = onGroup;

export { onGroup };

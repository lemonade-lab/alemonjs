import { OnGroupFunc } from '../typings'

/**
 * 定义一组标准执行导出
 * @param calls
 * @returns
 */
const onGroup: OnGroupFunc = (...calls) => {
  if (calls.length === 0) {
    throw new Error('onGroup: 至少需要一个响应或中间件')
  }
  const firstItem = calls[0]
  const baseSelects = firstItem.select
  return {
    select: baseSelects,
    current: calls.map(item => item.current)
  } as typeof firstItem
}

export { onGroup }

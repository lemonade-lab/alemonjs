import { Fail, FailAuth, FailInternal, FailParams, Ok, Warn } from './variable'

/**
 * 结果反馈码
 * @description
 * - 2000: 成功
 */
export const ResultCode = {
  Ok,
  Fail,
  FailParams,
  Warn,
  FailAuth,
  FailInternal
} as const

// 结果反馈码类型
export type ResultCode = (typeof ResultCode)[keyof typeof ResultCode]

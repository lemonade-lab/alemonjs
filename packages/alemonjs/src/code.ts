/**
 * 结果反馈码
 */

// 成功码
const Ok = 2000 // 成功

// 警惕码
const Warn = 2100 // 任意警告

// 失败码
const Fail = 4000 // 未知错误
const FailParams = 4001 // 参数错误
const FailAuth = 4002 // 权限不足
const FailInternal = 5000 // 内部错误

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

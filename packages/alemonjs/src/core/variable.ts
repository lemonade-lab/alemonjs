import { EventKeys } from '../typings'

export const processor_repeated_event_time = 1000 * 60
export const processor_repeated_user_time = 1000 * 1
export const processor_repeated_clear_time_min = 1000 * 3
export const processor_repeated_clear_time_max = 1000 * 10
export const processor_repeated_clear_size = 37

// 中间件文件后缀正则
export const file_suffix_middleware = /^mw(\.|\..*\.)(js|ts|jsx|tsx)$/

// 相应文件后缀正则
export const file_suffix_response = /^res(\.|\..*\.)(js|ts|jsx|tsx)$/

// 框架前缀正则
export const file_prefix_framework = /^alemonjs-/

// 通用框架前缀正则
export const file_prefix_common = /^(@alemonjs\/|alemonjs-)/

// 默认登录
export const default_login = 'gui'

export const default_platform_prefix = 'alemonjs-'

export const default_platform_common_prefix = '@alemonjs/'

/**
 * 结果反馈码
 */

// 成功码
export const Ok = 2000 // 成功

// 警惕码
export const Warn = 2100 // 任意警告

// 失败码
export const Fail = 4000 // 未知错误
export const FailParams = 4001 // 参数错误
export const FailAuth = 4002 // 权限不足
export const FailInternal = 5000 // 内部错误

export const EventMessageText: EventKeys[] = [
  'message.create',
  'private.message.create',
  'interaction.create',
  'private.interaction.create'
]

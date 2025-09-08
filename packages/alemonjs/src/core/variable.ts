import { EventKeys } from '../typings';

export const processor_repeated_event_time = 1000 * 60;
export const processor_repeated_user_time = 1000 * 1;
export const processor_repeated_clear_time_min = 1000 * 3;
export const processor_repeated_clear_time_max = 1000 * 10;
export const processor_repeated_clear_size = 37;

// 中间件文件后缀正则
export const file_suffix_middleware = /^mw(\.|\..*\.)(js|ts|jsx|tsx)$/;

// 相应文件后缀正则
export const file_suffix_response = /^res(\.|\..*\.)(js|ts|jsx|tsx)$/;

// 通用框架前缀正则
export const file_prefix_common = /^(@alemonjs\/|alemonjs-)/;

// 默认端口
export const default_port = 17117;

// 默认登录
export const default_login = 'gui';

// 默认平台前缀
export const default_platform_prefix = 'alemonjs-';

// 默认平台通用前缀
export const default_platform_common_prefix = '@alemonjs/';

/**
 * 结果反馈码
 */

// 成功码
export const Ok = 2000; // 成功

// 警惕码
export const Warn = 2100; // 任意警告

// 结果码
export const Fail = 4000; // 未知错误
// 参数错误
export const FailParams = 4001;
// 参数错误
export const FailAuth = 4002;
// 授权错误
export const FailInternal = 5000; // 内部错误

export const EventMessageText: EventKeys[] = ['message.create', 'private.message.create', 'interaction.create', 'private.interaction.create'];

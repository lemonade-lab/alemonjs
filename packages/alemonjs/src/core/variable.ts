import { EventKeys } from '../types';

export const processorRepeatedEventTime = 1000 * 60;
export const processorRepeatedUserTime = 1000 * 1;
export const processorRepeatedClearTimeMin = 1000 * 3;
export const processorRepeatedClearTimeMax = 1000 * 10;
export const processorRepeatedClearSize = 37;
export const processorMaxMapSize = 10000;

// 中间件文件后缀正则
export const fileSuffixMiddleware = /^mw(\.|\..*\.)(js|ts|jsx|tsx)$/;

// 相应文件后缀正则
export const fileSuffixResponse = /^res(\.|\..*\.)(js|ts|jsx|tsx)$/;

// 通用框架前缀正则
export const filePrefixCommon = /^(@alemonjs\/|alemonjs-)/;

// 默认端口
export const defaultPort = 17117;

// 默认登录
export const defaultLogin = 'gui';

// 默认平台前缀
export const defaultPlatformPrefix = 'alemonjs-';

// 默认平台通用前缀
export const defaultPlatformCommonPrefix = '@alemonjs/';

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
} as const;

// 结果反馈码类型
export type ResultCode = (typeof ResultCode)[keyof typeof ResultCode];

export class Result {
  #data: {
    code: ResultCode;
    message: string;
    data: null;
  }[] = [];

  #currentIndex = 0;

  get value() {
    return this.#data;
  }

  static create() {
    return new Result();
  }

  push(param: { code: ResultCode; message: string; data: null }) {
    this.#data.push(param);

    return this;
  }

  newIndex() {
    // 如果当前索引位置有数据，则移动到下一个索引，否则保持在当前索引
    if (this.#data[this.#currentIndex]) {
      this.#currentIndex++;
    }

    return this;
  }

  updateMessage(msg: string) {
    if (!this.#data[this.#currentIndex]) {
      this.#data[this.#currentIndex] = {
        code: ResultCode.Ok,
        message: msg,
        data: null
      };
    }
    this.#data[this.#currentIndex].message = msg;

    return this;
  }

  updateData(data: any) {
    if (!this.#data[this.#currentIndex]) {
      this.#data[this.#currentIndex] = {
        code: ResultCode.Ok,
        message: '',
        data: data
      };
    }
    this.#data[this.#currentIndex].data = data;

    return this;
  }

  updateCode(callback: (code: typeof ResultCode) => ResultCode) {
    const newCode = callback(ResultCode);

    if (!this.#data[this.#currentIndex]) {
      this.#data[this.#currentIndex] = {
        code: newCode,
        message: '',
        data: null
      };
    } else {
      this.#data[this.#currentIndex].code = newCode;
    }

    return this;
  }
}

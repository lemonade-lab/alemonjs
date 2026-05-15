import { EventKeys } from '../types';

export const processorRepeatedEventTime = 1000 * 60;
export const processorRepeatedUserTime = 1000 * 1;
export const processorRepeatedClearTimeMin = 1000 * 3;
export const processorRepeatedClearTimeMax = 1000 * 10;
export const processorRepeatedClearSize = 37;
export const processorMaxMapSize = 10000;

export const fileSuffixMiddleware = /^mw(\.|\..*\.)(js|ts|jsx|tsx)$/;
export const fileSuffixResponse = /^res(\.|\..*\.)(js|ts|jsx|tsx)$/;
export const filePrefixCommon = /^(@alemonjs\/|alemonjs-)/;
export const defaultPort = 17117;
export const defaultLogin = 'gui';
export const defaultPlatformPrefix = 'alemonjs-';
export const defaultPlatformCommonPrefix = '@alemonjs/';

export const Ok = 2000;
export const Warn = 2100;
export const Fail = 4000;
export const FailParams = 4001;
export const FailAuth = 4002;
export const FailInternal = 5000;

export const EventMessageText: EventKeys[] = ['message.create', 'private.message.create', 'interaction.create', 'private.interaction.create'];

export const ResultCode = {
  Ok,
  Fail,
  FailParams,
  Warn,
  FailAuth,
  FailInternal
} as const;

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
        data
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

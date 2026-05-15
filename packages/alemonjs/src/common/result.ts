import { logger } from './logger.js';
import { ResultCode } from './variable.js';

export type Result<T = any> = {
  code: ResultCode;
  message: string | object;
  data: T;
};

export const createResult = <T>(code: ResultCode, message: string | object, data?: T): Result<T> => {
  if (code !== ResultCode.Ok) {
    logger.error({
      code,
      message,
      data
    });
  }

  return {
    code,
    message,
    data
  };
};

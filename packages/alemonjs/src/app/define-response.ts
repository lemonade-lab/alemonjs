import { DefineResponseFunc } from '../types';

/**
 * Lazy load a response handler
 * @param fnc
 * @returns
 */
export const lazy = (fnc: () => Promise<any>) => {
  return async () => (await fnc()).default;
};

export const defineResponse: DefineResponseFunc = responses => {
  return {
    current: responses
  };
};

global.defineResponse = defineResponse;

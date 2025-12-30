import { DefineResponseFunc } from '../types';

/**
 * Lazy load a response handler
 * @param fnc
 * @returns
 */
export const lazy = <T extends { default: any }>(fnc: () => Promise<T>): (() => Promise<T['default']>) => {
  const back = async () => (await fnc()).default;

  return back;
};

export const defineResponse: DefineResponseFunc = responses => {
  return {
    current: responses
  };
};

global.defineResponse = defineResponse;

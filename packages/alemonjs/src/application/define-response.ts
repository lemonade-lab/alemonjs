import { DefineResponseFunc } from '../types';

export const defineResponse: DefineResponseFunc = responses => {
  return {
    current: responses
  };
};

global.defineResponse = defineResponse;

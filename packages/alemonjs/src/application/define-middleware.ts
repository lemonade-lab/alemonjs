import { defineMiddlewareFunc } from '../types';

export const defineMiddleware: defineMiddlewareFunc = middleware => {
  return {
    current: middleware
  };
};

global.defineMiddleware = defineMiddleware;

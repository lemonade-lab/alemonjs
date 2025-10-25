// util/types 的完整 polyfill
export const isString = (value: any): value is string => typeof value === 'string';
export const isNumber = (value: any): value is number => typeof value === 'number';
export const isBoolean = (value: any): value is boolean => typeof value === 'boolean';
export const isFunction = (value: any): value is Function => typeof value === 'function';
export const isObject = (value: any): value is object => value !== null && typeof value === 'object';
export const isArray = (value: any): value is any[] => Array.isArray(value);
export const isBuffer = (value: any): boolean => value instanceof Uint8Array;
export const isDate = (value: any): value is Date => value instanceof Date;
export const isRegExp = (value: any): value is RegExp => value instanceof RegExp;
export const isError = (value: any): value is Error => value instanceof Error;
export const isNull = (value: any): value is null => value === null;
export const isUndefined = (value: any): value is undefined => value === undefined;
export const isSymbol = (value: any): value is symbol => typeof value === 'symbol';
export const isPrimitive = (value: any): boolean => value === null || (typeof value !== 'object' && typeof value !== 'function');
export const isAsyncFunction = (func: unknown): boolean => {
  return Object.prototype.toString.call(func) === '[object AsyncFunction]';
};
export default {
  isString,
  isNumber,
  isBoolean,
  isFunction,
  isObject,
  isArray,
  isBuffer,
  isDate,
  isRegExp,
  isError,
  isNull,
  isUndefined,
  isSymbol,
  isPrimitive,
  isAsyncFunction
};

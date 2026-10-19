import { PathLike } from "fs";
import { AxiosInstance, AxiosRequestConfig } from "axios";
import { Readable } from "node:stream";
import { Options } from "public-ip";
import { Buffer } from "buffer";
//#region src/utils.d.ts
/**
 * 通过URL获取Buffer
 * @param url
 * @returns
 */
declare const getBufferByURL: (url: string) => Promise<Buffer>;
/**
 * 生成二维码
 * @param text
 * @param targetPath
 * @returns
 */
declare const createQRCode: (text: string, targetPath?: string) => Promise<Buffer | false>;
/**
 * 计数器类
 * 用于生成递增的数字ID等场景
 */
declare class Counter {
  #private;
  /**
   * 计数器
   * @param initialValue
   */
  constructor(initialValue: number);
  /**
   * 获取当前计数值
   */
  get value(): number;
  /**
   * 获取下一个计数值
   * @returns
   */
  next(): number;
  /**
   * 重置计数器
   * @param initialValue
   */
  reStart(initialValue?: number): void;
}
/**
 * 创建form
 * @param options.url
 * @param options.image
 * @param options.name
 * @description 支持以下几种方式创建图片数据：
 * 1. 通过url获取图片数据
 * 2. 通过图片路径获取图片数据
 * 3. 通过base64字符串获取图片数据
 * 4. 通过Buffer获取图片数据
 * 5. 通过Readable流获取图片数据
 * @returns
 */
declare function createPicFrom(options: {
  url?: PathLike;
  image?: string | Buffer | Readable;
  name?: string;
}): Promise<{
  picData: Readable;
  name: string;
}>;
/**
 *
 * @param options
 * @returns
 */
declare const getPublicIP: (options?: Options & {
  force?: boolean;
}) => Promise<string>;
/**
 * 正则表达式工具类
 */
declare class Regular extends RegExp {
  /**
   * 创建 Regular 实例
   * @param pattern
   * @param flags
   * @returns
   */
  static create(pattern: RegExp | string, flags?: string): Regular;
  /**
   * 合并多个正则表达式的 flags，去重并排序
   * @param flags
   * @returns
   */
  private static mergeFlags;
  /**
   * @param regulars
   * @returns
   */
  static or(...regulars: RegExp[]): Regular;
  /**
   * @param regulars
   * @returns
   */
  static and(...regulars: RegExp[]): Regular;
  or(...regulars: RegExp[]): Regular;
  and(...regulars: RegExp[]): Regular;
  /**
   * 追加新的 flags
   */
  withFlags(flags: 'i' | 'g' | 'm' | 's' | 'u' | 'y'): Regular;
  /**
   * 去除指定的 flags
   */
  withoutFlags(flagsToRemove: 'i' | 'g' | 'm' | 's' | 'u' | 'y'): Regular;
}
/**
 * 基础请求
 * @param service
 * @param options
 * @returns
 */
declare const createAxiosInstance: (service: AxiosInstance, options: AxiosRequestConfig) => Promise<any>;
/**
 * 创建一个可配代理的请求实例
 * @param options
 * @returns
 */
declare const request: (options: AxiosRequestConfig & {
  requestProxy: string;
}) => Promise<any>;
//#endregion
export { Counter, Regular, createAxiosInstance, createPicFrom, createQRCode, getBufferByURL, getPublicIP, request };
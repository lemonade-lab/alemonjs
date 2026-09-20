/**
 * *私域*
 */

/**
 * 频道内的全部消息
 * @param event
 * @returns
 */
import type { AT_MESSAGE_CREATE_TYPE } from './AT_MESSAGE_CREATE';

/** 私域全量频道消息与 AT_MESSAGE_CREATE 使用同一 Message 对象。 */
export type MESSAGE_CREATE_TYPE = AT_MESSAGE_CREATE_TYPE;

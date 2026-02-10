import * as flattedJSON from 'flatted';
import { onProcessor } from '../../app/index';
import { ResultCode, createResult } from '../../core';
import { actionResolves, actionTimeouts, apiResolves, apiTimeouts, FULL_RECEIVE_HEADER } from '../processor/config';
import type { CBPClientOptions, ParsedMessage } from '../typings';
import { createWSConnector } from './base';

/**
 * CBP 客户端
 * @param url
 * @param options
 */
export const cbpClient = (url: string, options: CBPClientOptions = {}) => {
  const { open = () => {}, isFullReceive = true } = options;

  createWSConnector({
    url,
    role: 'client',
    globalKey: 'chatbotClient',
    extraHeaders: {
      [FULL_RECEIVE_HEADER]: isFullReceive ? '1' : '0'
    },
    onOpen: open,
    onMessage: (messageStr: string) => {
      try {
        const parsedMessage: ParsedMessage = flattedJSON.parse(messageStr);

        if (parsedMessage?.activeId) {
          // 主端主动消息
          if (parsedMessage.active === 'sync') {
            const configs = parsedMessage.payload;
            const env = configs.env || {};

            for (const key in env) {
              process.env[key] = env[key];
            }
          }
        } else if (parsedMessage?.apiId) {
          const resolve = apiResolves.get(parsedMessage.apiId);

          if (resolve) {
            apiResolves.delete(parsedMessage.apiId);
            const timeout = apiTimeouts.get(parsedMessage.apiId);

            if (timeout) {
              apiTimeouts.delete(parsedMessage.apiId);
              clearTimeout(timeout);
            }
            if (Array.isArray(parsedMessage.payload)) {
              resolve(parsedMessage.payload);
            } else {
              resolve([createResult(ResultCode.Fail, '接口处理错误', null)]);
            }
          }
        } else if (parsedMessage?.actionId) {
          const resolve = actionResolves.get(parsedMessage.actionId);

          if (resolve) {
            actionResolves.delete(parsedMessage.actionId);
            const timeout = actionTimeouts.get(parsedMessage.actionId);

            if (timeout) {
              actionTimeouts.delete(parsedMessage.actionId);
              clearTimeout(timeout);
            }
            if (Array.isArray(parsedMessage.payload)) {
              resolve(parsedMessage.payload);
            } else {
              resolve([createResult(ResultCode.Fail, '消费处理错误', null)]);
            }
          }
        } else if (parsedMessage.name) {
          onProcessor(parsedMessage.name, parsedMessage as any, parsedMessage.value);
        }
      } catch (error) {
        logger.error({
          code: ResultCode.Fail,
          message: '客户端解析消息失败',
          data: error
        });
      }
    }
  });
};

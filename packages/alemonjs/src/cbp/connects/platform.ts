import * as flattedJSON from 'flatted';
import { WebSocket } from 'ws';
import { deviceId } from '../processor/config';
import { Result, ResultCode } from '../../core';
import type { Actions, Apis, EventsEnum } from '../../types';
import type { ActionReplyFunc, ApiReplyFunc } from '../typings';
import { createWSConnector } from './base';

/**
 * CBP 平台端
 * @param url
 * @param options
 * @returns
 */
export const cbpPlatform = (
  url: string,
  options = {
    open: () => {}
  }
) => {
  const { open = () => {} } = options;

  /**
   * 发送数据
   * @param data
   */
  const send = (data: EventsEnum) => {
    if (global.chatbotPlatform && global.chatbotPlatform.readyState === WebSocket.OPEN) {
      data.DeviceId = deviceId;
      global.chatbotPlatform.send(flattedJSON.stringify(data));
    }
  };
  const actionReplys: ActionReplyFunc[] = [];
  const apiReplys: ApiReplyFunc[] = [];

  /**
   * 消费数据
   */
  const replyAction = (data: Actions, payload: Result[]) => {
    if (global.chatbotPlatform && global.chatbotPlatform.readyState === WebSocket.OPEN) {
      global.chatbotPlatform.send(
        flattedJSON.stringify({
          action: data.action,
          payload: payload,
          actionId: data.actionId,
          DeviceId: data.DeviceId
        })
      );
    }
  };

  const replyApi = (data: Apis, payload: Result[]) => {
    if (global.chatbotPlatform && global.chatbotPlatform.readyState === WebSocket.OPEN) {
      global.chatbotPlatform.send(
        flattedJSON.stringify({
          action: data.action,
          apiId: data.apiId,
          DeviceId: data.DeviceId,
          payload: payload
        })
      );
    }
  };

  /**
   * 接收行为
   */
  const onactions = (reply: ActionReplyFunc) => {
    actionReplys.push(reply);
  };

  /**
   * 接收接口
   */
  const onapis = (reply: ApiReplyFunc) => {
    apiReplys.push(reply);
  };

  createWSConnector({
    url,
    role: 'platform',
    globalKey: 'chatbotPlatform',
    onOpen: open,
    onMessage: (messageStr: string) => {
      try {
        const data = flattedJSON.parse(messageStr);

        if (data.apiId) {
          for (const cb of apiReplys) {
            void cb(data, val => replyApi(data, val));
          }
        } else if (data.actionId) {
          for (const cb of actionReplys) {
            void cb(data, val => replyAction(data, val));
          }
        }
      } catch (error) {
        logger.error({
          code: ResultCode.Fail,
          message: '解析消息失败',
          data: error
        });
      }
    }
  });

  const client = {
    send,
    onactions,
    onapis
  };

  return client;
};

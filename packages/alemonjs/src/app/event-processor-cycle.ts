/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { Next, Events, EventKeys } from '../types';
import { expendEvent } from './event-processor-event';
import { expendMiddleware } from './event-processor-middleware';
import { expendSubscribeCreate, expendSubscribeMount, expendSubscribeUnmount } from './event-processor-subscribe';
import { finishCurrentTrace } from './hook-event-context';

/**
 * 消息体处理机制
 * @param event
 * @param key
 */
export const expendCycle = <T extends EventKeys>(valueEvent: Events[T], select: T, _config?: any) => {
  const nextEnd: Next = () => {
    finishCurrentTrace('completed');
  };
  // unmount
  const nextUnMount: Next = (cn, ...cns) => {
    if (cn) {
      nextEnd(...cns);

      return;
    }
    void expendSubscribeUnmount(valueEvent, select, nextEnd);
  };
  // event
  const nextEvent: Next = (cn, ...cns) => {
    if (cn) {
      nextUnMount(...cns);

      return;
    }
    void expendEvent(valueEvent, select, nextUnMount);
  };
  // mount
  const nextMount: Next = (cn, ...cns) => {
    if (cn) {
      nextEvent(...cns);

      return;
    }
    void expendSubscribeMount(valueEvent, select, nextEvent);
  };
  // middleware
  const nextCreate: Next = (cn, ...cns) => {
    if (cn) {
      nextMount(...cns);

      return;
    }
    void expendMiddleware(valueEvent, select, nextMount);
  };

  // create
  void expendSubscribeCreate(valueEvent, select, nextCreate);
};

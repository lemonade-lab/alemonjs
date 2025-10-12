import type { EventKeys, Apis, Actions } from '../types';
import type { Result } from '../core';

export type ParsedMessage = {
  apiId?: string;
  actionId?: string;
  testID?: string;
  ChannelId?: string;
  GuildId?: string;
  name?: EventKeys;
  DeviceId?: string;
  activeId?: string;
  /**
   * 负载
   */
  payload?: any;
  // 其他信息
  [key: string]: any;
};

export type CBPClientOptions = {
  open?: () => void;
  isFullReceive?: boolean; // 是否全量接收
};

export type ActionReplyFunc = (data: Actions, consume: (payload: Result[]) => void) => void;

export type ApiReplyFunc = (data: Apis, consume: (payload: Result[]) => void) => void;

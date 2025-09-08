import { EventKeys } from '../typings';
import { Actions } from '../typing/actions';
import { Result } from '../core/utils';
import { Apis } from '../typing/apis';
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

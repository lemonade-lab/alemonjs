import type { WebSocket } from 'ws';

/**
 * CBP 应用处理器接口
 * CBP Server 通过此接口对接插件
 */
export type CBPAppHandler = {
  /** 处理 sandbox 模式下客户端消息的转发 */
  onClientMessage: (message: string) => void;
  /** 处理 WS 连接 */
  onConnection: (ws: WebSocket) => void;
  /** 清理资源 */
  cleanup: () => void;
};

export type ParsedMessage = {
  apiId?: string;
  actionId?: string;
  testID?: string;
  ChannelId?: string;
  GuildId?: string;
  name?: string;
  DeviceId?: string;
  activeId?: string;
  payload?: any;
  type?: string;
  [key: string]: any;
};

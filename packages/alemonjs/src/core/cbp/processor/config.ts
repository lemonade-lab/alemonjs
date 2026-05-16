import { WebSocket } from 'ws';
// 子客户端
export const childrenClient = new Map<string, WebSocket>();
// 平台客户端
export const platformClient = new Map<string, WebSocket>();
// 全量客户端
export const fullClient = new Map<string, WebSocket>();
// 分配绑定记录
export const childrenBind = new Map<string, string>();
// 客户端绑定计数（O(1) 负载均衡查询，替代 O(n) 全量扫描）
export const clientBindCount = new Map<string, number>();

/**
 * 绑定频道/群到客户端（同步维护计数器）
 */
export const bindChannelToClient = (channelId: string, clientId: string) => {
  const oldClientId = childrenBind.get(channelId);

  if (oldClientId && oldClientId !== clientId) {
    const oldCount = clientBindCount.get(oldClientId) ?? 0;

    if (oldCount > 1) {
      clientBindCount.set(oldClientId, oldCount - 1);
    } else {
      clientBindCount.delete(oldClientId);
    }
  }
  childrenBind.set(channelId, clientId);
  clientBindCount.set(clientId, (clientBindCount.get(clientId) ?? 0) + 1);
};

/**
 * 清理指定客户端的所有绑定记录（客户端断开时调用）
 */
export const unbindClient = (clientId: string) => {
  for (const [channelId, boundClientId] of childrenBind.entries()) {
    if (boundClientId === clientId) {
      childrenBind.delete(channelId);
    }
  }
  clientBindCount.delete(clientId);
};

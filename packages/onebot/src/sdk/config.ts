type PromiseHandlers = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
};

// 行为回调
export const actionResolves = new Map<string, PromiseHandlers>();
// 超时器
export const actionTimeouts = new Map<string, NodeJS.Timeout>();
// 生成唯一标识符
export const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
// 超时时间
export const timeoutTime = 1000 * 12; // 12秒

/** Reject every in-flight action when a transport can no longer deliver it. */
export const rejectPendingActions = (reason: Error) => {
  for (const [id, { reject }] of actionResolves) {
    const timeout = actionTimeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
    }
    reject(reason);
  }
  actionResolves.clear();
  actionTimeouts.clear();
};

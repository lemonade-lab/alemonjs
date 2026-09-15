export const parseGateway = (value: string, token?: string) => {
  let gateway: URL;

  try {
    gateway = new URL(value);
  } catch {
    throw new Error('[douyin] douyin.gateway 必须是 ws:// 或 wss:// URL');
  }
  const isLocalGateway = ['localhost', '127.0.0.1', '::1'].includes(gateway.hostname);

  if (!['ws:', 'wss:'].includes(gateway.protocol)) {
    throw new Error('[douyin] douyin.gateway 必须使用 ws:// 或 wss://');
  }
  if (gateway.username || gateway.password) {
    throw new Error('[douyin] douyin.gateway 不允许包含 URL 用户名或密码');
  }
  if (!isLocalGateway && gateway.protocol !== 'wss:') {
    throw new Error('[douyin] 非本地 gateway 必须使用 wss://');
  }
  if (!isLocalGateway && !token) {
    throw new Error('[douyin] 非本地 gateway 必须配置 douyin.token');
  }

  return gateway;
};

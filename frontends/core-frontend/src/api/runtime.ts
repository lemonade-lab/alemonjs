const API_BASE = String(import.meta.env.VITE_ALEMONJS_API_BASE ?? '').replace(/\/$/, '');
const REQUEST_TIMEOUT = 8_000;

const resolveAPIUrl = (path: string) => {
  if (API_BASE) {
    return `${API_BASE}/${path.replace(/^\/+/, '')}`;
  }

  // Keep the proxy path when the frontend is mounted below a path prefix.
  const currentURL = new URL(window.location.href);
  if (!currentURL.pathname.endsWith('/')) {
    currentURL.pathname += '/';
  }

  return new URL(path.replace(/^\/+/, ''), currentURL).toString();
};

type APIEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

export type RuntimeApp = {
  name: string;
  kind: 'main' | 'plugin';
  status: 'discovered' | 'loading' | 'ready' | 'failed' | 'disposed';
  enabled: boolean;
  capabilities: { event?: boolean; web?: boolean; httpApi?: boolean; schedule?: boolean; expose?: boolean };
  error?: { message?: string };
};

export type RuntimeEndpoint = {
  port: number | null;
  serverPort: number | null;
};

export class RuntimeAPIError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'RuntimeAPIError';
  }
}

const request = async <T>(path: string, signal?: AbortSignal): Promise<T> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  const cancel = () => controller.abort();

  signal?.addEventListener('abort', cancel, { once: true });

  try {
    const response = await fetch(resolveAPIUrl(path), {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    const contentType = response.headers.get('content-type') ?? '';
    const text = await response.text();

    if (!contentType.includes('application/json')) {
      throw new RuntimeAPIError(`核心服务未返回 JSON（HTTP ${response.status}）；请确认代理已转发当前路径的 API。`, response.status);
    }

    let body: APIEnvelope<T>;
    try {
      body = JSON.parse(text) as APIEnvelope<T>;
    } catch {
      throw new RuntimeAPIError('核心服务返回了无效的 JSON。', response.status);
    }

    if (!response.ok || body.code !== 200) {
      throw new RuntimeAPIError(body.message || '核心服务请求失败。', response.status);
    }

    return body.data;
  } catch (error) {
    if (error instanceof RuntimeAPIError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new RuntimeAPIError('核心服务请求超时，请检查 serverPort 是否可用。');
    }

    throw new RuntimeAPIError(error instanceof Error ? error.message : '无法连接核心服务。');
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
};

export const getRuntimeOverview = async (signal?: AbortSignal) => {
  const [endpoint, apps] = await Promise.all([request<RuntimeEndpoint | null>('api/online', signal), request<RuntimeApp[]>('api/runtime/apps', signal)]);

  return { online: true, endpoint, apps: Array.isArray(apps) ? apps : [] };
};

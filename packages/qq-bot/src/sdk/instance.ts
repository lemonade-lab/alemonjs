import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from 'alemonjs';

/** Log an allowlist of diagnostics. Axios config/request objects may contain
 * credentials, signed URLs, message bodies, buffers and circular references. */
const loggerError = (err: any) => {
  const config = err?.config;
  let path: string | undefined;

  try {
    // Never log URL credentials, query parameters or fragments.
    path = new URL(config?.url ?? '', config?.baseURL || 'http://localhost').pathname;
  } catch {
    path = undefined;
  }
  const headers = err?.response?.headers;
  const data = err?.response?.data;
  const scalarCode = (value: unknown) => (typeof value === 'number' || (typeof value === 'string' && /^[\w-]{1,64}$/.test(value)) ? value : undefined);

  logger.error('[qq-bot] HTTP request failed', {
    method: typeof config?.method === 'string' ? config.method.toUpperCase() : undefined,
    path,
    status: err?.response?.status,
    code: scalarCode(data?.code ?? data?.err_code),
    transportCode: scalarCode(err?.code),
    traceId: headers?.['x-tps-trace-id'] ?? headers?.['x-trace-id']
  });
};

/** Preserve native platform failure payloads for existing SDK and Action callers. */
export const createAxiosInstance = async (service: AxiosInstance, options: AxiosRequestConfig): Promise<any> => {
  try {
    const res = await service(options);

    return res?.data ?? {};
  } catch (err) {
    loggerError(err);
    throw err?.response?.data ?? err;
  }
};

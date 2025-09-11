import { AxiosInstance } from 'axios';
import { type AxiosRequestConfig } from 'axios';

const filterHeaders = (headers = {}) => {
  if (!headers) {
    return headers;
  }
  const filtered = {};
  const sensitiveKeys = [/^authorization$/i, /^cookie$/i, /^set-cookie$/i, /token/i, /key/i, /jwt/i, /^session[-_]id$/i, /^uid$/i, /^user[-_]id$/i];

  for (const key in headers) {
    if (/^_/.test(key)) {
      continue; // 跳过 _ 开头
    }
    // 去掉 Symbol 类型的 key
    if (typeof key === 'symbol') {
      continue;
    }
    // 去掉函数
    if (typeof headers[key] === 'function') {
      continue;
    }
    // 如果是敏感字段全部替换为 ******
    if (sensitiveKeys.some(re => re.test(key))) {
      filtered[key] = '******';
    } else {
      filtered[key] = headers[key];
    }
  }

  return filtered;
};

const filterConfig = (config = {}) => {
  if (!config) {
    return config;
  }
  const filtered = {};

  for (const key in config) {
    if (/^_/.test(key)) {
      continue; // 跳过 _ 开头
    }
    // 去掉 Symbol 类型的 key
    if (typeof key === 'symbol') {
      continue;
    }
    // 去掉函数
    if (typeof config[key] === 'function') {
      continue;
    }
    filtered[key] = config[key];
  }

  return filtered;
};

const filterRequest = (request = {}) => {
  if (!request) {
    return request;
  }
  const filtered = {};

  for (const key in request) {
    if (/^_/.test(key)) {
      continue; // 跳过 _ 开头
    }
    // 去掉 Symbol 类型的 key
    if (typeof key === 'symbol') {
      continue;
    }
    // 去掉函数
    if (typeof request[key] === 'function') {
      continue;
    }
    filtered[key] = request[key];
  }

  return filtered;
};

// 处理axios错误
const loggerError = err => {
  // 错误时的请求头
  logger.error('[axios] error', {
    config: {
      headers: filterHeaders(err?.config?.headers),
      params: err?.config?.params,
      data: err?.config?.data
    },
    response: {
      status: err?.response?.status,
      statusText: err?.response?.statusText,
      headers: filterHeaders(err?.response?.headers),
      config: filterConfig(err?.response?.config),
      request: filterRequest(err?.response?.request),
      data: err?.response?.data
    },
    message: err?.message
  });
};

/**
 * 基础请求
 * @param service
 * @param options
 * @returns
 */
export const createAxiosInstance = (service: AxiosInstance, options: AxiosRequestConfig): Promise<any> => {
  return new Promise((resolve, reject) => {
    service(options)
      .then(res => resolve(res?.data ?? {}))
      .catch(err => {
        loggerError(err);
        // 丢出错误中携带的响应数据
        reject(err?.response?.data);
      });
  });
};

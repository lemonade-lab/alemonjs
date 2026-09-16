// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
export interface HttpResponse<T = unknown> {
  ok: boolean;
  status: number;
  headers: Headers;
  data: T;
  rawText: string;
}

export type ResponseFailureKind = 'captcha' | 'passport-verification' | 'challenge' | 'empty' | 'invalid-json' | 'http';

/** 仅携带诊断元数据，不包含请求 query、凭据与响应体 */
export class DouyinResponseError extends Error {
  override readonly name = 'DouyinResponseError';
  readonly endpoint: string;
  readonly logId: string | undefined;

  constructor(readonly kind: ResponseFailureKind, readonly status: number, url: string, headers: Headers) {
    const endpoint = new URL(url).pathname;
    const logId = headers.get('x-tt-logid') ?? undefined;

    super(`Douyin ${kind}: HTTP ${status} ${endpoint}${logId ? ` (logid=${logId})` : ''}`);
    this.endpoint = endpoint;
    this.logId = logId;
  }
}

/** 仅用于 JSON 接口；HTML/protobuf 响应由调用方自行解码 */
export function parseJsonResponse<T>(response: HttpResponse<string>, url: string): T {
  const { status, headers, rawText, ok } = response;
  const fail = (kind: ResponseFailureKind): never => {
    throw new DouyinResponseError(kind, status, url, headers);
  };
  let decoded: unknown;

  try {
    decoded = JSON.parse(rawText);
  } catch {
    if (headers.get('x-vc-bdturing-parameters')) {
      return fail('captcha');
    }
    if (headers.get('x-tt-verify-passport-decision')) {
      return fail('passport-verification');
    }
    if (/__ac_nonce|_\$jsvmprt/.test(rawText)) {
      return fail('challenge');
    }
    if (!ok) {
      return fail('http');
    }

    return fail(rawText.trim() ? 'invalid-json' : 'empty');
  }
  if (!ok) {
    return fail('http');
  }
  if (decoded === null || typeof decoded !== 'object') {
    return fail('invalid-json');
  }

  return decoded as T;
}

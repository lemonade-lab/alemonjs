// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
/* eslint-disable max-len -- Embedded upstream verification-page JavaScript. */
/**
 * 登录安全验证（验证中心决策）本地浏览器验证页。
 *
 * 逆向自 douyin-im e767ef72（修复发送限速）：Passport 登录响应（check_qrconnect 等）
 * 可能下发 verify_center_decision_conf / verify_center_secondary_decision_conf，
 * 要求先完成官方安全验证（滑块/短信/扫码等）才能获得可信登录态 ——
 * 登录态可信度不足是发送消息被会话级降权（7523）的根因。
 *
 * 本模块启动本地 HTTP 验证页承载官方验证组件（Second Verify 1.0.29 / captcha SDK），
 * 验证完成后把结果字段回填原请求重试。
 */
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { logger } from '../logger.js';
import { randomDesktopHex } from '../sign/sign-qs.js';
import type { DouyinHttp } from '../http/client.js';
import type { CheckQrconnectData } from './types.js';
import { DESKTOP_APP_VERSION, DESKTOP_LITE_AID, desktopLitePassportFormPost } from './passport-lite.js';

const require = createRequire(import.meta.url);

/** 官方验证码 SDK（验证中心）及备用地址 */
const VERIFY_CENTER_SDK = 'https://lf-rc1.yhgfb-cn-static.com/obj/rc-verifycenter/verifycenter/@latest/index.js';
const VERIFY_CENTER_SDK_BACKUPS = [
  'https://lf-rc2.yhgfb-cn-static.com/obj/rc-verifycenter/verifycenter/@latest/index.js',
  'https://lf-cdn-tos.bytescm.com/obj/rc-verifycenter/verifycenter/@latest/index.js'
] as const;

/** 验证页代理允许访问的主机 */
const VERIFICATION_HOSTS = new Set(['imdesktop.douyin.com', 'verify.zijieapi.com', 'vcs.zijieapi.com']);

/** 一次验证中心决策（原始 conf + 解析结果 + 是否二次决策） */
export interface ParsedVerificationDecision {
  raw: string;
  decision: Record<string, unknown>;
  secondary: boolean;
}

/** 验证完成结果：fp 回填 query，fields 回填 body */
export interface VerificationOutcome {
  fp?: string;
  fields: Record<string, unknown>;
}

export interface BrowserVerificationHooks {
  signal?: AbortSignal;
  /** 验证页就绪后回调（把链接推给用户在浏览器打开） */
  onUrl?: (url: string) => void;
  /** 默认 5 分钟 */
  timeoutMs?: number;
}

/**
 * 从登录响应中解析验证中心决策；无决策返回 undefined。
 * 检测顺序对齐参考实现：主决策 > 二次决策；无 conf 时按
 * error_code=1105 或 captcha 字段兜底为滑块验证。
 */
export function parseVerificationDecision(data: CheckQrconnectData): ParsedVerificationDecision | undefined {
  const source = data as unknown as Record<string, unknown>;
  const nested = asRecord(source['data']);
  const candidates: ReadonlyArray<readonly [unknown, boolean]> = [
    [nested?.['verify_center_decision_conf'], false],
    [nested?.['verify_center_secondary_decision_conf'], true],
    [source['verify_center_decision_conf'], false],
    [source['verify_center_secondary_decision_conf'], true]
  ];
  const selected = candidates.find(([value]) => value !== null && value !== undefined && value !== '');
  const rawValue = selected?.[0];
  const secondary = selected?.[1] === true;
  const record = asRecord(rawValue);

  if (record) {
    return {
      raw: JSON.stringify(record),
      decision: { ...record, ...(secondary ? { verification_level: 'secondary' } : {}) },
      secondary
    };
  }
  if (typeof rawValue === 'string' && rawValue.length > 0) {
    return {
      raw: rawValue,
      decision: { ...parseDecisionConf(rawValue), ...(secondary ? { verification_level: 'secondary' } : {}) },
      secondary
    };
  }
  // captcha 兜底（error_code=1105 或响应带非空 captcha 字段）
  const errorCode = Number(source['error_code'] ?? 0);
  const captchaValue = source['captcha'];
  const hasCaptcha = captchaValue !== null && captchaValue !== undefined && captchaValue !== '';

  if (errorCode !== 1105 && !hasCaptcha) {
    return undefined;
  }
  const fallback: Record<string, unknown> = {
    verify_from: 'captcha',
    ...(hasCaptcha ? { captcha: captchaValue } : {}),
    ...(source['verify_ticket'] !== null && source['verify_ticket'] !== undefined ? { verify_ticket: source['verify_ticket'] } : {})
  };

  return { raw: JSON.stringify(fallback), decision: fallback, secondary: false };
}

/** 打开本地验证页并等待用户完成官方安全验证 */
export async function runBrowserVerification(
  http: DouyinHttp,
  descriptor: ParsedVerificationDecision,
  hooks: BrowserVerificationHooks = {}
): Promise<VerificationOutcome> {
  hooks.signal?.throwIfAborted();
  const timeoutMs = hooks.timeoutMs ?? 300_000;
  const react = await readFile(resolveReactAsset('react', 'react.production.min.js'));
  const reactDom = await readFile(resolveReactAsset('react-dom', 'react-dom.production.min.js'));
  const prepared = await prepareVerification(http, descriptor);

  hooks.signal?.throwIfAborted();

  return new Promise<VerificationOutcome>((resolve, reject) => {
    let finished = false;
    const sessionToken = randomUUID();
    const finish = (error?: Error, outcome?: VerificationOutcome): void => {
      if (finished) {
        return;
      }
      finished = true;
      clearTimeout(timer);
      hooks.signal?.removeEventListener('abort', aborted);
      if (hooks.signal?.aborted) {
        server.closeAllConnections();
      }
      server.close(() => (error ? reject(error) : resolve(outcome ?? { fields: {} })));
    };
    const server = createServer((request, response) => {
      void handleRequest(request, response, {
        http,
        prepared,
        react,
        reactDom,
        sessionToken,
        finish
      }).catch((error: unknown) => {
        sendJson(response, 500, { error: error instanceof Error ? error.message : String(error) });
      });
    });

    server.once('error', error => finish(error));
    const timer = setTimeout(() => finish(new Error('登录验证超时')), timeoutMs);
    const aborted = () => finish(new Error('登录验证已取消'));

    hooks.signal?.addEventListener('abort', aborted, { once: true });

    timer.unref();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();

      if (typeof address !== 'object' || address === null) {
        finish(new Error('无法取得登录验证页地址'));

        return;
      }
      const url = `http://127.0.0.1:${address.port}/?token=${encodeURIComponent(sessionToken)}`;

      logger.info(`[douyin] 登录安全验证页: ${url}`);
      try {
        hooks.onUrl?.(url);
      } catch {
        finish(new Error('登录验证回调失败'));
      }
    });
  });
}

interface PreparedVerification {
  mode: 'verify-center' | 'second-verify';
  config: Record<string, unknown>;
  fp: string;
  deviceId: string;
  captchaScriptUrls?: string[];
  scriptUrl?: string;
}

/** 组装验证组件启动配置：verify_center 决策需先换取动态验证脚本配置 */
async function prepareVerification(http: DouyinHttp, descriptor: ParsedVerificationDecision): Promise<PreparedVerification> {
  // 对齐 douyin-im：验证组件使用连接的注册设备身份；无注册设备时回退随机 hex
  const deviceId = http.hasDesktopDevice() ? http.deviceId : randomDesktopHex(16);
  let config = { ...descriptor.decision };
  const verifyFrom = String(config['verify_from'] ?? '');
  // VerifyCenter 按 code（10000/20000/30000/40000）分发，而非嵌套 MFA 决策里的描述串
  const verifyCenter = [10000, 20000, 30000, 40000].includes(Number(config['code']));

  if (!verifyCenter && verifyFrom === 'verify_center') {
    config = { ...config, ...(await packVerifyWaysData(http, config, deviceId)) };
  }
  const fp = `verify_${deviceId}`;
  const rawUrl = typeof config['url'] === 'string' ? config['url'] : undefined;

  if (verifyCenter) {
    const setting = await loadVerifyCenterSetting(http, deviceId);
    const configuredPrimary = asRecord(setting?.['js_v2'])?.['cn'];
    const configuredBackups = asRecord(setting?.['back_up_js_v2'])?.['cn'];
    const urls = [
      ...(typeof configuredPrimary === 'string' ? [configuredPrimary] : []),
      ...(Array.isArray(configuredBackups) ? configuredBackups.filter((value): value is string => typeof value === 'string') : []),
      VERIFY_CENTER_SDK,
      ...VERIFY_CENTER_SDK_BACKUPS
    ];

    if (setting) {
      config['scene_level'] = setting['scene_level'] ?? 'p2';
    }

    return { mode: 'verify-center', config, fp, deviceId, captchaScriptUrls: [...new Set(urls)] };
  }
  if (!rawUrl) {
    throw new Error('平台未下发登录验证脚本 URL');
  }
  const script = new URL(rawUrl);

  if (script.protocol !== 'https:') {
    throw new Error(`平台下发了不安全的登录验证脚本: ${script.protocol}`);
  }
  script.searchParams.set('aid', DESKTOP_LITE_AID);
  const eventParams = asRecord(config['event_params']);

  script.searchParams.set('verify_reason', String(eventParams?.['verify_reason'] ?? ''));
  script.searchParams.set('verify_scene', String(eventParams?.['verify_scene'] ?? ''));

  return { mode: 'second-verify', config, fp, deviceId, scriptUrl: script.toString() };
}

/**
 * Desktop Second Verify 1.0.29：将 verify-center 决策换成动态验证脚本配置。
 * POST /passport/safe/pack_verify_ways_data/，字段 encodePassportField 编码，
 * 跳过 is_login / null。
 */
async function packVerifyWaysData(http: DouyinHttp, decision: Record<string, unknown>, deviceId: string): Promise<Record<string, unknown>> {
  const body: Record<string, string> = {};
  const requestData: Record<string, unknown> = {
    aid: Number(DESKTOP_LITE_AID),
    ...decision,
    device_id: deviceId,
    iid: '0',
    version_code: DESKTOP_APP_VERSION,
    device_platform: 'PC'
  };

  for (const [key, value] of Object.entries(requestData)) {
    if (key === 'is_login' || value === null || value === undefined) {
      continue;
    }
    body[key] = encodePassportField(value);
  }
  const res = await desktopLitePassportFormPost(http, '/passport/safe/pack_verify_ways_data/', body);

  if (res.data.error_code !== null && res.data.error_code !== undefined && res.data.error_code !== 0) {
    throw new Error(`pack_verify_ways_data failed: code=${res.data.error_code} ${String(res.data.description ?? '')}`);
  }

  return res.data;
}

/** 验证码 SDK 配置（含 scene_level 与 js_v2 脚本地址）；失败不阻断，走内置 SDK 地址 */
async function loadVerifyCenterSetting(http: DouyinHttp, deviceId: string): Promise<Record<string, unknown> | undefined> {
  try {
    const query = new URLSearchParams({ aid: DESKTOP_LITE_AID, did: deviceId || '0', iid: '0' });
    const res = await requestVerificationRaw(http, `https://vcs.zijieapi.com/vc/setting?${query}`, { method: 'GET', headers: { 'X-Setting-Flag': '1' } });

    if (!res.ok) {
      return undefined;
    }
    const parsed = asRecord(tryParseJson(res.rawText));
    const data = asRecord(parsed?.['data']) ?? parsed;

    return asRecord(data?.['verify']);
  } catch {
    return undefined;
  }
}

/**
 * 验证组件专用请求：imdesktop 域带账号 Cookie + Passport 头；
 * 验证中心域（zijieapi）不带 Cookie，避免混入登录态。
 */
async function requestVerificationRaw(
  http: DouyinHttp,
  url: string,
  init: RequestInit
): Promise<{ ok: boolean; status: number; headers: Headers; rawText: string }> {
  if (new URL(url).origin === 'https://imdesktop.douyin.com') {
    const res = await http.requestRaw(url, {
      ...init,
      headers: { ...http.passportHeaders(url), ...(init.headers as Record<string, string> | undefined) }
    });

    return { ok: res.ok, status: res.status, headers: res.headers, rawText: res.rawText };
  }
  const res = await fetch(url, {
    ...init,
    headers: { 'User-Agent': http.getUserAgent(), ...(init.headers as Record<string, string> | undefined) },
    signal: AbortSignal.timeout(30_000)
  });

  return { ok: res.ok, status: res.status, headers: res.headers, rawText: await res.text() };
}

interface RequestContext {
  http: DouyinHttp;
  prepared: PreparedVerification;
  react: Buffer;
  reactDom: Buffer;
  sessionToken: string;
  finish: (error?: Error, outcome?: VerificationOutcome) => void;
}

async function handleRequest(request: IncomingMessage, response: ServerResponse, state: RequestContext): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');

  if (url.searchParams.get('token') !== state.sessionToken) {
    sendJson(response, 403, { error: '登录验证会话无效' });

    return;
  }
  if (request.method === 'GET' && url.pathname === '/') {
    sendHtml(response, platformVerificationHtml(state.prepared, state.sessionToken));

    return;
  }
  if (request.method === 'GET' && url.pathname === '/react.js') {
    sendScript(response, state.react);

    return;
  }
  if (request.method === 'GET' && url.pathname === '/react-dom.js') {
    sendScript(response, state.reactDom);

    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/request') {
    const payload = await readJsonBody(request);
    const target = resolveVerificationUrl(payload['url'], payload['baseURL']);

    assertVerificationHost(target);
    const method = String(payload['method'] ?? 'GET').toUpperCase();

    if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(method)) {
      throw new Error(`登录验证不支持请求方法: ${method}`);
    }
    const headers = sanitizeProxyHeaders(asStringRecord(payload['headers']));
    const body = typeof payload['body'] === 'string' ? payload['body'] : undefined;
    const result = await requestVerificationRaw(state.http, target.toString(), {
      method,
      headers,
      ...(body !== undefined && method !== 'GET' && method !== 'HEAD' ? { body } : {})
    });

    sendJson(response, 200, {
      data: tryParseJson(result.rawText),
      rawText: result.rawText,
      status: result.status,
      statusText: result.ok ? 'OK' : 'ERROR',
      headers: Object.fromEntries([...result.headers.entries()].filter(([key]) => key.toLowerCase() !== 'set-cookie'))
    });

    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/complete') {
    const payload = await readJsonBody(request);
    const resultValue = asRecord(payload['result']);
    const fields = asRecord(resultValue?.['fields'] ?? resultValue) ?? {};
    const fp = String(resultValue?.['fp'] ?? '') || state.prepared.fp;

    sendJson(response, 200, { ok: true });
    state.finish(undefined, { fp, fields });

    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/cancel') {
    sendJson(response, 200, { ok: true });
    state.finish(new Error('用户关闭了登录验证'));

    return;
  }
  response.writeHead(404);
  response.end('Not Found');
}

function platformVerificationHtml(prepared: PreparedVerification, sessionToken: string): string {
  const boot = safeJson({
    mode: prepared.mode,
    config: prepared.config,
    fp: prepared.fp,
    scriptUrl: prepared.scriptUrl,
    sessionToken,
    deviceId: prepared.deviceId,
    captchaScriptUrls: prepared.captchaScriptUrls
  });

  return pageShell(
    '抖音登录安全验证',
    `
    <div id="app"><div class="loading">正在加载抖音安全验证…</div></div>
    <script src="/react.js?token=${encodeURIComponent(sessionToken)}"></script>
    <script src="/react-dom.js?token=${encodeURIComponent(sessionToken)}"></script>
    <script>window.__LOGIN_VERIFY__=${boot};</script>
    <script>${browserBridgeScript()}</script>
    <script>window.startDouyinVerification();</script>
  `
  );
}

/** 页面与官方验证组件之间的桥接脚本：代理请求 + 注入环境 + 启动验证 */
function browserBridgeScript(): string {
  return String.raw`
    (() => {
      const boot = window.__LOGIN_VERIFY__;
      localStorage.setItem('s_v_web_id', boot.fp);
      document.cookie = 's_v_web_id=' + encodeURIComponent(boot.fp) + '; path=/';
      const complete = async (result = {}) => {
        const response = await fetch('/api/complete?token=' + encodeURIComponent(boot.sessionToken), {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({result})});
        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error || '恢复登录失败');
        document.getElementById('app').innerHTML = '<main class="card"><h1>验证通过</h1><p>正在继续登录，可以关闭此页。</p></main>';
      };
      const proxy = async (config = {}) => {
        const encode = (value) => value instanceof Date ? value.toISOString() : value && typeof value === 'object' ? JSON.stringify(value) : String(value);
        const params = new URLSearchParams();
        Object.entries(config.params || {}).forEach(([key, value]) => {
          if (value == null) return;
          if (Array.isArray(value)) value.forEach(item => params.append(key + '[]', encode(item)));
          else params.append(key, encode(value));
        });
        let url = config.url || '';
        if (params.size) url += (url.includes('?') ? '&' : '?') + params;
        let body = config.data;
        const headers = {...(config.headers || {})};
        const contentTypeKey = Object.keys(headers).find(key => key.toLowerCase() === 'content-type');
        const contentType = contentTypeKey ? String(headers[contentTypeKey]).toLowerCase() : '';
        if (body instanceof FormData) {
          const form = new URLSearchParams();
          for (const [key, value] of body.entries()) form.append(key, encode(value));
          body = form.toString();
          headers[contentTypeKey || 'Content-Type'] = 'application/x-www-form-urlencoded';
        } else if (body && typeof body === 'object') {
          if (contentType.includes('application/json')) body = JSON.stringify(body);
          else {
            const form = new URLSearchParams();
            Object.entries(body).forEach(([key, value]) => {
              if (value == null) return;
              if (Array.isArray(value)) value.forEach(item => form.append(key + '[]', encode(item)));
              else form.append(key, encode(value));
            });
            body = form.toString();
            headers[contentTypeKey || 'Content-Type'] = 'application/x-www-form-urlencoded';
          }
        }
        const response = await fetch('/api/request?token=' + encodeURIComponent(boot.sessionToken), {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url,baseURL:config.baseURL,method:config.method || 'GET',headers,body})});
        const result = await response.json();
        if (!response.ok || result.error) throw result;
        const axiosResponse = {data: result.data, status: result.status, statusText: result.statusText, headers: result.headers, config};
        if (result.status < 200 || result.status >= 300) {
          const error = new Error('Request failed with status code ' + result.status);
          error.response = axiosResponse;
          error.config = config;
          throw error;
        }
        return axiosResponse;
      };
      window.$$UCALL_APIMAP = window.$$UCALL_APIMAP || {};
      window.$$UCALL_APIMAP['Request.fetch'] = proxy;
      window.$$UCALL_APIMAP['Request.fetchSec'] = proxy;
      window.$$UCALL_APIMAP.Request = proxy;
      window.$$UC_CORE_ENV = {env:'online',container:'web',region:'CN'};
      window.$$UC_ENV_PROMISE = Promise.resolve(window.$$UC_CORE_ENV);
      window.$$UCALL_APIMAP.getEnv = () => window.$$UC_ENV_PROMISE;
      window.$$UCALL_APIMAP.getQuery = () => Object.fromEntries(new URLSearchParams(location.search));
      window.$$UCALL_APIMAP.getSettings = (params) => proxy({url:'/service/settings/v3/',params});
      window.ucSecondVerifyReact = window.React;
      window.ucSecondVerifyReactDom = window.ReactDOM;
      const loadScript = (urls) => new Promise((resolve, reject) => {
        const remaining = [...urls];
        const next = () => {
          const url = remaining.shift();
          if (!url) return reject(new Error('抖音验证 SDK 加载失败'));
          const script = document.createElement('script');
          script.crossOrigin = 'anonymous';
          script.src = url;
          script.onload = resolve;
          script.onerror = next;
          document.head.appendChild(script);
        };
        next();
      });
      window.startDouyinVerification = async () => {
        const common = {aid:339757,did:boot.deviceId || '0',iid:String(boot.config.iid || '0'),...(boot.config.scene_level ? {scene_level:boot.config.scene_level} : {})};
        if (boot.mode === 'verify-center') {
          await loadScript(boot.captchaScriptUrls || []);
          const sdk = window.verifySDK;
          if (!sdk) throw new Error('抖音验证码 SDK 加载失败');
          sdk.initVerifyOptions({commonOptions:common,captchaOptions:{fp:boot.fp,app_name:'抖音聊天',lang:'zh',showMode:'mask',region:'cn',baseEM:70}});
          const success = () => complete({fp: (sdk.getCaptchaWebId && sdk.getCaptchaWebId()) || boot.fp});
          const close = () => fetch('/api/cancel?token=' + encodeURIComponent(boot.sessionToken),{method:'POST'});
          sdk.autoRender({verify_data:boot.config,captchaOptions:{successCb:success,closeCb:close,errorCb:()=>{}},secondVerifyWebOptions:{callBack:success,closeCallBack:close}});
          return;
        }
        await loadScript([boot.scriptUrl]);
        if (typeof window.ucWebSecondVerify !== 'function') throw new Error('抖音二次验证 SDK 加载失败');
        const callback = () => complete({});
        const generalParams = {is_new_login:'1',is_from_iesaccountsaas:1};
        const getGeneralParams = async () => ({device_id:common.did,iid:common.iid,version_code:${JSON.stringify(DESKTOP_APP_VERSION)},device_platform:'PC'});
        const monitorTime = {startTime:Date.now(),fetchEndTime:Date.now(),scriptLoadStartTime:0,scriptLoadEndTime:Date.now(),renderStartTime:Date.now()};
        window.$$account_verify_portrait_id = boot.config.verify_portrait_id || '';
        window.ucWebSecondVerify({...boot.config,aid:339757,appName:'抖音聊天',did:common.did,iid:common.iid,host:'https://imdesktop.douyin.com',newSecondVerifyRequestHost:'https://imdesktop.douyin.com',region:'cn',hcSwitch:false,isOversea:false,ztsdk:false,ztsdkOptions:{agid:1,enableCookieOptions:false},ssoZtsdkOptions:{enable:false},captchaOptions:{fp:boot.fp,baseEM:70},commonOptions:common,generalParams,getGeneralParams,monitorTime,uc_account_verify_version:'1.0.29',fun:boot.config.verify_from === 'verify_center' ? 'verify_center' : 'verify',Request:proxy,request:proxy,verifyFinishCallback:callback,callBack:callback,closeCallBack:()=>fetch('/api/cancel?token=' + encodeURIComponent(boot.sessionToken),{method:'POST'})});
      };
    })();
  `;
}

function pageShell(title: string, body: string): string {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(
    title
  )}</title><style>
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background:#f5f5f5;color:#161823;font-family:system-ui,-apple-system,sans-serif;display:grid;place-items:center}.card{width:min(420px,calc(100vw - 32px));background:white;border-radius:16px;padding:28px;box-shadow:0 12px 48px #0001}.card h1{font-size:22px;margin:0 0 12px}.card p,.loading{color:#666}#app{min-width:min(420px,calc(100vw - 32px))}
  </style></head><body>${body}</body></html>`;
}

function resolveReactAsset(packageName: 'react' | 'react-dom', file: string): string {
  const packagePath = require.resolve(`${packageName}/package.json`);

  return fileURLToPath(new URL(`./umd/${file}`, `file://${packagePath}`));
}

function resolveVerificationUrl(urlValue: unknown, baseValue: unknown): URL {
  const url = String(urlValue ?? '');
  const base = String(baseValue ?? 'https://imdesktop.douyin.com');

  return new URL(url, base);
}

function assertVerificationHost(url: URL): void {
  const host = url.hostname.toLowerCase();

  if (VERIFICATION_HOSTS.has(host)) {
    return;
  }
  throw new Error(`登录验证拒绝访问未知主机: ${host}`);
}

function sanitizeProxyHeaders(headers: Record<string, string>): Record<string, string> {
  const blocked = new Set(['connection', 'content-length', 'cookie', 'host', 'origin', 'proxy-authorization', 'referer', 'set-cookie', 'transfer-encoding']);

  return Object.fromEntries(Object.entries(headers).filter(([key]) => !blocked.has(key.toLowerCase())));
}

async function readJsonBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let length = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

    length += buffer.length;
    if (length > 1_048_576) {
      throw new Error('登录验证请求过大');
    }
    chunks.push(buffer);
  }
  const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('登录验证请求格式错误');
  }

  return parsed as Record<string, unknown>;
}

function sendJson(response: ServerResponse, status: number, data: unknown): void {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(JSON.stringify(data));
}

function sendHtml(response: ServerResponse, html: string): void {
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'referrer-policy': 'no-referrer'
  });
  response.end(html);
}

function sendScript(response: ServerResponse, script: Buffer): void {
  response.writeHead(200, {
    'content-type': 'text/javascript; charset=utf-8',
    'cache-control': 'public, max-age=3600'
  });
  response.end(script);
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    char =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char])
  );
}

/** Passport 字段编码：字符串原样，数字/布尔转字符串，对象 JSON 序列化 */
function encodePassportField(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return JSON.stringify(value);
}

/** 验证结果字段回填 check_qrconnect body 时统一转为字符串 */
export function stringifyVerificationFields(fields: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(fields)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => [key, encodePassportField(value)])
  );
}

function parseDecisionConf(value: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value);

    return asRecord(parsed) ?? { verify_data: parsed };
  } catch {
    return { verify_data: value };
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function asStringRecord(value: unknown): Record<string, string> {
  const record = asRecord(value);

  if (!record) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(record)
      .filter(([, item]) => item !== null && item !== undefined)
      .map(([key, item]) => [key, String(item)])
  );
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

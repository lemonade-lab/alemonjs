import axios from 'axios';
import { createDecipheriv, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { getConfig, logger } from 'alemonjs';
import QRCode from 'qrcode';
import YAML from 'yaml';

/** QQ 门户扫码绑定接口（社区通用入口，官方未公开文档，改版可能失效） */
const PORTAL_HOST = process.env.QQ_PORTAL_HOST || 'q.qq.com';
const CONNECT_URL_TEMPLATE = 'https://q.qq.com/qqbot/openclaw/connect.html?task_id={task_id}&_wv=2&source=alemonjs';
const REQUEST_TIMEOUT = 10000;
const PORTAL_USER_AGENT = 'QQBotAdapter/alemonjs (Node.js)';

/** 绑定任务状态码（与平台返回一致） */
export const BindStatus = {
  NONE: 0,
  PENDING: 1,
  COMPLETED: 2,
  EXPIRED: 3
} as const;

export type PortalResponse = {
  retcode: number;
  msg?: string;
  data?: Record<string, any>;
};

/** 门户请求函数；可注入替换用于测试 */
export type PortalRequest = (path: string, body: Record<string, any>) => Promise<PortalResponse>;

const defaultPortalRequest: PortalRequest = async (path, body) => {
  const res = await axios.post(`https://${PORTAL_HOST}${path}`, body, {
    timeout: REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': PORTAL_USER_AGENT
    }
  });

  return res.data;
};

/**
 * 解密平台下发的机器人密钥：AES-256-GCM，密文结构为 Base64(IV(12字节) + 密文 + AuthTag(16字节))，
 * 密钥为创建绑定任务时本地生成并提交的 key
 */
export const decryptSecret = (encryptedBase64: string, keyBase64: string): string => {
  const key = Buffer.from(keyBase64, 'base64');
  const raw = Buffer.from(encryptedBase64, 'base64');
  const iv = raw.subarray(0, 12);
  const ciphertext = raw.subarray(12);
  const authTag = ciphertext.subarray(ciphertext.length - 16);
  const encryptedData = ciphertext.subarray(0, ciphertext.length - 16);

  const decipher = createDecipheriv('aes-256-gcm', key, iv);

  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encryptedData), decipher.final()]).toString('utf-8');
};

/** 构造扫码授权页链接（手机 QQ 扫码后打开） */
export const buildConnectUrl = (taskId: string): string => {
  return CONNECT_URL_TEMPLATE.replace('{task_id}', encodeURIComponent(taskId));
};

export type QRLoginResult = {
  loginId: string;
  appId: string;
  clientSecret: string;
  userOpenid: string;
};

export type QRLoginOptions = {
  /** 整个扫码流程的总超时（秒） */
  timeoutSeconds?: number;
  /** 二维码过期后的最大刷新次数 */
  maxRefreshes?: number;
  /** 轮询间隔（毫秒） */
  pollInterval?: number;
  /** 注入门户请求（测试用） */
  request?: PortalRequest;
  /** 二维码生成回调（默认同时终端出码并保存图片到运行目录） */
  onQRCode?: (qrBuffer: Buffer, url: string, qrImagePath: string | undefined, loginId: string, refresh: number) => void | Promise<void>;
  /** 状态变化回调 */
  onStatus?: (message: string) => void | Promise<void>;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 扫码登录流程：
 * 创建绑定任务 → 终端出码并保存二维码图片到运行目录 → 轮询授权结果 → 解密 AppSecret。
 * 成功返回 { appId, clientSecret, userOpenid }；超时/失败/刷新次数用尽返回 null
 */
export const qrLogin = async (options: QRLoginOptions = {}): Promise<QRLoginResult | null> => {
  const { timeoutSeconds = 600, maxRefreshes = 3, pollInterval = 2000, request = defaultPortalRequest, onQRCode, onStatus } = options;
  const deadline = Date.now() + timeoutSeconds * 1000;

  for (let refresh = 0; refresh <= maxRefreshes; refresh++) {
    try {
      // 本地生成 AES 密钥，仅存内存；平台用它加密回传的 AppSecret
      const key = randomBytes(32).toString('base64');
      const created = await request('/lite/create_bind_task', { key });

      if (created.retcode !== 0) {
        await onStatus?.(`创建绑定任务失败：${created.msg || `retcode=${created.retcode}`}`);

        return null;
      }

      const taskId = created.data?.task_id;

      if (!taskId) {
        await onStatus?.('创建绑定任务失败：响应缺少 task_id');

        return null;
      }

      const url = buildConnectUrl(taskId);

      let qrImagePath: string | null = null;
      let qrBuffer: Buffer | null = null;

      try {
        qrBuffer = await QRCode.toBuffer(url, { type: 'png', width: 320, margin: 2 });
        qrImagePath = join(process.cwd(), 'qqbot-login-qr.png');
        writeFileSync(qrImagePath, qrBuffer);
      } catch (err) {
        logger.warn(`[qq-bot] 二维码图片保存失败：${err?.message ?? err}`);
      }

      // The external lifecycle notification must not depend on an adapter-local file being writable.
      if (qrBuffer && onQRCode) {
        await onQRCode(qrBuffer, url, qrImagePath ?? undefined, taskId, refresh);
      }

      await onStatus?.('请使用手机 QQ 扫描二维码并确认授权');
      logger.warn('[qq-bot] 注意：扫码授权完成后平台将重置机器人密钥，旧密钥会立即失效；若该机器人已在其他实例中运行，请更新其配置');

      while (Date.now() < deadline) {
        let polled: PortalResponse;

        try {
          polled = await request('/lite/poll_bind_result', { task_id: taskId });
        } catch {
          // 轮询瞬时失败（网络抖动等）：继续重试
          await sleep(pollInterval);
          continue;
        }

        if (polled.retcode !== 0) {
          await onStatus?.(`轮询返回异常：${polled.msg || `retcode=${polled.retcode}`}，继续等待…`);
          await sleep(pollInterval);
          continue;
        }

        const data = polled.data ?? {};
        const status = data.status ?? BindStatus.NONE;

        if (status === BindStatus.COMPLETED) {
          const clientSecret = decryptSecret(String(data.bot_encrypt_secret ?? ''), key);

          await onStatus?.('扫码授权成功');
          logger.info(`[qq-bot] 扫码登录成功：AppID=${data.bot_appid}`);

          return {
            loginId: taskId,
            appId: String(data.bot_appid ?? ''),
            clientSecret,
            userOpenid: String(data.user_openid ?? '')
          };
        }

        if (status === BindStatus.EXPIRED) {
          await onStatus?.(`二维码已过期，正在刷新（${refresh + 1}/${maxRefreshes + 1}）`);
          break;
        }

        await sleep(pollInterval);
      }
    } catch (err) {
      logger.error(`[qq-bot] 扫码登录异常：${err?.message ?? err}`);

      return null;
    }
  }

  await onStatus?.('扫码授权超时');
  logger.warn('[qq-bot] 扫码登录超时');

  return null;
};

/**
 * 将扫码得到的 app_id/secret 写入 alemon 配置文件。
 * 使用 YAML.parseDocument 在文档节点上仅更新目标键值，文件中已有的注释与原有格式保持不变
 */
export const saveBotCredentials = (appId: string, secret: string): boolean => {
  try {
    const config = getConfig();
    const filePath = config.path;

    if (!filePath) {
      logger.warn('[qq-bot] 配置文件路径不可用，无法保存扫码登录凭证');

      return false;
    }

    const raw = existsSync(filePath) ? readFileSync(filePath, 'utf-8') : '';
    const doc = YAML.parseDocument(raw);

    // 文件本身有语法错误时拒绝写入，避免破坏用户配置
    if (doc.errors.length > 0) {
      logger.error(`[qq-bot] 配置文件存在 YAML 语法错误，无法安全写入凭证（${filePath}），请先修复语法错误后重试`);

      return false;
    }

    // 平台全名节优先级更高（getQQBotConfig 合并时覆盖 qq-bot 节），存在则写入该节
    const section = doc.has('@alemonjs/qq-bot') ? '@alemonjs/qq-bot' : 'qq-bot';
    const existing = doc.get(section, true);

    if (existing === undefined || !YAML.isMap(existing)) {
      // 节缺失或不是映射：整体替换为凭据映射
      doc.set(section, { app_id: appId, secret });
    } else {
      doc.setIn([section, 'app_id'], appId);
      doc.setIn([section, 'secret'], secret);
    }

    const dirPath = dirname(filePath);

    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }

    writeFileSync(filePath, doc.toString(), 'utf-8');
    config.reload();

    return true;
  } catch (err) {
    logger.error(`[qq-bot] 保存扫码登录凭证失败：${err?.message ?? err}`);

    return false;
  }
};

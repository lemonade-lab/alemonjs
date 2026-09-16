// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DouyinHttp } from '../http/client.js';
import { CREATOR_AID, CREATOR_ORIGIN } from './constants.js';

const MSSDK_ORIGIN = 'https://mssdk.bytedance.com';

/** 抓包 `magic`（0x20200422），非 aid */
export const MSSDK_MAGIC = 538969122;

export interface MssdkTokenBodyTemplate {
  magic: number;
  version: number;
  dataType: number;
  strData: string;
  ulr: number;
}

export interface BuildMssdkTokenBodyOptions {
  strData?: string;
  tspFromClient?: number;
}

const DEFAULT_TEMPLATE_PATH = join(process.cwd(), 'fixtures/captured/bootstrap/mssdk_token.body.json');

export function loadMssdkTokenTemplate(filePath = process.env['MSSDK_STR_DATA_PATH']): MssdkTokenBodyTemplate {
  const paths = filePath ? [filePath] : [DEFAULT_TEMPLATE_PATH];

  for (const p of paths) {
    try {
      const raw = JSON.parse(readFileSync(p, 'utf8')) as Record<string, unknown>;
      const strData = String(raw['strData'] ?? '');

      if (!strData) {
        continue;
      }

      return {
        magic: Number(raw['magic'] ?? MSSDK_MAGIC),
        version: Number(raw['version'] ?? 1),
        dataType: Number(raw['dataType'] ?? 8),
        strData,
        ulr: Number(raw['ulr'] ?? 0)
      };
    } catch {
      continue;
    }
  }
  throw new Error('MSSDK strData template not found; set MSSDK_STR_DATA_PATH or add fixtures/captured/bootstrap/mssdk_token.body.json');
}

export function getMssdkTokenTemplate(): MssdkTokenBodyTemplate {
  return loadMssdkTokenTemplate();
}

/** POST `/web/r/token` JSON body；`tspFromClient` 每次请求刷新 */
export function buildMssdkTokenBody(options: BuildMssdkTokenBodyOptions = {}): string {
  const tpl = options.strData ? { magic: MSSDK_MAGIC, version: 1, dataType: 8, ulr: 0, strData: options.strData } : getMssdkTokenTemplate();

  return JSON.stringify({
    magic: tpl.magic,
    version: tpl.version,
    dataType: tpl.dataType,
    strData: tpl.strData,
    tspFromClient: options.tspFromClient ?? Date.now(),
    ulr: tpl.ulr
  });
}

export interface FetchMssdkTokenOptions {
  strData?: string;
  tspFromClient?: number;
}

/**
 * POST MSSDK `/web/r/token`：抓包 `strData` 模板 + 刷新 `tspFromClient`，
 * 成功时 msToken 来自 `x-ms-token` 响应头并自动写入客户端 Cookie。
 */
export async function fetchMssdkToken(http: DouyinHttp, options: FetchMssdkTokenOptions = {}): Promise<string | undefined> {
  const body = buildMssdkTokenBody(options);
  const res = await http.requestRaw(`${MSSDK_ORIGIN}/web/r/token?ms_appid=${CREATOR_AID}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
      Origin: CREATOR_ORIGIN,
      Referer: `${CREATOR_ORIGIN}/`
    },
    body
  });
  const header = res.headers.get('x-ms-token');

  if (header) {
    http.setMsToken(header);

    return header;
  }

  return http.getMsToken();
}

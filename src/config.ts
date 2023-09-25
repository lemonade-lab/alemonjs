import { readFileSync, existsSync } from "node:fs";
import { parse } from "@iarna/toml";
import { join } from 'path'

export interface ioRedisOptions {
  host: string;
  port: number;
  password: string;
  db?: number;
}

let urlVal = '/alemon.toml'
/**
 * 读取配置文件
 * @param url
 * @returns
 */
export function getToml(url = urlVal) {
  // 检验文件是否存在
  urlVal = url
  const u = join(process.cwd(), urlVal)
  if (!existsSync(u)) return {} 
  return parse(readFileSync(u, 'utf8')) as {
    redis?: ioRedisOptions
  }
}
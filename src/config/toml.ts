import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { parse } from '@iarna/toml'
import { ConfigType } from './types.js'
import { stringify } from '@iarna/toml'
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
  if (!existsSync(u)) return {} as ConfigType
  return parse(readFileSync(u, 'utf8')) as ConfigType
}

/**
 * 写入配置文件
 * @param data
 */
export function writeToml(data: any) {
  writeFileSync(join(process.cwd(), urlVal), stringify(data))
}

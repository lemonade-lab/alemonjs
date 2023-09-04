import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { parse } from 'yaml'
export const ConfigPuppeteer = 'config/puppeteer.yaml'
/**
 * 读取yaml数据
 * @param url 绝对路径 | 相对路径
 * @returns
 */
export function getYaml(url: string) {
  if (existsSync(url)) return parse(readFileSync(url, 'utf8'))
  /**
   * 没有找到就试试相对路径
   */
  const now = join(process.cwd(), url)
  if (existsSync(now)) return parse(readFileSync(now, 'utf8'))
  return false
}
/**
 * 创建配置
 * @param url 相对路径
 * @returns
 */
export function createYaml(url: string, txt: string) {
  if (existsSync(url)) {
    /**
     * 存在了
     */
    return
  }
  /**
   * 确保目录存在
   */
  mkdirSync(dirname(join(process.cwd(), url)), { recursive: true })
  /**
   * 写入内容
   */
  writeFileSync(join(process.cwd(), url), txt)
  return
}
/**
 * 读取配置
 * @returns
 */
export function getConfig() {
  let PuppeteerConfig: any = {
    headless: 'new',
    timeout: 30000,
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-sandbox',
      '--no-zygote',
      '--single-process'
    ]
  }
  try {
    const data = getYaml(join(process.cwd(), ConfigPuppeteer))
    if (data) {
      PuppeteerConfig = data
    }
  } catch {
    console.info('[puppeteer]默认配置启动')
  }
  return {
    PuppeteerConfig
  }
}

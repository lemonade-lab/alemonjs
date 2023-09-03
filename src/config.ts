import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'

export const ConfigPuppeteer = 'config/puppeteer.yaml'
/**
 * 读取yaml数据
 * @param url 绝对路径
 * @returns
 */
export function getYaml(url) {
  if (existsSync(url)) return parse(readFileSync(url, 'utf8'))
  return false
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

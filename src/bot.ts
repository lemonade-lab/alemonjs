import { setLanchConfig } from './alemon/index.js'
import { getBotConfigByKey, setBotConfig, getToml } from './config/index.js'
import { loadInit } from './alemon/index.js'
import { ClientAPIByQQ } from './ntqq/sdk/index.js'
import { compilationTools } from 'alemon-rollup'
import { createAlemon } from './map.js'

// 设置独立鉴权路径
export const setAuthenticationByNtqq = ClientAPIByQQ.setAuthentication

let appDir = 'application'

/**
 * 初始模块简化
 * @param AppName
 * @param name
 * @returns
 */
export function ApplicationTools(AppName: string, name = 'apps') {
  return compilationTools({
    aInput: `${appDir}/${AppName}/${name}/**/*.ts`,
    aOutput: `${appDir}/${AppName}/apps.js`
  })
}

/**
 * 创建机器人
 * @param val
 * @returns
 */
export async function createBot(
  val: {
    args?: string[]
    mount?: boolean
    address?: string
    cfg?: string
  } = {
    args: process.argv.slice(2),
    mount: false,
    address: 'application'
  }
) {
  const { args, mount, cfg, address } = val

  // 配置快捷路径
  appDir = address == undefined ? 'application' : address

  /**
   * 加载配置
   */
  await setBotConfig(getToml(cfg))
  /**
   * 设置浏览器配置
   */
  await setLanchConfig(getBotConfigByKey('puppeteer'))
  /**
   * 控制
   */
  const arr: string[] = []
  /**
   * 开始启动
   */
  for await (const item of args ?? process.argv.slice(2)) {
    if (arr.indexOf(item) != -1) continue
    if (!createAlemon[item]) continue
    arr.push(item)
    await createAlemon[item]()
  }
  /**
   * 启动插件加载
   */
  await loadInit({
    mount: mount == undefined ? false : mount,
    address: address == undefined ? '/application' : `/${address}`
  })
  return compilationTools
}

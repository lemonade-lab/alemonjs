import crypto from 'crypto'
import { readdirSync, Dirent, existsSync } from 'fs'
import { join } from 'path'
import path from 'path'
import fs from 'fs'
import { createRequire } from 'module'
import { ResultCode } from '../code'
const require = createRequire(import.meta.url)

/**
 * 将字符串转为定长字符串
 * @param str 输入字符串
 * @param options 可选项
 * @returns 固定长度的哈希值
 */
export const createHash = (str: string, options: { length?: number; algorithm?: string } = {}) => {
  const { length = 11, algorithm = 'sha256' } = options
  // 使用 crypto 生成哈希
  const hash = crypto.createHash(algorithm).update(str).digest('hex')
  // 截取指定长度
  return hash.slice(0, length)
}

/**
 * 使用用户的哈希键
 * @param e
 * @returns
 */
export const useUserHashKey = (event: { UserId: string; Platform: string }) => {
  return createHash(`${event.Platform}:${event.UserId}`)
}

/**
 * 创建app名称
 * @param url
 * @param app 模块名
 * @param select 选择事件类型,默认 res
 * @returns
 */
export const createEventName = (url: string, appKey: string) => {
  let uri = url
  if (process.platform === 'win32') {
    uri = uri.replace(/\\/g, '/')
  }
  // 去掉空字符串
  const names = uri.split('/').filter(item => item !== '')
  // 去掉最后一个文件名
  names.pop()
  const name = `${appKey}:${names.join(':')}`
  return name
}

/**
 * 将字符串转为数字
 * @param str
 * @returns
 */
export const stringToNumber = (str: string, size = 33) => {
  let hash = 5381
  let i = str.length
  while (i) {
    hash = (hash * size) ^ str.charCodeAt(--i)
  }
  /*JavaScript对32位签名执行逐位操作（如上面的XOR）
   *整数。由于我们希望结果始终为正，因此转换
   *通过执行无符号位移，将带符号的int转换为无符号*/
  return hash >>> 0
}

const resReg = /^res(\.|\..*\.)(js|ts|jsx|tsx)$/

/**
 * 递归获取所有文件
 * @param dir
 * @param condition
 * @returns
 */
export const getRecursiveDirFiles = (
  dir: string,
  condition: (func: Dirent) => boolean = item => resReg.test(item.name)
): {
  path: string
  name: string
}[] => {
  //
  let results: {
    path: string
    name: string
  }[] = []
  if (!existsSync(dir)) return results
  const list = readdirSync(dir, { withFileTypes: true })
  list.forEach(item => {
    const fullPath = join(dir, item.name)
    if (item.isDirectory()) {
      results = results.concat(getRecursiveDirFiles(fullPath, condition))
    } else if (item.isFile() && condition(item)) {
      results.push({
        path: fullPath,
        name: item.name
      })
    }
  })
  return results
}

/**
 * 解析错误并提示缺失的模块
 * @param e
 * @returns
 */
export const showErrorModule = (e: Error) => {
  if (!e) return
  const moduleNotFoundRegex = /Cannot find (module|package)/
  // 处理模块未找到的错误
  if (moduleNotFoundRegex.test(e?.message)) {
    logger.error({
      code: ResultCode.FailInternal,
      message: e.message,
      data: null
    })
    const match = e.stack?.match(/'(.+?)'/)
    if (match) {
      const pack = match[1]
      logger.error(`缺少模块或依赖 ${pack},请安装`)
    } else {
      logger.mark('无法提取缺失的信息，请检查')
    }
  } else {
    // 处理其他错误
    logger.error({
      code: ResultCode.FailInternal,
      message: e?.message ?? e,
      data: null
    })
  }
}

/**
 * 废弃，请使用 showErrorModule
 * @deprecated
 */
export const ErrorModule = showErrorModule

const createExports = (packageJson: any) => {
  if (packageJson?.exports) {
    if (typeof packageJson.exports === 'string') {
      return packageJson.exports
    } else if (typeof packageJson.exports === 'object') {
      return packageJson.exports['.'] || packageJson.exports['./index.js']
    }
  }
}

export const getInputExportPath = (input?: string) => {
  const packageJsonPath = path.join(input ?? process.cwd(), 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = require(packageJsonPath)
    const main = packageJson?.main || createExports(packageJson)
    if (main) {
      return main
    }
  }
}

/**
 * 属于直接调用的函数
 * 参数错误直接抛出错误
 * 如果函数内部有错误，则使用 Result 进行返回
 */

/**
 * 异步方法。且需要读取返回值的进行判断的，
 * 都要以 Result 作为返回值
 */
export type Result = {
  code: ResultCode
  message: string | Object
  data: any
}

/**
 * 创建结果
 * @param code
 * @param message
 * @returns
 */
export const createResult = (code: ResultCode, message: string | Object, data?: any): Result => {
  // 如果不是 2000。则logger
  if (code !== ResultCode.Ok) {
    logger.error({
      code,
      message,
      data: data
    })
  }
  return {
    code,
    message,
    data: data
  }
}

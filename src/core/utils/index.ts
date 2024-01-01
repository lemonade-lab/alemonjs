import { existsSync, createReadStream } from 'fs'
import { Readable, isReadable } from 'stream'
import { basename } from 'path'
import { fileTypeFromBuffer, fileTypeFromStream } from 'file-type'
export * from './buffer.js'
export * from './ip.js'
export * from './screenshot.js'
export * from './puppeteer.js'
class Utils {
  /**
   * 字符串数组转正则
   * [''] => /^$/
   * ['abc'] => /^abc$/
   * ['a','b','c'] => /^(a|b|c)$/
   * @param APP
   * @returns
   */
  arrayToRule(APP: string[]) {
    return APP.length == 0 ? /^$/ : new RegExp(APP.join('|'))
  }
}
export const UTILS = new Utils()
/**
 * 字符串数组转正则
 * [''] => /^$/
 * ['abc'] => /^abc$/
 * ['a','b','c'] => /^(a|b|c)$/
 * @param APP
   @deprecated 已废弃
 * @returns
 */
export const arrayToRule = UTILS.arrayToRule

/**
 * 创建form
 * @param image
 * @param name
 * @returns
 */
export async function createPicFrom(image: any, name = 'image.jpg') {
  let picData: Readable | Buffer[]
  // 是 string
  if (typeof image === 'string') {
    if (!existsSync(image)) return false
    if (!name) name = basename(image)
    picData = createReadStream(image)
    // 是 buffer
  } else if (Buffer.isBuffer(image)) {
    if (!name) name = 'file.' + (await fileTypeFromBuffer(image)).ext
    picData = new Readable()
    picData.push(image)
    picData.push(null)
    // 是 文件流
  } else if (isReadable(image)) {
    if (!name) name = 'file.' + (await fileTypeFromStream(image)).ext
    picData = image
  } else {
    return false
  }
  return { picData, image, name }
}

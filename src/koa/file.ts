import { join } from 'path'
import { writeFileSync, readdirSync, unlinkSync, existsSync } from 'fs'
import { fileTypeFromBuffer } from 'file-type'
import { getServerConfig } from './config.js'
import { getPublicIP } from '../core/index.js'
import { createHash } from 'crypto'

/**
 * 得到本地文件请求地址
 * @param address
 * @returns
 */
export async function getLocalFileUrl(address: string) {
  // 检查文件是否存在
  let filePath: string
  if (existsSync(address)) {
    filePath = address
  } else {
    filePath = join(process.cwd(), address)
  }
  if (!existsSync(filePath)) return false
  const addressRouter = getServerConfig('addressRouter')
  const port = getServerConfig('port')
  const http = getServerConfig('http')
  let ip = getServerConfig('ip')
  if (ip == 'localhost') {
    const ipp = await getPublicIP()
    if (ipp) ip = ipp
  }
  const url = `${http}://${ip}:${port}${addressRouter}?address=${address}`
  console.info('server url', url)
  return url
}

/**
 * 存储文件并得到请求地址
 * @param file
 * @param name
 * @returns
 */
export async function getFileUrl(file: Buffer, name?: string) {
  if (!Buffer.isBuffer(file)) return false
  const fileDir = getServerConfig('fileDir')
  const fileRouter = getServerConfig('fileRouter')
  const port = getServerConfig('port')
  const http = getServerConfig('http')
  let ip = getServerConfig('ip')
  if (ip == 'localhost') {
    const ipp = await getPublicIP()
    if (ipp) ip = ipp
  }
  // 使用 'bin' 作为默认扩展名
  const extension = (await fileTypeFromBuffer(file))?.ext ?? name ?? 'bin'
  const md5Hash = createHash('md5').update(file).digest('hex')
  const filename = `${md5Hash}.${extension}`
  const filePath = join(process.cwd(), fileDir, filename)
  console.info('server create', filePath)
  // 保存文件到文件系统
  writeFileSync(filePath, file)
  const url = `${http}://${ip}:${port}${fileRouter}/${filename}`
  console.info('setLocalFile url', url)
  return url
}

/**
 *
 * 自动清除机制
 * 清除挂载下的所有文件
 * @param options
 */
export function autoClearFiles(options?: { time?: number; dir?: string }) {
  const fileDir = options?.dir ?? getServerConfig('fileDir')
  setInterval(() => {
    const files = readdirSync(join(process.cwd(), fileDir))
    for (const file of files) {
      unlinkSync(join(process.cwd(), fileDir, file))
    }
  }, options?.time ?? 300000)
}

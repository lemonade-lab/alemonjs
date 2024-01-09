import { join } from 'path'
import { writeFileSync, readdirSync, unlinkSync, existsSync } from 'fs'
import { fileTypeFromBuffer } from 'file-type'
import { config } from './config.js'
import { IP } from '../core/index.js'
import { createHash } from 'crypto'

class ClientKoa {
  /**
   * 得到本地文件请求地址
   * @param address
   * @returns
   */
  async getLocalFileUrl(address: string) {
    // 检查文件是否存在
    let filePath: string
    if (existsSync(address)) {
      filePath = address
    } else {
      filePath = join(process.cwd(), address)
    }
    if (!existsSync(filePath)) return false
    const addressRouter = config.get('addressRouter')
    const port = config.get('port')
    const http = config.get('http')
    let ip = config.get('ip')
    if (ip == 'localhost') {
      const ipp = await IP.get()
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
  async getFileUrl(file: Buffer, name?: string) {
    if (!Buffer.isBuffer(file)) return false
    const fileDir = config.get('fileDir')
    const fileRouter = config.get('fileRouter')
    const port = config.get('port')
    const http = config.get('http')
    let ip = config.get('ip')
    if (ip == 'localhost') {
      const ipp = await IP.get()
      if (ipp) ip = ipp
    }
    // 使用 'bin' 作为默认扩展名
    const extension = (await fileTypeFromBuffer(file))?.ext ?? name ?? 'bin'
    const md5Hash = createHash('md5').update(file).digest('hex')
    const filename = `${md5Hash}.${extension}`
    const filePath = join(process.cwd(), fileDir, filename)
    if (!existsSync(filePath)) {
      // 保存文件到文件系统
      // 仅有该文件不存在的时候才写入
      console.info('server create', filePath)
      writeFileSync(filePath, file)
    }
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
  autoClearFiles(options?: { time?: number; dir?: string }) {
    const fileDir = options?.dir ?? config.get('fileDir')
    setInterval(() => {
      const files = readdirSync(join(process.cwd(), fileDir))
      for (const file of files) {
        unlinkSync(join(process.cwd(), fileDir, file))
      }
    }, options?.time ?? 300000)
  }
}

export const ClientKOA = new ClientKoa()

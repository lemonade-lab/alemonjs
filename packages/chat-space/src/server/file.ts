import { join } from 'path'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { fileTypeFromBuffer } from 'file-type'
import { FileConfig } from './config.js'
import { IP } from '../core/utils.js'
import { createHash } from 'node:crypto'
import { KoaServer } from './client.js'
export class FilesServer extends KoaServer {
  constructor() {
    super()

    this.#ip = new IP()
  }

  #ip = null

  #size = 0
  /**
   * 得到本地文件请求地址
   * @param address
   * @returns
   */
  async getLocalFileUrl(address: string) {
    /**
     * 检查服务器是否启动
     */
    if (!this.static && this.#size <= 3) {
      this.#size++
      // 尝试启动
      this.connect()
    }
    // 检查文件是否存在
    let filePath: string
    if (existsSync(address)) {
      filePath = address
    } else {
      filePath = join(process.cwd(), address)
    }
    if (!existsSync(filePath)) return false
    const addressRouter = FileConfig.get('addressRouter')
    const base = await this.#getBaseUrl()
    const url = `${base}${addressRouter}?address=${address}`
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
    const fileDir = FileConfig.get('fileDir')
    /**
     * 检查服务器是否启动
     */
    if (!this.static && this.#size <= 3) {
      this.#size++
      // 尝试启动
      this.connect()
      // 确保文件存在
      mkdirSync(join(process.cwd(), fileDir), {
        recursive: true
      })
    }
    const fileRouter = FileConfig.get('fileRouter')
    // 使用 'bin' 作为默认扩展名
    const extension = (await fileTypeFromBuffer(file))?.ext ?? name ?? 'bin'
    const md5Hash = createHash('md5').update(file).digest('hex')
    const filename = `${md5Hash}.${extension}`
    const filePath = join(process.cwd(), fileDir, filename)
    if (!existsSync(filePath)) {
      // 保存文件到文件系统
      console.info('server create', filePath)
      writeFileSync(filePath, file)
    }
    const base = await this.#getBaseUrl()
    const url = `${base}${fileRouter}/${filename}`
    console.info('setLocalFile url', url)
    return url
  }

  /**
   *
   * @returns
   */
  async #getBaseUrl() {
    const port = FileConfig.get('port')
    const http = FileConfig.get('http')
    const ip = await this.#getIp()
    return `${http}://${ip}:${port}`
  }

  /**
   *
   * @returns
   */
  async #getIp() {
    let ip = FileConfig.get('ip')
    if (ip == 'localhost') {
      const ipp = await this.#ip.get()
      if (ipp) ip = ipp
    }
    return ip
  }
}

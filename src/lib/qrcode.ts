import { toDataURL } from 'qrcode'
import { writeFile, readFile } from 'fs'

/**
 * 链接转化为二维码
 * @param text 链接
 * @param localpath 可选,要保存的路径
 * @param name 可选,若写路径则必选,定义：文件名.bin
 * @returns
 */
export async function createQrcode(text: string, localpath?: string, name?: string) {
  try {
    const qrDataURL = await new Promise<string>((resolve, reject) => {
      toDataURL(
        text,
        {
          margin: 2,
          width: 500
        },
        (err: any, qrDataURL: any) => {
          if (err) {
            console.error(err)
            reject(err)
          } else {
            resolve(qrDataURL)
          }
        }
      )
    })
    const bufferData = Buffer.from(qrDataURL.split(',')[1], 'base64')
    if (localpath != undefined) {
      setBuffer(localpath, name, bufferData)
    }
    return bufferData
  } catch (err) {
    console.error(err)
    return false
  }
}

/**
 * 读取buffer文件
 * @param localpath  读取地址
 * @param name 文件名.bin
 * @returns
 */
export const getBuffer = (localpath: string, name: string): Promise<Buffer> => {
  const dir = `${localpath}/${name}.bin`
  return new Promise((resolve, reject) => {
    readFile(dir, (err: NodeJS.ErrnoException | null, bufferData: Buffer) => {
      if (err) {
        reject(err)
      } else {
        console.log('[BUFFER][READ]', dir)
        resolve(bufferData)
      }
    })
  })
}

/**
 * 写入buffer
 * @param localpath 写入的路径
 * @param name  保存名
 * @param bufferData 数据
 */
export const setBuffer = (localpath: string, name: string, bufferData: Buffer) => {
  const dir = `${localpath}/${name}.bin`
  writeFile(dir, bufferData, (err: NodeJS.ErrnoException | null) => {
    if (err) throw err
    console.log('[BUFFER][SET]', dir)
  })
}

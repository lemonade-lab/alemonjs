import { toDataURL } from 'qrcode'
import { writeFile, readFile } from 'fs'

/**
 * 链接转化为二维码
 * @param text 链接
 * @param localpath 可选,要保存的路径
 * @returns buffer
 */
export async function createQrcode(
  text: string,
  localpath?: string
): Promise<false | Buffer> {
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
      setBuffer(localpath, bufferData)
    }
    return bufferData
  } catch (err) {
    console.error(err)
    return false
  }
}

/**
 * 读取buffer文件
 * @param localpath 读取地址
 * @returns buffer
 */
export const getBuffer = (localpath: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    readFile(
      localpath,
      (err: NodeJS.ErrnoException | null, bufferData: Buffer) => {
        if (err) {
          reject(err)
        } else {
          console.info('buffer read', localpath)
          resolve(bufferData)
        }
      }
    )
  })
}

/**
 * 写入buffer
 * @param localpath 写入地址
 * @param bufferData 数据
 */
export const setBuffer = (localpath: string, bufferData: Buffer) => {
  writeFile(localpath, bufferData, (err: NodeJS.ErrnoException | null) => {
    if (err) throw err
    console.info('buffer set', localpath)
  })
  return
}

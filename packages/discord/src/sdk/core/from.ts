import { existsSync, createReadStream } from 'fs'
import { Readable, isReadable } from 'stream'
import { basename } from 'path'
import { fileTypeFromBuffer, fileTypeFromStream } from 'file-type'
/**
 * 创建form
 * @param image
 * @param name
 * @returns
 */
export async function createPicFrom(image: string | Buffer | Readable, name = 'image.jpg') {
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
    if (!name) name = 'file.' + (await fileTypeFromStream(image as any)).ext
    picData = image
  } else {
    return false
  }
  return { picData, image, name }
}

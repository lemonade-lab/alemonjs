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
export async function createPicFrom(image: any, name = 'image.jpg') {
  let picData: Readable | Buffer[]
  // 是 string
  if (typeof image === 'string') {
    if (!existsSync(image)) return false
    if (!name) name = basename(image)
    picData = createReadStream(image)
    // 是 buffer
  } else if (Buffer.isBuffer(image)) {
    const { ext } = await fileTypeFromBuffer(image)
    if (!name) name = 'file.' + ext
    picData = new Readable()
    picData.push(image)
    picData.push(null)
    // 是 文件流
  } else if (isReadable(image)) {
    const { ext } = await fileTypeFromStream(image)
    if (!name) name = 'file.' + ext
    picData = image
  } else {
    return false
  }
  return { picData, image, name }
}

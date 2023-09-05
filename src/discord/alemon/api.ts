import { existsSync, createReadStream } from 'fs'
import { Readable, isReadable } from 'stream'
import { basename } from 'path'
import { fileTypeFromBuffer, fileTypeFromStream } from 'file-type'
import { AttachmentBuilder } from 'discord.js'
/**
 * 发送资源
 * @param file
 * @param name
 * @returns
 */
export async function postImage(file: string | Buffer | Readable, name = 'image.jpg') {
  let picData: Readable | Buffer[]
  if (typeof file === 'string') {
    if (!existsSync(file)) {
      return false
    }
    if (!name) {
      name = basename(file)
    }
    picData = createReadStream(file)
  } else if (Buffer.isBuffer(file)) {
    if (!name) {
      name = 'file.' + (await fileTypeFromBuffer(file)).ext
    }
    picData = new Readable()
    picData.push(file)
    picData.push(null)
  } else if (isReadable(file)) {
    if (!name) {
      name = 'file.' + (await fileTypeFromStream(file)).ext
    }
    picData = file
  } else {
    return false
  }
  const attach = new AttachmentBuilder(picData, {
    name
  })
  return attach
}

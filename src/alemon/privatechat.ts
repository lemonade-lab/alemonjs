import { postImage, MsgType } from 'alemon'
/**
 * 公信转私信
 * @param m
 * @param msg
 * @param obj
 * @returns
 */
export const Private = async (
  m: MsgType,
  msg?: string | object | Array<string> | Buffer,
  obj?: object | Buffer
): Promise<boolean> => {
  const postSessionRes: any = await client.directMessageApi
    .createDirectMessage({
      source_guild_id: m.guild_id,
      recipient_id: m.author.id
    })
    .catch((err: any) => {
      console.error(err)
      return false
    })

  if (!postSessionRes) return false

  const {
    data: { guild_id }
  } = postSessionRes

  if (!guild_id) return false
  /**
   * 消息机制
   */
  if (Buffer.isBuffer(msg)) {
    try {
      //tudo
      return await postImage(
        m.guild_id,
        {
          msg_id: m.id, //消息id, 必须
          file_image: msg, //buffer
          content: ''
        },
        true
      )
        .then(() => true)
        .catch((err: any) => {
          console.error(err)
          return false
        })
    } catch (err) {
      console.error(err)
      return false
    }
  }
  const content = Array.isArray(msg) ? msg.join('') : typeof msg === 'string' ? msg : undefined
  const options = typeof msg === 'object' && !obj ? msg : obj
  if (Buffer.isBuffer(obj)) {
    try {
      //tudo
      return await postImage(
        m.guild_id,
        {
          msg_id: m.id, //消息id, 必须
          file_image: obj, //buffer
          content
        },
        true
      )
        .then(() => true)
        .catch((err: any) => {
          console.error(err)
          return false
        })
    } catch (err) {
      console.error(err)
      return false
    }
  }
  return await client.directMessageApi
    .postDirectMessage(guild_id, {
      msg_id: m.id,
      content,
      ...options
    })
    .then(() => true)
    .catch(err => {
      console.error('出错啦', err)
      return false
    })
}

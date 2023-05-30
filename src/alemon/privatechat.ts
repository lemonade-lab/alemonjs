import { MsgType } from 'alemon'
export const replyPrivate = async (
  m: MsgType,
  msg?: string | object | Array<string>,
  obj?: object
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

  const content = Array.isArray(msg) ? msg.join('') : typeof msg === 'string' ? msg : undefined
  const options = typeof msg === 'object' && !obj ? msg : obj
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

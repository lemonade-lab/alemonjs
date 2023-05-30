import { Messagetype } from 'alemon'
export const replyPrivate = async (
  e: Messagetype,
  msg?: string | object | Array<string>,
  obj?: object
): Promise<boolean> => {
  if (e.isGroup) return false

  const postSessionRes: any = await client.directMessageApi
    .createDirectMessage({
      source_guild_id: e.msg.guild_id,
      recipient_id: e.msg.author.id
    })
    .catch((err: any) => {
      e.reply('失败啦~')
      console.error(err)
    })

  if (!postSessionRes) {
    e.reply('该机器人没有权限哦~')
    return false
  }

  const {
    data: { guild_id }
  } = postSessionRes

  if (!guild_id) {
    e.reply('出错啦~')
    return false
  }

  const content = Array.isArray(msg) ? msg.join('') : typeof msg === 'string' ? msg : undefined
  const options = typeof msg === 'object' && !obj ? msg : obj
  return await client.directMessageApi
    .postDirectMessage(guild_id, {
      msg_id: e.msg.id,
      content,
      ...options
    })
    .then(() => true)
    .catch(err => {
      e.reply('出错啦~')
      console.error(err)
      return false
    })
}

import { useMention } from 'alemonjs'
export const selects = onSelects(['message.create'])
export const regular = /^(#|\/)?mentions$/
export default onResponse(selects, async event => {
  const [mention] = useMention(event)

  // logger.info('useMention:', mention)

  // 查找用户类型的 @ 提及，且不是 bot
  const user = await mention.findOne({ IsBot: false })

  logger.info('User:', user)

  if (!user) {
    return // 未找到用户Id
  }

  // 处理被AT的用户...
})

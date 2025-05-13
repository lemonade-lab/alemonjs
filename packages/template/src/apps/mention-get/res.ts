import { useMention } from 'alemonjs'
export const regular = /^(#|\/)?getmention$/
const selects = onSelects([
  'message.create',
  'private.message.create',
  'interaction.create',
  'private.interaction.create'
])

export default onResponse(selects, async event => {
  const [mention] = useMention(event)
  // 查找用户类型的 @ 提及，且不是 bot
  const res = await mention.findOne()
  if (res.code !== 2000 || !res.data) {
    return // 未找到用户Id
  }

  console.log('User:', res.data)

  // 处理被AT的用户...
})

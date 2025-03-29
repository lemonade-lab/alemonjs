import { useMention, createSelects } from 'alemonjs'
export const regular = /^(#|\/)?getmention$/
const selects = createSelects(['message.create', 'private.message.create'])
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

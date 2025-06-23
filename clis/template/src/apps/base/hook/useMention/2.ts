import { Text } from 'alemonjs'
export const selects = onSelects(['message.create'])
export default onResponse(selects, () => {
  return {
    // 即将要发送的数据
    data: format(Text('hello word !'))
  }
})

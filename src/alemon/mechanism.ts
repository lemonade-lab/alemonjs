import { getMember, getRoom } from './alemonapi.js'
/**
 * 字符串解析器
 * @param msg 消息
 * @param villa_id 别墅
 * @returns
 */
export async function stringParsing(msg: string | object | string[], villa_id: number) {
  /** 增加渲染  */
  const entities = []
  // 判断 msg 是否是  arr  是就转换
  let content = Array.isArray(msg) ? msg.join('') : typeof msg === 'string' ? msg : ''
  // 字符转换并增加渲染
  const everyoneMention = '<@!everyone>'
  const everyoneIndex = content.indexOf(everyoneMention)
  if (everyoneIndex !== -1) {
    content = content.replace(everyoneMention, '@全体成员 ')
    entities.push({
      entity: {
        type: 'mention_all'
      },
      length: 6,
      offset: everyoneIndex
    })
  }
  /** 搜索并收集 */
  const RoomArr = []
  /* 收集房间 ID 和起始位置 */
  content.replace(/<#(\d+)>/g, (match, id, offset) => {
    RoomArr.push({ id, offset })
    return match
  })
  /* 字符替换 */
  for await (const item of RoomArr) {
    const Room = await getRoom(villa_id, item.id)
    if (Room) {
      content = content.replace(new RegExp(`<#${item.id}>`), (match, id, index) => {
        entities.push({
          entity: {
            // 房间标签，点击会跳转到指定房间（仅支持跳转本大别野的房间）
            type: 'villa_room_link',
            villa_id: String(villa_id), // 大别野 id
            room_id: item.id // 房间 id
          },
          length: `#${Room.room_name} `.length, // 长度可以算
          offset: item.offset // 使用起始位置作为偏移量
        })
        return `#${Room.room_name} `
      })
    }
  }
  /** 搜索并收集 */
  const UserArr = []
  /* 收集用户 ID 和起始位置 */
  content.replace(/<@!(\d+)>/g, (match, id, offset) => {
    UserArr.push({ id, offset })
    return match
  })
  /* 字符替换 */
  for await (const item of UserArr) {
    const User = await getMember(villa_id, item.id)
    if (User) {
      content = content.replace(new RegExp(`<@!${item.id}>`), (match, id, index) => {
        entities.push({
          entity: {
            type: 'mentioned_user', // 提及成员
            user_id: item.id // 成员id
          },
          length: `@${User.basic.nickname} `.length, // 字符占用长度
          offset: item.offset // 使用起始位置作为偏移量
        })
        return `@${User.basic.nickname} `
      })
    }
  }

  console.log('entities=', entities)
  console.log('content=', content)
  return {
    entities,
    content
  }
}

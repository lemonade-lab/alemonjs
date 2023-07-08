import { getMember, getRoom } from './alemonapi.js'
/**
 * 字符串解析器
 * @param msg 消息
 * @param villa_id 别墅
 * @returns
 */
export async function stringParsing(msg: string | object | string[], villa_id: number) {
  // 判断 msg 是否是  arr  是就转换
  let content = Array.isArray(msg) ? msg.join('') : typeof msg === 'string' ? msg : ''
  // 记录
  const num = []
  // 替换全体
  content = content.replace(/<@!(everyone)>/g, (match, id, offset) => {
    // 记录要渲染的名称和编号
    num.push({
      id,
      type: 0,
      name: '@全体成员 '
    })
    return '@全体成员 '
  })
  // 用户
  const userArr = []
  content.replace(/<@!(\d+)>/g, (match, id, offset) => {
    userArr.push({
      id,
      offset
    })
    return match
  })
  for (const item of userArr) {
    const User = await getMember(villa_id, String(item.id))
    if (User) {
      content = content.replace(new RegExp(`<@!${item.id}>`), (match, id, index) => {
        // 记录要渲染的名称和编号
        num.push({
          id: item.id,
          type: 1,
          name: `@${User.basic.nickname} `
        })
        return `@${User.basic.nickname} `
      })
    }
  }
  // 房间
  const roomArr = []
  content.replace(/<#(\d+)>/g, (match, id, offset) => {
    roomArr.push({
      id,
      offset
    })
    return match
  })
  for (const item of roomArr) {
    const Room = await getRoom(villa_id, item.id)
    if (Room) {
      content = content.replace(new RegExp(`<#${item.id}>`), (match, id, index) => {
        // 记录要渲染的名称和编号
        num.push({
          id: item.id,
          type: 2,
          name: `#${Room.room_name} `
        })
        return `#${Room.room_name} `
      })
    }
  }
  /** 增加渲染  */
  const entities = []
  for (const item of num) {
    // 构造正则
    let match = new RegExp(item.name).exec(content)
    if (match !== null) {
      let offset = match.index
      if (item.type === 0) {
        entities.push({
          entity: {
            type: 'mention_all'
          },
          length: 6,
          offset
        })
      } else if (item.type === 1) {
        entities.push({
          entity: {
            type: 'mentioned_user',
            user_id: item.id
          },
          length: item.name.length,
          offset
        })
      } else if (item.type === 2) {
        entities.push({
          entity: {
            type: 'villa_room_link',
            villa_id: String(villa_id),
            room_id: item.id
          },
          length: item.name.length,
          offset
        })
      }
    }
  }
  console.log('entities=', entities)
  return {
    entities,
    content
  }
}

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

  // 记录个数
  let oneSize = 0
  content.replace(/(<@!everyone>)/g, (match, id, offset) => {
    // 记录匹配个数
    oneSize++
    return match
  })
  for (let i = 0; i < oneSize; i++) {
    // 一次就更改一次,并重新匹配
    content = content.replace(/(<@!everyone>)/, (match, id, offset) => {
      entities.push({
        entity: {
          type: 'mention_all'
        },
        length: 6,
        offset: offset
      })
      return '@全体成员 '
    })
  }

  // 记录个数
  let RoomSize = 0
  content.replace(/<#(\d+)>/g, (match, id, offset) => {
    // 记录匹配个数
    RoomSize++
    return match
  })
  for (let i = 0; i < RoomSize; i++) {
    // 一次就更改一次,并重新匹配
    const obj = { id: 0, offset: 0 }
    content.replace(/<#(\d+)>/, (match, id, offset) => {
      obj.id = id
      obj.offset = offset
      return match
    })
    const Room = await getRoom(villa_id, obj.id)
    if (Room) {
      content = content.replace(new RegExp(`<#${obj.id}>`), (match, id, index) => {
        entities.push({
          entity: {
            type: 'villa_room_link',
            villa_id: String(villa_id), // 大别野 id
            room_id: obj.id // 房间 id
          },
          length: `#${Room.room_name} `.length, // 长度可以算
          offset: obj.offset // 使用起始位置作为偏移量
        })
        return `#${Room.room_name} `
      })
    } else {
      // 发现错误的房间,后续不再进行
      break
    }
  }

  let UserSize = 0
  content.replace(/<#(\d+)>/g, (match, id, offset) => {
    // 记录匹配个数
    UserSize++
    return match
  })
  for (let i = 0; i < UserSize; i++) {
    // 一次就更改一次,并重新匹配
    const obj = { id: '', offset: 0 }
    content.replace(/<#(\d+)>/, (match, id, offset) => {
      obj.id = id
      obj.offset = offset
      return match
    })
    const User = await getMember(villa_id, obj.id)
    if (User) {
      content = content.replace(new RegExp(`<#${obj.id}>`), (match, id, index) => {
        entities.push({
          entity: {
            type: 'villa_room_link',
            villa_id: String(villa_id), // 大别野 id
            room_id: obj.id // 房间 id
          },
          length: `@${User.basic.nickname} `.length, // 字符占用长度
          offset: obj.offset // 使用起始位置作为偏移量
        })
        return `@${User.basic.nickname} `
      })
    } else {
      // 发现错误的房间,后续不再进行
      break
    }
  }

  console.log('entities=', entities)
  console.log('content=', content)
  return {
    entities,
    content
  }
}

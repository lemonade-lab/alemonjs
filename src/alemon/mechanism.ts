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
  const userKeyVal = {}
  function setUserName(user_id, user_name) {
    content = content.replace(new RegExp(`<@!${user_id}>`), (match, id, index) => {
      // 记录要渲染的名称和编号
      num.push({
        id: user_id,
        type: 1,
        name: `#${user_name} `
      })
      userKeyVal[user_id] = user_name
      return `#${user_name} `
    })
  }
  for (const item of userArr) {
    if (userKeyVal[item.id]) {
      setUserName(item.id, userKeyVal[item.id])
      continue
    }
    const User = await getMember(villa_id, String(item.id))
    if (User) {
      setUserName(item.id, User.basic.nickname)
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
  const roomKeyVal = {}
  function setRoomName(room_id, room_name) {
    content = content.replace(new RegExp(`<#${room_id}>`), (match, id, index) => {
      // 记录要渲染的名称和编号
      num.push({
        id: room_id,
        type: 2,
        name: `#${room_name} `
      })
      roomKeyVal[room_id] = room_name
      return `#${room_name} `
    })
  }
  for (const item of roomArr) {
    // 存在的key
    if (roomKeyVal[item.id]) {
      setRoomName(item.id, roomKeyVal[item.id])
      continue
    }
    const Room = await getRoom(villa_id, item.id)
    if (Room) {
      setRoomName(item.id, Room.room_name)
      continue
    }
  }
  /** 增加渲染  */
  const entities = []
  const matchedNames = {}
  for (const item of num) {
    // 如果该名称已经匹配过，则跳过
    if (matchedNames[item.name]) {
      continue
    }
    matchedNames[item.name] = true
    // 构造正则
    const regex = new RegExp(item.name, 'g')
    let match
    while ((match = regex.exec(content)) !== null) {
      const offset = match.index
      switch (item.type) {
        case 0: {
          entities.push({
            entity: {
              type: 'mention_all'
            },
            length: 6,
            offset
          })
          break
        }
        case 1: {
          entities.push({
            entity: {
              type: 'mentioned_user',
              user_id: item.id
            },
            length: item.name.length,
            offset
          })
          break
        }
        case 2: {
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
  }
  console.log('entities=', entities)
  return {
    entities,
    content
  }
}

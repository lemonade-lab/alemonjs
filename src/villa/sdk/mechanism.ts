import { getMember, getRoom } from './api.js'
import { type EntitiesType } from './types.js'
/**
 * 字符串解析器
 * @param msg 消息
 * @param villa_id 别墅
 * @returns
 */
export async function stringParsing(msg: string | string[], villa_id: number) {
  /**
   * 把string[]更改为string
   */
  let content = Array.isArray(msg)
    ? msg.join('')
    : typeof msg === 'string'
    ? msg
    : ''
  /**
   * 记录所有要渲染的
   */
  const num: any[] = []
  /**
   * 开始识别 @ 全体 并替换
   */
  content = content.replace(/<@(everyone)>/g, (match, id, offset) => {
    /**
     * 记录要渲染的名称和编号
     */
    num.push({
      id, // 得到id
      type: 0, // 得到类型
      name: '@全体成员 ' // 得到描述字
    })
    /**
     * 替换字样
     */
    return '@全体成员 '
  })

  /**
   * 识别外链
   */
  content = content.replace(/\[(.*?)\]\((.*?)\)/g, (match, id, url, offset) => {
    num.push({
      id,
      type: 3,
      url,
      name: `${id} `
    })
    return `${id} `
  })

  /**
   * 识别[sfa](sagagga) 并替换为  sfa
   */

  /**
   * 开始识别 用户
   */
  const userArr: any[] = []
  /**
   * 知道艾特的位置
   */
  content.replace(/<@(\d+)>/g, (match, id, offset) => {
    userArr.push({
      id,
      offset
    })
    return match
  })
  /**
   * 正则匹配到
   */
  const userKeyVal = {}
  /**
   * 替换用户名
   * @param user_id
   * @param user_name
   */
  function setUserName(user_id, user_name) {
    /**
     * 替换字
     */
    content = content.replace(
      new RegExp(`<@${user_id}>`),
      (match, id, index) => {
        /**
         * 记录要渲染的名称和编号
         */
        num.push({
          id: user_id,
          type: 1,
          name: `@${user_name} `
        })
        /**
         * 记录
         */
        userKeyVal[user_id] = user_name
        /**
         * 替换为名字
         */
        return `@${user_name} `
      }
    )
  }
  /**
   *
   */
  for (const item of userArr) {
    /**
     * 存在
     */
    if (userKeyVal[item.id]) {
      setUserName(item.id, userKeyVal[item.id])
      continue
    }
    /**
     * 得到用户名
     */
    const User = await getMember(villa_id, String(item.id))
    if (User) {
      setUserName(item.id, User?.data?.menber?.basic?.nickname)
    }
  }
  /**
   * 房间
   */
  const roomArr: any[] = []
  /**
   *
   */
  content.replace(/<#(\d+)>/g, (match, id, offset) => {
    /**
     *
     */
    roomArr.push({
      id,
      offset
    })
    /**
     *
     */
    return match
  })
  const roomKeyVal = {}
  /**
   * 替换房间名
   * @param room_id
   * @param room_name
   */
  function setRoomName(room_id, room_name) {
    content = content.replace(
      new RegExp(`<#${room_id}>`),
      (match, id, index) => {
        /**
         * 记录要渲染的名称和编号
         */
        num.push({
          id: room_id,
          type: 2,
          name: `#${room_name} `
        })
        roomKeyVal[room_id] = room_name
        return `#${room_name} `
      }
    )
  }
  /**
   *
   */
  for (const item of roomArr) {
    /**
     * 存在的key
     */
    if (roomKeyVal[item.id]) {
      setRoomName(item.id, roomKeyVal[item.id])
      continue
    }
    /**
     * 得到房间名
     */
    const Room = await getRoom(villa_id, item.id)
    if (Room) {
      setRoomName(item.id, Room.data.room.room_name)
      continue
    }
  }
  /**
   * 增加渲染
   */
  const entities: EntitiesType[] = []
  const matchedNames = {}
  for (const item of num) {
    /**
     * 如果该名称已经匹配过，则跳过
     */
    if (matchedNames[item.name]) {
      continue
    }
    matchedNames[item.name] = true
    /**
     * 构造正则
     */
    const regex = new RegExp(item.name, 'g')
    let match

    while ((match = regex.exec(content)) !== null) {
      const offset = match.index
      switch (item.type) {
        case 0: {
          entities.push({
            entity: {
              type: 'mentioned_all'
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
              room_id: item.id // 内容
            },
            length: item.name.length, // 长度
            offset
          })
          break
        }
        case 3: {
          entities.push({
            entity: {
              type: 'link', // 类型
              requires_bot_access_token: true, // 携带
              url: item.url ?? 'https://alemonjs.com' // 内容
            },
            length: item.name.length, // 长度
            offset
          })
          break
        }
        default: {
          break
        }
      }
    }
  }
  return {
    entities,
    content
  }
}

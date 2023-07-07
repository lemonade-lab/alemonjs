import { Messagetype, EventType, EType, InstructionMatching } from 'alemon'
import { sendMessage } from '../alemonapi.js'
import { BotEvent, MessageContentType, MHYType } from '../types.js'
import { createCOS } from '../cos.js'
import { getMember, getRoom } from '../alemonapi.js'

/**
 * 字符解析器
 */

export async function sendMessageText(villa_id, room_id, text) {
  return await sendMessage(villa_id, {
    room_id, //房间号
    object_name: MHYType.Text, // 消息类型
    msg_content: JSON.stringify({
      content: {
        // 消息文本   支持  [爱心] 来转换成表情
        text
      }
    }) // 要回复的消息
  }).catch(err => {
    console.log(err)
    return false
  })
}

export async function sendMessageTextEntities(villa_id, room_id, text, entities) {
  return await sendMessage(villa_id, {
    room_id, //房间号
    object_name: MHYType.Text, // 消息类型
    msg_content: JSON.stringify({
      content: {
        // 消息文本   支持  [爱心] 来转换成表情
        text,
        entities
      }
    }) // 要回复的消息
  }).catch(err => {
    console.log(err)
    return false
  })
}

export async function sendMessageTextUrl(villa_id, room_id, text, url) {
  return await sendMessage(villa_id, {
    room_id, //房间号
    object_name: MHYType.Text, // 消息类型
    msg_content: JSON.stringify({
      content: {
        // 消息文本   支持  [爱心] 来转换成表情
        text,
        images: [
          {
            url,
            with: '1080',
            height: '2200'
          }
        ]
      }
    }) // 要回复的消息
  }).catch(err => {
    console.log(err)
    return false
  })
}

export async function sendMessageTextEntitiesUrl(villa_id, room_id, text, entities, url) {
  return await sendMessage(villa_id, {
    room_id, //房间号
    object_name: MHYType.Text, // 消息类型
    msg_content: JSON.stringify({
      content: {
        // 消息文本   支持  [爱心] 来转换成表情
        text,
        entities,
        images: [
          {
            url,
            with: '1080',
            height: '2200'
          }
        ]
      }
    }) // 要回复的消息
  }).catch(err => {
    console.log(err)
    return false
  })
}

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

/**
 * 消息会话
 * @param event 回调数据
 * @param val  类型控制
 */
export async function MESSAGES(event: BotEvent, val: number) {
  console.log('MESSAGES=', event) // 消息类型
  console.log('MESSAGES=', event.robot.template) // 机器人信息
  console.log('MESSAGES=data=', event.extend_data.EventData) // 数据监听
  /**  数据包 */
  const MessageContent: MessageContentType = JSON.parse(
    event.extend_data.EventData.SendMessage.content
  )
  console.log('MessageContent=', MessageContent) // 数据监听
  console.log('entities=', MessageContent.content.entities) // 数据监听
  // 别野编号
  const villa_id = event.robot.villa_id
  // 房间号
  const room_id = event.extend_data.EventData.SendMessage.room_id
  /** 指令消息需要去除 @ 和用户名 */
  const cmd_msg = MessageContent.content.text.replace(/(@[^\s]+\s)(?!<)/g, '').trim()
  // 上传图片
  const COS = createCOS()
  /** 制作e消息对象 */
  const e = {
    /** 消息编号 */
    eventId: event.id,
    /** 事件类型 */
    event: EType.MESSAGES,
    /** 消息类型  */
    eventType: EventType.CREATE,
    /**  消息对象 */
    msg: {
      channel_id: String(room_id), // 房间
      author: {
        id: MessageContent.user.id, // 用户编号
        username: MessageContent.user.name, // 用户名
        bot: false, // 是否是bot
        avatar: MessageContent.user.portrait // 头像
      },
      content: MessageContent.content.text // 指令消息
    },
    /** 是否是私域 */
    isPrivate: false,
    /** 是否是群聊 */
    isGroup: true,
    /**  是否是撤回 */
    isRecall: false,
    /** 艾特得到的qq */ // 忽略机器人
    atuid: [],
    /** 是否是艾特 */
    at: false,
    /** 是否是机器人主人 */
    isMaster: false,
    /** 去除了艾特后的消息 */
    cmd_msg: cmd_msg,
    /* 消息发送 */
    reply: async (msg?: string | object | Array<string> | Buffer, obj?: any | Buffer) => {
      //  第一参数是buffer
      let url = ''
      if (Buffer.isBuffer(msg)) {
        // 上传图片
        const randomNum = Math.floor(Math.random() * 31)
        COS.Upload(msg, `${randomNum}.jpg`)
        url = COS.getUrl(`${randomNum}.jpg`)
        /** 直接发送图片 */
        return await sendMessageTextUrl(villa_id, room_id, cmd_msg, url).catch(err => {
          console.log(err)
          return false
        })
      }

      /* 字符解析器 */
      const { entities, content } = await stringParsing(msg, villa_id)

      // 第二参考书是 buffer
      if (Buffer.isBuffer(obj)) {
        // 上传图片
        const randomNum = Math.floor(Math.random() * 31)
        COS.Upload(obj, `${randomNum}.jpg`)
        url = COS.getUrl(`${randomNum}.jpg`)
        if (entities.length == 0) {
          return await sendMessageTextUrl(villa_id, room_id, content, url).catch(err => {
            console.log(err)
            return false
          })
        } else {
          return await sendMessageTextEntitiesUrl(villa_id, room_id, content, entities, url).catch(
            err => {
              console.log(err)
              return false
            }
          )
        }
      }

      if (!obj && typeof msg === 'object') {
        const options: any = msg
        if (options?.image) {
          /** 图片对象  */
          return await sendMessageTextUrl(villa_id, room_id, cmd_msg, options.image).catch(err => {
            console.log(err)
            return false
          })
        }
        // msg 是对象,当没解析出什么
        return false
      }

      if (entities.length == 0 && content != '') {
        return await sendMessageText(villa_id, room_id, content).catch(err => {
          console.log(err)
          return false
        })
      } else if (entities.length != 0 && content != '') {
        return await sendMessageTextEntities(villa_id, room_id, content, entities).catch(err => {
          console.log(err)
          return false
        })
      }
      return false
    }
  }

  // 业务处理
  await InstructionMatching(e as Messagetype) // 转义
    .then(() => {
      console.info(`\n[${e.msg.channel_id}] [${e.msg.author.username}]\n${e.msg.content}${true}`)
      return true
    })
    .catch((err: any) => {
      console.error(err)
      console.info(`\n[${e.msg.channel_id}] [${e.msg.author.username}]\n${e.msg.content}${false}`)
      return false
    })
  return false
}

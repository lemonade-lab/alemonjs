import { IOpenAPI, Embed, Ark } from 'qq-guild-bot'
import { typeMessage } from 'alemon'
import { EventType, EventEnum, AMessage, PlatformEnum } from 'alemon'
import { getBotMsgByQQ } from '../bot.js'

// 非依赖引用
import { postImage } from '../alemonapi.js'

declare global {
  //接口对象
  var clientApiByQQ: IOpenAPI
}

/**
GUILD_MEMBERS (1 << 1)
  - GUILD_MEMBER_ADD       // 当成员加入时
  - GUILD_MEMBER_UPDATE    // 当成员资料变更时
  - GUILD_MEMBER_REMOVE    // 当成员被移除时
 */
export const GUILD_MEMBERS = async (data: any) => {
  const event = EventEnum.GUILD_MEMBERS
  let eventType = EventType.CREATE
  if (new RegExp(/ADD$/).test(data.eventType)) {
    eventType = EventType.CREATE
  } else if (new RegExp(/UPDATE$/).test(data.eventType)) {
    eventType = EventType.UPDATE
  } else {
    eventType = EventType.DELETE
  }

  /**
   * 得到频道列表
   */
  const ChannelsData = await clientApiByQQ.channelApi
    .channels(data.msg.guild_id)
    .then(res => {
      const { data } = res
      return data
    })
    .catch(err => {
      console.error(err)
      return false
    })

  if (typeof ChannelsData == 'boolean') {
    console.info(`\n[${event}] [${eventType}]\n${false}`)
    return false
  }

  const ChannelData = ChannelsData.find(item => item.type === 0)

  /**
   * 发送截图
   * @param file_image
   * @param content 内容,可选
   * @returns
   */
  const EPostImage = async (image: Buffer, content?: string): Promise<boolean> => {
    return await postImage({
      /**
       * 频道编号
       */
      id: data.img.guild_id,
      /**
       * 消息编号
       */
      msg_id: data.img.id,
      /**
       * 图片
       */
      image,
      /**
       * 内容
       */
      content,
      /**
       * 是群聊
       */
      isGroup: true
    })
      .then(() => true)
      .catch((err: any) => {
        console.error(err)
        return false
      })
  }

  const e = {
    platform: PlatformEnum.qq,
    bot: getBotMsgByQQ(),
    /**
     * 麦克风事件
     */
    event: event,
    /**
     * 上麦
     */
    eventType: eventType,
    /**
     * 是私域
     */
    isPrivate: false,
    /**
     * 不是撤回
     */
    isRecall: false,
    /**
     * 发现消息
     * @param msg
     * @param img
     * @returns
     */
    reply: async (msg?: string | string[] | Buffer, img?: Buffer): Promise<boolean> => {
      /**
       * 是图片
       */
      if (Buffer.isBuffer(msg)) {
        try {
          return await EPostImage(msg)
            .then(() => true)
            .catch(err => {
              console.error(err)
              return false
            })
        } catch (err) {
          console.error(err)
          return false
        }
      }
      /**
       * 折叠文本
       */
      const content = Array.isArray(msg) ? msg.join('') : typeof msg === 'string' ? msg : undefined
      /**
       * 发送文字+图片
       */
      if (Buffer.isBuffer(img)) {
        try {
          return await EPostImage(img, content)
            .then(() => true)
            .catch(err => {
              console.error(err)
              return false
            })
        } catch (err) {
          console.error(err)
          return false
        }
      }
      /**
       * 发送文字
       */
      return await clientApiByQQ.messageApi
        .postMessage(ChannelData.id, {
          content
        })
        .then(() => true)
        .catch((err: any) => {
          console.error(err)
          return false
        })
    },
    replyCard: async (obj: { embed: Embed } | { ark: Ark }) => {
      return await clientApiByQQ.messageApi
        .postMessage(ChannelData.id, {
          ...obj
        })
        .then(() => true)
        .catch((err: any) => {
          console.error(err)
          return false
        })
    }
  } as AMessage

  //只匹配类型
  await typeMessage(e)
    .then(() => {
      console.info(`\n[${e.event}] [${e.eventType}] [${true}]`)
      return true
    })
    .catch(err => {
      console.error(err)
      console.error(`\n[${e.event}] [${e.eventType}] [${false}]`)
      return false
    })
}

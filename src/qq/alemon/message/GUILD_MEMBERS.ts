import { IOpenAPI } from 'qq-guild-bot'
import { typeMessage, AMessage, CardType } from '../../../core/index.js'
import { getBotMsgByQQ } from '../bot.js'

// 非依赖引用
import { ClientAPIByQQ as Client } from '../../sdk/index.js'

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
export const GUILD_MEMBERS = async (event: any) => {
  const Eevent = 'GUILD_MEMBERS'
  let eventType = 'CREATE'
  if (new RegExp(/ADD$/).test(event.eventType)) {
    eventType = 'CREATE'
  } else if (new RegExp(/UPDATE$/).test(event.eventType)) {
    eventType = 'UPDATE'
  } else {
    eventType = 'DELETE'
  }

  /**
   * 得到频道列表
   */
  const ChannelsData: boolean | any[] = await clientApiByQQ.channelApi
    .channels(event.msg.guild_id)
    .then(res => {
      const { data } = res
      return data
    })
    .catch(err => {
      console.error(err)
      return false
    })

  if (typeof ChannelsData == 'boolean') {
    console.info(`\n[${Eevent}] [${eventType}]\n${false}`)
    return false
  }

  if (ChannelsData.length == 0) {
    console.info(`\n[${Eevent}] [${eventType}]\n${false}`)
    return false
  }

  const ChannelData = ChannelsData.find(item => item.type === 0)

  const e = {
    platform: 'qq',
    bot: getBotMsgByQQ(),
    event: Eevent,
    eventType: eventType,
    isPrivate: false,
    isRecall: false,
    isGroup: true,
    /**
     * 发现消息
     * @param msg
     * @param img
     * @returns
     */
    reply: async (
      msg: Buffer | string | (Buffer | string)[],
      select?: {
        quote?: string
        withdraw?: boolean
      }
    ): Promise<boolean> => {
      // is buffer
      if (Buffer.isBuffer(msg)) {
        try {
          return await Client.postImage({
            id: ChannelData.id,
            msg_id: event.msg.id, //消息id, 必须
            image: msg //buffer
          })
            .then(() => true)
            .catch((err: any) => {
              console.error(err)
              return false
            })
        } catch (err) {
          console.error(err)
          return false
        }
      }
      // arr && find buffer
      if (Array.isArray(msg) && msg.find(item => Buffer.isBuffer(item))) {
        const isBuffer = msg.findIndex(item => Buffer.isBuffer(item))
        const cont = msg.filter(element => typeof element === 'string').join('')
        try {
          return await Client.postImage({
            id: ChannelData.id,
            msg_id: event.msg.id, //消息id, 必须
            image: msg[isBuffer] as Buffer, //buffer
            content: cont
          })
            .then(() => true)
            .catch((err: any) => {
              console.error(err)
              return false
            })
        } catch (err) {
          console.error(err)
          return false
        }
      }
      const content = Array.isArray(msg)
        ? msg.join('')
        : typeof msg === 'string'
        ? msg
        : undefined
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
    replyCard: async (arr: CardType[]) => {
      for (const item of arr) {
        try {
          if (item.type == 'qq_ark' || item.type == 'qq_embed') {
            await clientApiByQQ.messageApi
              .postMessage(event.msg.channel_id, {
                msg_id: event.msg.id,
                ...item.card
              })
              .then(() => true)
              .catch((err: any) => {
                console.error(err)
                return false
              })
          } else {
            return false
          }
        } catch {
          return false
        }
      }
      return true
    }
  } as AMessage

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

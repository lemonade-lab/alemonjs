import { CardType, InstructionMatching, AMessage } from 'alemon'
import { ClientAPIByQQ as Client, ClinetWeb, getWebConfig } from '../../sdk/index.js'
import { segmentQQ } from '../segment.js'
import { getBotMsgByNtqq } from '../bot.js'
import { ExampleObject } from '../types.js'
import IMGS from 'image-size'

/**
 * 获取ip
 */
const ip = await ClinetWeb.getIP()

export const C2C_MESSAGE_CREATE = async (event: ExampleObject) => {
  const e = {} as AMessage

  const webCfg = getWebConfig()

  e.platform = 'ntqq'
  e.bot = getBotMsgByNtqq()
  e.event = 'MESSAGES'
  e.eventType = 'CREATE'
  e.isPrivate = false
  e.isRecall = false
  e.isGroup = false

  /* 消息发送机制 */
  e.reply = async (msg?: string | string[] | Buffer, img?: Buffer | string, name?: string) => {
    if (Buffer.isBuffer(msg)) {
      try {
        let url = ''
        if (Buffer.isBuffer(msg)) {
          const uul = await ClinetWeb.setLocalImg(msg)
          url = `${webCfg.http}://${ip}:${webCfg.callback_port}${uul}`
          return await Client.postFilesByGroup(event.group_id, url).catch(err => {
            console.error(err)
            return false
          })
        }
      } catch (err) {
        console.error(err)
        return false
      }
    }
    const content = Array.isArray(msg) ? msg.join('') : typeof msg === 'string' ? msg : undefined
    if (Buffer.isBuffer(img)) {
      try {
        let url = ''
        const dimensions = IMGS.imageSize(img)
        const uul = await ClinetWeb.setLocalImg(img)
        url = `${webCfg.http}://${ip}:${webCfg.callback_port}${uul}`
        return await Client.postMessageByGroup(
          event.group_id,
          `${content}  ![text #${dimensions.width}px #${dimensions.height}px](${url})`,
          event.id
        )
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
    return await Client.postMessageByUser(event.author.id, content, event.id)
      .then(() => true)
      .catch((err: any) => {
        console.error(err)
        return false
      })
  }
  e.replyCard = async (arr: CardType[]) => {
    for (const item of arr) {
      try {
        if (item.type == 'qq_ark' || item.type == 'qq_embed') {
          console.info('暂不可用')
          return false
        } else {
          return false
        }
      } catch {
        return false
      }
    }
    return true
  }

  /**
   * 发送表情表态
   * @param mid
   * @param boj { emoji_type: number; emoji_id: string }
   * @returns
   */
  e.replyEmoji = async (
    mid: string,
    boj: { emoji_type: number; emoji_id: string }
  ): Promise<boolean> => {
    console.info('不可用')
    return false
  }

  /**
   * 删除表情表态
   * @param mid
   * @param boj
   * @returns
   */
  e.deleteEmoji = async (
    mid: string,
    boj: { emoji_type: number; emoji_id: string }
  ): Promise<boolean> => {
    console.info('不可用')
    return false
  }

  e.msg_txt = event.content

  e.msg = event.content

  /**
   * 消息编号
   */
  e.msg_id = event.id

  e.user_id = event.author.id

  e.user_avatar = 'https://q1.qlogo.cn/g?b=qq&s=0&nk=1715713638'

  e.user_name = '柠檬冲水'

  e.channel_id = event.group_id

  e.guild_id = event.group_id

  e.segment = segmentQQ

  e.at_users = []

  e.at_user = {
    id: '0',
    avatar: '0',
    name: '0',
    bot: false
  }

  /**
   * 艾特消息处理
   */
  e.at = false

  /**
   * 消息处理
   */
  await InstructionMatching(e)
    .then(() => {
      console.info(console.info(`\n[${e.channel_id}] [${e.user_name}] [${true}] \n ${e.msg_txt}`))
      return true
    })
    .catch((err: any) => {
      console.error(err)
      console.info(console.info(`\n[${e.channel_id}] [${e.user_name}] [${false}] \n ${e.msg_txt}`))
      return false
    })
}

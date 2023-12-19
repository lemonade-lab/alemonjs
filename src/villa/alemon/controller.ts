import { ClientVILLA } from '../sdk/index.js'
import { replyController } from './reply.js'
import { ControllerOption, UserInformationType } from '../../core/index.js'
import { getBotConfigByKey } from '../../config/index.js'
import { everyoneError } from '../../log/index.js'

interface ButtonType {
  // 文字
  text: string
  // 类型
  type?: number
  // 跳转地址
  link?: string
  // 跳转时携带的token
  token?: boolean
  // 点击后所得文本你
  input?: string
  // 是否回调
  callback?: boolean
  // 回调时携带的标记
  extra?: string
}

export const Controller = {
  Member: ({ guild_id, user_id }) => {
    return {
      /**
       * 查看信息
       * @returns
       */
      information: async (): Promise<UserInformationType | false> => {
        // 对进行进行过滤,并以固定格式返回
        const data = await ClientVILLA.getMember(guild_id, user_id)
          .then(res => res.data)
          .catch(everyoneError)
        if (!data) return false
        const cfg = getBotConfigByKey('villa')
        const masterID = cfg.masterID
        return {
          id: data.member.basic.uid,
          name: data.member.basic.nickname,
          introduce: data.member.basic.introduce,
          avatar: data.member.basic.avatar_url,
          joined_at: Number(data.member.joined_at),
          bot: false,
          isMaster: masterID == data.member.basic.uid,
          role: data.member.role_list
        }
      },
      /**
       * 禁言
       */
      mute: async (option?: { time?: number; cancel?: boolean }) => {
        //
      },
      /**
       * 踢出
       */
      remove: async () => {
        return await ClientVILLA.deleteVillaMember(guild_id, user_id).catch(
          everyoneError
        )
      },
      /**
       * 身分组
       * @param role_id 身分组编号
       * @param is_add 默认添加行为
       * @returns
       */
      operate: async (role_id: string, add = true) => {
        return await ClientVILLA.operateMemberToRole(guild_id, {
          role_id,
          uid: user_id,
          is_add: add
        }).catch(everyoneError)
      }
    }
  },
  Message: ({ guild_id, channel_id, msg_id, open_id }) => {
    return {
      /**
       * 回复
       * @param content
       * @returns
       */
      reply: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        // villa未有回复api
        if (open_id) {
          console.error('VILLA 无私信')
          return false
        }
        return await replyController(guild_id, channel_id, content).catch(
          everyoneError
        )
      },
      /**
       * 引用
       * @param content
       * @returns
       */
      quote: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        if (open_id) {
          console.error('VILLA 无私信')
          return false
        }
        return await replyController(guild_id, channel_id, content, {
          quote: msg_id
        }).catch(everyoneError)
      },
      /**
       * 更新信息
       * @param content
       * @returns
       */
      update: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return false
      },
      /**
       * 撤回
       * @returns
       */
      withdraw: async (hideTip: boolean) => {
        return await ClientVILLA.recallMessage(guild_id, {
          room_id: channel_id,
          msg_uid: msg_id
        }).catch(everyoneError)
      },
      /**
       *  钉选
       * @param cancel
       * @returns
       */
      pinning: async (cancel = false) => {
        return await ClientVILLA.pinMessage(guild_id, {
          room_id: channel_id,
          is_cancel: cancel,
          msg_uid: msg_id
        }).catch(everyoneError)
      },
      /**
       *  喇叭
       * @param cancel
       * @returns
       */
      horn: async (cancel = false) => {
        return false
      },
      /**
       * 转发
       * @returns
       */
      forward: async () => {
        return false
      },
      /**
       *
       * 表态
       * @param msg
       * @param cancel
       * @returns
       */
      emoji: async (msg: any[], cancel?: boolean) => {
        return []
      },
      /**
       * 音频
       * @param file
       * @param name
       */
      audio: async (file: Buffer | string, name?: string) => {
        return false
      },
      /**
       * 视频
       * @param file
       * @param name
       */
      video: async (file: Buffer | string, name?: string) => {
        return false
      },
      /**
       * 卡片
       * @param msg
       * @returns
       */
      card: async (msg: any[]) => {
        const arr: any[] = []
        for (const item of msg) {
          arr.push(
            await ClientVILLA.sendCard(guild_id, channel_id, item).catch(
              everyoneError
            )
          )
        }
        return arr
      },
      // button: async (
      //   content: Buffer | string | number | (Buffer | number | string)[],
      //   on: ButtonType[][]
      // ) => {
      //   const big_component_group_list = [] // 1
      //   const mid_component_group_list = [] // 2
      //   const small_component_group_list = [] // 3

      //   /**
      //    * 第一道程序,清除所有异常字数的按钮
      //    */
      //   const Arr: ButtonType[][] = []
      //   for (const item of on) {
      //     const itemArr: ButtonType[] = []
      //     for (const jtem of item) {
      //       if (jtem.text.length < 10) {
      //         // 字符超标,删除
      //         itemArr.push(jtem)
      //       }
      //     }
      //     if (itemArr.length == 0) continue
      //     Arr.push(itemArr)
      //   }

      //   /**
      //    * 第二道工序, 根据文字长度是否符合预期来异构
      //    */

      //   /**
      //    * 优先按原规则输入
      //    *
      //    * >3的，求3的余数
      //    *
      //    * 同一行同 存在 字数不复合的  异构
      //    * 如  [2,4,2]  , 中间的4异构 变成  [2],[4],[2]
      //    *
      //    */

      //   // 高度
      //   const h = on.length
      //   let x = 1
      //   let y = 99
      //   // 每一行长度不一样
      //   const arr = []
      //   for (const item of Arr) {
      //     x++
      //     y--
      //     if (item.length == 1) {
      //       /**
      //        * 看看是什么类型
      //        *
      //        * 点击  跳转、回调、出文字
      //        *
      //        * 1回传型 回调 ，2输入型 input，3跳转型 link
      //        *
      //        */

      //       let c_type = 1

      //       if (item[0].link) {
      //         // link 存在 是跳转类型
      //         c_type = 2
      //       } else if (item[0].input) {
      //         // 按钮类型
      //         c_type = 1
      //       }

      //       // 第一行 就一个
      //       big_component_group_list.push([
      //         [
      //           {
      //             id: `${x}${y}`,
      //             text: item[0].text,
      //             type: 1,
      //             c_type: c_type,
      //             input: item[0]?.input ?? undefined,
      //             need_callback: item[0].callback ?? false,
      //             extra: item[0].extra ?? ''
      //           }
      //         ]
      //       ])
      //       continue
      //     }
      //   }
      //   // 调用解析
      //   return await ClientVILLA.sendCard(guild_id, channel_id, {
      //     content: {
      //       text: String(content)
      //     },
      //     panel: ClientVILLA.buttonAutomaticArrangement(arr)
      //   }).catch(everyoneError)
      // },
      allUsers: async (
        reactionObj: any,
        options = {
          cookie: '',
          limit: 20
        }
      ) => {
        return false
      },
      article: async (msg: any) => {
        return false
      }
    }
  }
}

/**
 * 消息控制器
 * @param select
 * @returns
 */
export const ClientControllerOnMessage = (data?: {
  guild_id: string | number
  channel_id: string | number
  msg_id: string
}) => {
  return (select?: ControllerOption) => {
    const guild_id = select?.guild_id ?? data.guild_id
    const channel_id = select?.channel_id ?? data.channel_id
    const msg_id = select?.msg_id ?? data.msg_id
    return Controller.Message({
      guild_id,
      channel_id,
      msg_id,
      open_id: select?.open_id
    })
  }
}

/**
 * 成员控制器
 * @param select
 * @returns
 */
export const ClientControllerOnMember = (data?: {
  guild_id: string | number
  user_id: string
}) => {
  return (select?: ControllerOption) => {
    const guild_id = select?.guild_id ?? data.guild_id
    const user_id = select?.guild_id ?? data.user_id
    return Controller.Member({ guild_id, user_id })
  }
}

/**
 * 对message  公聊、私聊、卡片、图片、转发、回复、引用、表态、钉选、喇叭、所有表态
 *
 * 对users  查信息、禁言、踢出、加入身份组、移除指定身分组
 *
 * 对身分组  所有分组组、查信息、创建、更新、删除、加入指定用户、移除指定用户
 *
 * 对频道   查信息、查看所有喇叭、查看频道所有身分组、所有成员列表、禁言所有成员、查看所有子频道
 *
 * 对子频道 查信息、更创建、更新、删除、禁指定用户、禁指定身分组、查看所有钉选、查看所有帖子、查看所有日程
 *
 * 对论坛(都归为子频道)  查信息、
 *
 * 对贴子 查看帖子信息、创建、更新、删除、
 *
 * 对日程 查日程、创建、删除、更改
 *
 * 机器人     查看所有频道、
 *
 * 成员     查看成员所有身份组、
 *
 */

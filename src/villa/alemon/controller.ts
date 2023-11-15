import { ClientVILLA } from '../sdk/index.js'
import { replyController } from './reply.js'

export const Controller = {
  Mumber: ({ guild_id, uid }) => {
    return {
      /**
       * 查看信息
       * @returns
       */
      information: async () => {
        // 对进行进行过滤,并以固定格式返回
        const data = await ClientVILLA.getMember(guild_id, uid).then(
          res => res.data
        )
        if (!data) return false
        // 信息也包含了 权限 and 所在身份
        console.log('data.member', data.member)
        /**
         * {
         *     id: 组编号
         *     name:组名,
         *     join_at: 加入时间,
         *     typing: 类型  频道主9、超级管理员8、管理员7、自定义6、普通0
         *  }
         */
        return {
          id: data.member.basic.uid,
          name: data.member.basic.nickname,
          introduce: '',
          avatar: data.member.basic.avatar,
          role: []
        }
      },
      /**
       * 禁言
       */
      mute: async () => {
        //
      },
      /**
       * 踢出
       */
      remove: async () => {
        return await ClientVILLA.deleteVillaMember(guild_id, uid)
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
          uid,
          is_add: add
        })
      }
    }
  },
  Message: ({ guild_id, channel_id, msg_id, send_at }) => {
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
        return await replyController(guild_id, channel_id, content)
      },
      /**
       * 引用
       * @param content
       * @returns
       */
      quote: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        // villa未有回复api
        return await replyController(guild_id, channel_id, content)
      },
      /**
       * 撤回
       * @returns
       */
      withdraw: async (hideTip: boolean) => {
        return await ClientVILLA.recallMessage(guild_id, {
          room_id: channel_id,
          msg_uid: msg_id,
          send_at: send_at
        })
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
          msg_uid: msg_id,
          send_at: send_at
        })
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
       * 卡片
       * @param msg
       * @returns
       */
      card: async (msg: any[]) => {
        return []
      },
      /**
       * 所有表态
       * @returns
       */
      allEmoji: async () => {
        return await ClientVILLA.getAllEmoticons(guild_id, msg_id)
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
  send_at: number
}) => {
  return (select?: {
    guild_id?: string
    channel_id?: string
    msg_id?: string
    send_at?: number
  }) => {
    const guild_id = select?.guild_id ?? data.guild_id
    const channel_id = select?.channel_id ?? data.channel_id
    const msg_id = select?.msg_id ?? data.msg_id
    const send_at = select?.send_at ?? data.send_at
    return Controller.Message({ guild_id, channel_id, msg_id, send_at })
  }
}

/**
 * 成员控制器
 * @param select
 * @returns
 */
export const ClientControllerOnMember = (data?: {
  guild_id: string | number
  uid: string
}) => {
  return (select?: { guild_id?: string; uid?: string }) => {
    const guild_id = select?.guild_id ?? data.guild_id
    const uid = select?.guild_id ?? data.uid
    return Controller.Mumber({ guild_id, uid })
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

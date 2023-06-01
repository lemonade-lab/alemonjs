import { IOpenAPI, IGuild, ReactionObj } from 'qq-guild-bot'
import { EventEmitter } from 'ws'
import { SessionEvents, AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { green } from 'kolorist'
import { PathLike } from 'fs'
import {
  BotType,
  BotConfigType,
  sendImage,
  EventType,
  EType,
  postImage,
  cmdInit,
  InstructionMatching,
  typeMessage
} from 'alemon'

/* 非依赖引用 */
import { channewlPermissions } from './permissions'
import { replyPrivate } from './privatechat'
import { AlemonMsgType } from './types'

declare global {
  //接口对象
  var client: IOpenAPI
  //连接对象
  var ws: EventEmitter
}

let robot: BotType

let guilds: Array<IGuild>
/**
 * ws.on方法可以监听机器人所在频道的所有事件
 * 根据其e.eventType，判断出事件的具体类型
 */
export const createConversation = (cfg: BotConfigType) => {
  /** 准备 */
  ws.on(SessionEvents.READY, async one => {
    if (cfg.sandbox) console.info('[READY]', one)
    /* 记录机器人信息 */
    robot = one.msg
    /* 初始化指令 */
    cmdInit()
    guilds = await client.meApi
      .meGuilds()
      .then(res => {
        const { data } = res
        return data
      })
      .catch(err => {
        console.error(err)
        return []
      })
    /* 基础权限 */
    GUILDS(cfg) //机器人进出频道消息
    GUILD_MEMBERS(cfg) //成员频道进出变动消息
    DIRECT_MESSAGE(cfg) //私聊会话消息
    /* 基础权限 */
    PUBLIC_GUILD_MESSAGES(cfg) //频道会话消息（公域）
    /* 需申请权限 */
    GUILD_MESSAGES(cfg) //频道会话消息（私域）
    /* 需申请权限 */
    FORUMS_EVENT(cfg) //论坛消息（私域）
    OPEN_FORUMS_EVENT(cfg) //论坛消息（公域）
    GUILD_MESSAGE_REACTIONS(cfg) //频道表情点击会话消息
    INTERACTION(cfg) //互动事件监听
    MESSAGE_AUDIT(cfg) //审核事件监听
    AUDIO_ACTION(cfg) //音频事件
    console.info('[READY]', ` 欢迎回来 ${robot.user.username} ~`)
  })

  /** 权限错误 */
  ws.on(SessionEvents.ERROR, (one: any) => {
    console.error('[ERROR]', one)
  })

  /**  超长断连 */
  ws.on(SessionEvents.DEAD, (one: any) => {
    console.error('DEAD', one)
    console.error('请确认配置！')
    console.error('账户密码是否正确？')
    console.error('域事件是否匹配？')
  })

  /* 关闭 */
  ws.on(SessionEvents.CLOSED, (one: any) => {
    console.error('[CLOSED]', one)
  })

  /** 断开连接 */
  ws.on(SessionEvents.DISCONNECT, (one: any) => {
    console.error('[DISCONNECT]', one)
  })

  /* 无效会话 */
  ws.on(SessionEvents.INVALID_SESSION, (one: any) => {
    console.error('[INVALID_SESSION]', one)
  })

  /* 再连接 */
  ws.on(SessionEvents.RECONNECT, (one: any) => {
    console.error('[RECONNECT]', one)
  })

  /* 重新开始 */
  ws.on(SessionEvents.RESUMED, (one: any) => {
    console.error('[RESUMED]', one)
  })

  /* WS断连 */
  ws.on(SessionEvents.EVENT_WS, async one => {
    if (one.eventType == 'DISCONNECT') {
      console.log('[EVENT_WS][DISCONNECT]', one)
    }
  })
}

/**
 * ***********************
 * 特殊拆分,以正确能区分频道与子频道事件
 * ***********************
 * 即 GUILDS  演化为  GUILD/CHANNEL
 * **************
 */

/**
GUILDS (1 << 0)
  - 主频道
  - GUILD_CREATE           // 当机器人加入新guild时
  - GUILD_UPDATE           // 当guild资料发生变更时
  - GUILD_DELETE           // 当机器人退出guild时
  - 子频道
  - CHANNEL_CREATE         // 当channel被创建时
  - CHANNEL_UPDATE         // 当channel被更新时
  - CHANNEL_DELETE         // 当channel被删除时
 */
const GUILDS = (cfg: BotConfigType) => {
  ws.on(AvailableIntentsEventsEnum.GUILDS, (e: AlemonMsgType) => {
    if (cfg.sandbox) console.info(e)
    if (new RegExp(e.event).test('/^GUILD.*$/')) {
      e.event = EType.GUILD
    } else {
      e.event = EType.CHANNEL
    }
    if (new RegExp(e.eventType).test('/CREATE$/')) {
      e.eventType = EventType.CREATE
    } else if (new RegExp(e.eventType).test('/UPDATE$/')) {
      e.eventType = EventType.UPDATE
    } else {
      e.eventType = EventType.DELETE
    }
    //只匹配类型
    typeMessage(e)
  })
}

/**
GUILD_MEMBERS (1 << 1)
  - GUILD_MEMBER_ADD       // 当成员加入时
  - GUILD_MEMBER_UPDATE    // 当成员资料变更时
  - GUILD_MEMBER_REMOVE    // 当成员被移除时
 */
const GUILD_MEMBERS = (cfg: BotConfigType) => {
  /*监听新人事件*/
  ws.on(AvailableIntentsEventsEnum.GUILD_MEMBERS, async (e: AlemonMsgType) => {
    if (cfg.sandbox) console.info(e)

    if (new RegExp(e.eventType).test('/^GUILD_MEMBER_ADD$/')) {
      e.eventType = EventType.CREATE
    } else if (new RegExp(e.eventType).test('/^GUILD_MEMBER_UPDATE$/')) {
      e.eventType = EventType.UPDATE
    } else {
      e.eventType = EventType.DELETE
    }

    const { data } = await client.channelApi.channels(e.msg.guild_id)

    const channel = data.find(item => item.type === 0)

    if (channel) {
      const BotPS = await channewlPermissions(channel.id, robot.user.id)
      e.bot_permissions = BotPS
    }

    /**
     * 消息发送机制
     * @param content 消息内容
     * @param obj 额外消息 可选
     */
    e.reply = async (msg?: string | object | Array<string>, obj?: object): Promise<boolean> => {
      if (channel) {
        const content = Array.isArray(msg)
          ? msg.join('')
          : typeof msg === 'string'
          ? msg
          : undefined
        const options = typeof msg === 'object' && !obj ? msg : obj
        return await client.messageApi
          .postMessage(channel.id, {
            content,
            ...options
          })
          .then(() => true)
          .catch((err: any) => {
            console.error(err)
            return false
          })
      }
      return false
    }

    //只匹配类型
    typeMessage(e)
  })
}

/** 
GUILD_MESSAGES (1 << 9)    // 消息事件，仅 *私域* 机器人能够设置此 intents。
  - MESSAGE_CREATE         
  // 频道内的全部消息，
  而不只是 at 机器人的消息。
  内容与 AT_MESSAGE_CREATE 相同
  - MESSAGE_DELETE         // 删除（撤回）消息事件
 * */
const GUILD_MESSAGES = (cfg: BotConfigType) => {
  ws.on(AvailableIntentsEventsEnum.GUILD_MESSAGES, async (e: AlemonMsgType) => {
    if (cfg.sandbox) console.info(e)

    // 撤回转交为公域监听处理

    if (new RegExp(e.eventType).test('/^MESSAGE_DELETE$/')) return

    // 艾特机器人消息转交为公域监听处理
    if (new RegExp(`<@!${robot.user.id}>`).test(e.msg.content)) return

    /* 事件匹配 */
    e.event = EType.MESSAGES

    /* 类型匹配 */
    e.eventType = EventType.CREATE

    /* 是私域 */
    e.isPrivate = true

    /* 测回消息 */
    e.isRecall = false

    /* 消息方法 */
    guildMessges(cfg, e).catch((err: any) => console.error(err))
  })
}

/**
 PUBLIC_GUILD_MESSAGES (1 << 30) // 消息事件，此为公域的消息事件
 AT_MESSAGE_CREATE       // 当收到@机器人的消息时
 PUBLIC_MESSAGE_DELETE   // 当频道的消息被删除时
 */
const PUBLIC_GUILD_MESSAGES = (cfg: BotConfigType) => {
  ws.on(AvailableIntentsEventsEnum.PUBLIC_GUILD_MESSAGES, async (e: AlemonMsgType) => {
    if (cfg.sandbox) console.info(e)

    /* 事件匹配 */
    e.event = EType.MESSAGES

    /*   是私域 */
    e.isPrivate = true

    /* 屏蔽测回消息 */
    e.isRecall = false

    if (new RegExp(e.eventType).test('/^PUBLIC_MESSAGE_DELETE$/')) {
      e.eventType = EventType.DELETE
      e.isRecall = true
      //只匹配类型函数
      typeMessage(e)
    }

    if (new RegExp(e.eventType).test('/^AT_MESSAGE_CREATE$/')) {
      /* 类型匹配 */
      e.eventType = EventType.CREATE
      /* 消息方法 */
      guildMessges(cfg, e).catch((err: any) => console.error(err))
    }
  })
}

const guildMessges = async (cfg: BotConfigType, e: AlemonMsgType) => {
  /* 屏蔽其他机器人的消息 */
  if (e.msg.author.bot) return

  const BotPS = await channewlPermissions(e.msg.channel_id, robot.user.id)
  e.bot_permissions = BotPS

  const UserPS = await channewlPermissions(e.msg.channel_id, e.msg.author.id)
  e.user_permissions = UserPS

  const channeldata = await client.channelApi
    .channel(e.msg.channel_id)
    .then(res => {
      return res.data
    })
    .catch((err: any) => console.error(err))

  e.msg.channel_name = channeldata['name']

  const guilddata = guilds.find(item => item.id == e.msg.guild_id)
  if (guilddata) {
    e.msg.owner_id = guilddata.id
  } else {
    e.msg.owner_id = 'false'
  }

  e.isMaster = false

  if (e.msg.author.id == cfg.masterID) {
    e.isMaster = true
  }

  e.isGroup = false

  /**
   * 消息发送机制
   * @param content 消息内容
   * @param obj 额外消息 可选
   */
  e.reply = async (msg?: string | object | Array<string>, obj?: object): Promise<boolean> => {
    const content = Array.isArray(msg) ? msg.join('') : typeof msg === 'string' ? msg : undefined
    const options = typeof msg === 'object' && !obj ? msg : obj
    return await client.messageApi
      .postMessage(e.msg.channel_id, {
        msg_id: e.msg.id,
        content,
        ...options
      })
      .then(() => true)
      .catch((err: any) => {
        console.error(err)
        return false
      })
  }

  /**
   * 表情表态
   * @param boj 表情对象
   */
  e.deleteEmoji = async (boj: ReactionObj): Promise<boolean> => {
    await client.reactionApi
      .deleteReaction(e.msg.channel_id, boj)
      .catch((err: any) => console.error(err))
    return true
  }

  e.postEmoji = async (boj: ReactionObj): Promise<boolean> => {
    await client.reactionApi
      .postReaction(e.msg.channel_id, boj)
      .catch((err: any) => console.error(err))
    return true
  }

  /**
   * 发送本地图片
   * @param content 消息内容  可选
   * @param file_image 消息图片
   * @returns
   */
  e.sendImage = async (file_image: any, content?: string): Promise<boolean> => {
    if (e.isGroup) return false
    return await sendImage(
      e.msg.channel_id,
      {
        msg_id: e.msg.id, //消息id, 必须
        file_image, //本地图片的路径
        content
      },
      e.isGroup
    )
      .then(() => true)
      .catch((err: any) => {
        console.error(err)
        return false
      })
  }

  /**
   * 发送截图
   * @param file_image
   * @param content 内容,可选
   * @returns
   */
  e.postImage = async (file_image: PathLike, content?: string): Promise<boolean> => {
    if (e.isGroup) return false
    return await postImage(
      e.msg.channel_id,
      {
        msg_id: e.msg.id, //消息id, 必须
        file_image, //buffer
        content
      },
      e.isGroup
    )
      .then(() => true)
      .catch((err: any) => {
        console.error(err)
        return false
      })
  }

  /* 消息 */
  e.cmd_msg = e.msg.content

  e.identity = {
    master: false, //频道主人
    member: false, //成员
    grade: '1', //等级
    admins: false, //管理员
    wardens: false //子频道管理也
  }

  if (e.msg.member) {
    if (e.msg.member.roles.find(item => item == '2')) e.identity.admins = true //管理员
    if (e.msg.member.roles.find(item => item == '4')) e.identity.master = true //频道主人
    if (e.msg.member.roles.find(item => item == '5')) e.identity.wardens = true //子频道管理
    const arr = e.msg.member.roles.filter(item => item != '2' && item != '4' && item != '5')
    const grade = arr[0].split(/(?<=1)/)
    if (grade.length > 1) e.identity.grade = grade[1]
  }

  /* 艾特消息处理 */
  e.at = false
  if (e.msg.mentions) {
    // 去掉@ 转为纯消息
    e.atuid = e.msg.mentions
    e.at = true
    /* 循环删除文本中的ati信息 */
    e.atuid.forEach(item => {
      e.cmd_msg = e.cmd_msg.replace(`<@!${item.id}>`, '').trim()
    })
  }

  e.replyPrivate = async (
    msg?: string | object | Array<string>,
    obj?: object
  ): Promise<boolean> => {
    return await replyPrivate(e.msg, msg, obj)
      .then(res => {
        console.log(res)
        return true
      })
      .catch(err => {
        console.log(err)
        return false
      })
  }

  /* 消息处理 */
  InstructionMatching(e).catch((err: any) => console.error(err))

  console.info(
    green(`\n[${guilddata.name}][${e.msg.channel_id}] [${e.msg.author.username}]\n${e.msg.content}`)
  )
}

/**
DIRECT_MESSAGE (1 << 12)
  - DIRECT_MESSAGE_CREATE   // 当收到用户发给机器人的私信消息时
  - DIRECT_MESSAGE_DELETE   // 删除（撤回）消息事件
 */
const DIRECT_MESSAGE = (cfg: BotConfigType) => {
  ws.on(AvailableIntentsEventsEnum.DIRECT_MESSAGE, async (e: AlemonMsgType) => {
    if (cfg.sandbox) console.info(e)

    if (new RegExp(e.eventType).test('/^DIRECT_MESSAGE_DELETE$/')) {
      e.eventType = EventType.DELETE
      e.isRecall = true
      //只匹配类型函数
      typeMessage(e)
    }

    /* 事件匹配 */
    e.event = EType.MESSAGES

    e.eventType = EventType.CREATE

    /* 屏蔽测回消息 */
    e.isRecall = false

    /* 是私聊 */
    e.isGroup = true

    const BotPS = await channewlPermissions(e.msg.channel_id, robot.user.id)
    const UserPS = await channewlPermissions(e.msg.channel_id, e.msg.author.id)

    e.bot_permissions = BotPS
    e.user_permissions = UserPS

    e.identity = {
      master: false, //频道主人
      member: false, //成员
      grade: '1', //等级
      admins: false, //管理员
      wardens: false //子频道管理也
    }

    /* 消息发送机制 */
    e.reply = async (msg?: string | object | Array<string>, obj?: object) => {
      const content = Array.isArray(msg) ? msg.join('') : typeof msg === 'string' ? msg : undefined
      const options = typeof msg === 'object' && !obj ? msg : obj
      return await client.directMessageApi
        .postDirectMessage(e.msg.guild_id, {
          msg_id: e.msg.id,
          content,
          ...options
        })
        .then(() => true)
        .catch((err: any) => {
          console.error(err)
          return false
        })
    }

    /**
     * 表情表态
     * @param boj 表情对象
     */
    e.deleteEmoji = async (boj: any): Promise<boolean> => {
      console.info('私信无此功能')
      return false
    }

    e.postEmoji = async (boj: any): Promise<boolean> => {
      console.info('私信无此功能')
      return false
    }

    /**
     * 发送本地图片
     * @param content 消息内容  可选
     * @param file_image 消息图片
     * @returns
     */
    e.sendImage = async (file_image: PathLike, content?: string): Promise<boolean> => {
      return await sendImage(
        e.msg.guild_id,
        {
          msg_id: e.msg.id, //消息id, 必须
          file_image, //buffer
          content
        },
        e.isGroup
      )
        .then(() => true)
        .catch((err: any) => {
          console.error(err)
          return false
        })
    }

    /**
     * 发送截图
     * @param file_image
     * @param content 内容,可选
     * @returns
     */
    e.postImage = async (file_image: PathLike, content?: string): Promise<boolean> => {
      return await postImage(
        e.msg.guild_id,
        {
          msg_id: e.msg.id, //消息id, 必须
          file_image, //buffer
          content
        },
        e.isGroup
      )
        .then(() => true)
        .catch((err: any) => {
          console.error(err)
          return false
        })
    }

    /* 消息 */
    e.cmd_msg = e.msg.content

    /* 消息处理 */
    InstructionMatching(e).catch((err: any) => console.error(err))

    console.info(
      green(
        `[${e.msg.author.username}][${e.msg.author.id}][${e.isGroup}] ${
          e.msg.content ? e.msg.content : ''
        }`
      )
    )
  })
}

/**
GUILD_MESSAGE_REACTIONS (1 << 10)
  - MESSAGE_REACTION_ADD    // 为消息添加表情表态
  - MESSAGE_REACTION_REMOVE // 为消息删除表情表态
 */
const GUILD_MESSAGE_REACTIONS = (cfg: BotConfigType) => {
  ws.on(AvailableIntentsEventsEnum.GUILD_MESSAGE_REACTIONS, (e: AlemonMsgType) => {
    if (cfg.sandbox) console.info(e)
    /* 事件匹配 */
    e.event = EType.GUILD_MESSAGE_REACTIONS
    //只匹配类型
    typeMessage(e)
  })
}

/**
INTERACTION (1 << 26)
  - INTERACTION_CREATE     // 互动事件创建时
 */
const INTERACTION = (cfg: BotConfigType) => {
  ws.on(AvailableIntentsEventsEnum.INTERACTION, (e: AlemonMsgType) => {
    if (cfg.sandbox) console.info(e)
    /* 事件匹配 */
    e.event = EType.INTERACTION
    //只匹配类型
    typeMessage(e)
  })
}

/**
MESSAGE_AUDIT (1 << 27)
- MESSAGE_AUDIT_PASS     // 消息审核通过
- MESSAGE_AUDIT_REJECT   // 消息审核不通过
 */
const MESSAGE_AUDIT = (cfg: BotConfigType) => {
  ws.on(AvailableIntentsEventsEnum.MESSAGE_AUDIT, (e: AlemonMsgType) => {
    if (cfg.sandbox) console.info(e)
    /* 事件匹配 */
    e.event = EType.MESSAGE_AUDIT
    //只匹配类型
    typeMessage(e)
  })
}

/**
AUDIO_ACTION (1 << 29)
  - AUDIO_START             // 音频开始播放时
  - AUDIO_FINISH            // 音频播放结束时
  - AUDIO_ON_MIC            // 上麦时
  - AUDIO_OFF_MIC           // 下麦时
 */
const AUDIO_ACTION = (cfg: BotConfigType) => {
  ws.on(AvailableIntentsEventsEnum.AUDIO_ACTION, (e: AlemonMsgType) => {
    if (cfg.sandbox) console.info(e)
    /* 事件匹配 */
    e.event = EType.AUDIO_ACTION
    //只匹配类型
    typeMessage(e)
  })
}

/**
 * todo
 * *************************
 * 以下处理未做测试
 * *************************
 */

/**
FORUMS_EVENT (1 << 28)  // 论坛事件，仅 *私域* 机器人能够设置此 intents。

  - FORUM_THREAD_CREATE     // 当用户创建主题时
  - FORUM_THREAD_UPDATE     // 当用户更新主题时
  - FORUM_THREAD_DELETE     // 当用户删除主题时

  - FORUM_POST_CREATE       // 当用户创建帖子时
  - FORUM_POST_DELETE       // 当用户删除帖子时
  - FORUM_REPLY_CREATE      // 当用户回复评论时
  - FORUM_REPLY_DELETE      // 当用户删除评论时

  - FORUM_PUBLISH_AUDIT_RESULT      // 当用户发表审核通过时
 */
const FORUMS_EVENT = (cfg: BotConfigType) => {
  ws.on(AvailableIntentsEventsEnum.FORUMS_EVENT, (e: AlemonMsgType) => {
    if (cfg.sandbox) console.info(e)
    /* 事件匹配 */
    e.event = EType.FORUMS
    //是私域
    e.isPrivate = true
    //只匹配类型
    typeMessage(e)
  })
}

/**
 * todo
 * ***********
 * 公域论坛事件未能匹配
 * ***********
 */

/**
   OPEN_FORUMS_EVENT (1 << 18)      // 论坛事件, 此为公域的论坛事件
  
    - OPEN_FORUM_THREAD_CREATE     // 当用户创建主题时
    - OPEN_FORUM_THREAD_UPDATE     // 当用户更新主题时
    - OPEN_FORUM_THREAD_DELETE     // 当用户删除主题时
  
    - OPEN_FORUM_POST_CREATE       // 当用户创建帖子时
    - OPEN_FORUM_POST_DELETE       // 当用户删除帖子时
    - OPEN_FORUM_REPLY_CREATE      // 当用户回复评论时
    - OPEN_FORUM_REPLY_DELETE      // 当用户删除评论时
   */
const OPEN_FORUMS_EVENT = (cfg: BotConfigType) => {
  ws.on('OPEN_FORUMS_EVENT', (e: AlemonMsgType) => {
    if (cfg.sandbox) console.info(e)
    /* 事件匹配 */
    e.event = EType.FORUMS
    //是私域
    e.isPrivate = false
    //只匹配类型
    typeMessage(e)
  })
}

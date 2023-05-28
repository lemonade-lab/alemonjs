import { IOpenAPI, IGuild, ReactionObj, SessionEvents } from 'qq-guild-bot'
import { green } from 'kolorist'
import { PathLike } from 'fs'
import {
  Messagetype,
  BotType,
  SegmentType,
  BotConfigType,
  segment,
  sendImage,
  postImage,
  createApi
} from 'alemon'

/* 非依赖引用 */
import { cmdInit, InstructionMatching, typeMessage } from './dealmsg'
import { channewlPermissions } from './permissions'
declare global {
  var cfg: BotConfigType
}

declare global {
  //快捷方法
  var segment: SegmentType
  //机器信息
  var botmsg: BotType
  //接口对象
  var client: IOpenAPI
  //所有频道
  var guilds: Array<IGuild>
}

/**
 * ws.on方法可以监听机器人所在频道的所有事件
 * 根据其e.eventType，判断出事件的具体类型
 */
export const createConversation = () => {
  createApi(cfg)
  /**  建权通过 */
  ws.on(SessionEvents.READY, async (e: Messagetype) => {
    if (cfg.sandbox) console.info(e)
    /* 配置快捷方法 */
    global.segment = segment
    /* 记录机器人信息 */
    global.botmsg = e.msg
    /* 初始化指令 */
    cmdInit()
    global.guilds = await client.meApi
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
    GUILDS() //机器人进出频道消息
    GUILD_MEMBERS() //成员频道进出变动消息
    DIRECT_MESSAGE() //私聊会话消息
    /* 基础权限 */
    PUBLIC_GUILD_MESSAGES() //频道会话消息（公域）
    /* 需申请权限 */
    GUILD_MESSAGES() //频道会话消息（私域）
    /* 需申请权限 */
    FORUMS_EVENT() //论坛消息（私域）
    OPEN_FORUMS_EVENT() //论坛消息（公域）
    GUILD_MESSAGE_REACTIONS() //频道表情点击会话消息
    INTERACTION() //互动事件监听
    MESSAGE_AUDIT() //审核事件监听
    AUDIO_ACTION() //音频事件
    console.info('[READY]', ` 欢迎回来 ${botmsg.user.username} ~`)
  })

  let size: number = 0

  ws.on(SessionEvents.ERROR, (e: any) => {
    console.error(e)
  })

  ws.on(SessionEvents.EVENT_WS, async e => {
    if (e.eventType == 'DISCONNECT') {
      console.log('出错', e)
      if (size > 8) {
        console.error('重连失败~')
        console.error('请确认配置config/config.taml')
        console.error('账户密码是否正确,事件是否匹配!')
        process.exit()
      }
      size++
    } else {
      if (size < 0) size = 0
      size--
    }
  })
}

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
const GUILDS = () => {
  ws.on('GUILDS', (e: Messagetype) => {
    if (cfg.sandbox) console.info(e)
    /* 事件匹配 */
    e.event = 'GUILDS'
    /** 匹配主频道消息类型 */
    guildMsg(e.eventType)
    /** 匹配子频道消息类型 */
    channelMsg(e.eventType)
    //只匹配类型
    typeMessage(e)
  })
}

const channelMsg = (eventType: string) => {
  switch (eventType) {
    case 'CHANNEL_CREATE': {
      console.info(eventType)
      break
    }
    case 'CHANNEL_UPDATE': {
      console.info(eventType)
      break
    }
    case 'CHANNEL_DELETE': {
      console.info(eventType)
      break
    }
    default: {
    }
  }
}

const guildMsg = (eventType: string) => {
  switch (eventType) {
    case 'GUILD_CREATE': {
      /**
       * 当机器人加入新guild时
       * 更新频道列表信息
       *
       * 加入频道到会发送额外的监听事件
       *
       * GUILD_MEMBER_UPDATE
       *
       * 也就是某频道的成员资料变更事件响应
       *
       */
      break
    }
    case 'GUILD_UPDATE': {
      /**
       * 当guild资料发生变更时
       *  indexof找出频道资料并更换为最新信息
       */
      break
    }
    case 'GUILD_DELETE': {
      /**
       * 退出？
       * 对于游戏来说可以考虑留不留存档
       */
      break
    }
    default: {
    }
  }
}

/**
GUILD_MEMBERS (1 << 1)
  - GUILD_MEMBER_ADD       // 当成员加入时
  - GUILD_MEMBER_UPDATE    // 当成员资料变更时
  - GUILD_MEMBER_REMOVE    // 当成员被移除时
 */
const GUILD_MEMBERS = () => {
  /*监听新人事件*/
  ws.on('GUILD_MEMBERS', async (e: Messagetype) => {
    if (cfg.sandbox) console.info(e)

    /* 事件匹配 */
    e.event = 'GUILD_MEMBERS'

    const { data } = await client.channelApi.channels(e.msg.guild_id)

    const channel = data.find(item => item.type === 0)

    if (channel) {
      const BotPS = await channewlPermissions(channel.id, botmsg.user.id)
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
const GUILD_MESSAGES = () => {
  ws.on('GUILD_MESSAGES', async (e: Messagetype) => {
    if (cfg.sandbox) console.info(e)

    // 撤回转交为公域监听处理
    if (e.eventType === 'MESSAGE_DELETE') return

    // 艾特机器人消息转交为公域监听处理
    if (new RegExp(`<@!${botmsg.user.id}>`).test(e.msg.content)) return

    /* 事件匹配 */
    e.event = 'MESSAGES'

    /* 类型匹配 */
    e.eventType = 'CREATE'

    /* 是私域 */
    e.isPrivate = true

    /* 测回消息 */
    e.isRecall = false

    /* 消息方法 */
    guildMessges(e).catch((err: any) => console.error(err))
  })
}

/**
 PUBLIC_GUILD_MESSAGES (1 << 30) // 消息事件，此为公域的消息事件
 AT_MESSAGE_CREATE       // 当收到@机器人的消息时
 PUBLIC_MESSAGE_DELETE   // 当频道的消息被删除时
 */
const PUBLIC_GUILD_MESSAGES = () => {
  ws.on('PUBLIC_GUILD_MESSAGES', async (e: Messagetype) => {
    if (cfg.sandbox) console.info(e)

    /* 事件匹配 */
    e.event = 'MESSAGES'

    /*   是私域 */
    e.isPrivate = true

    /* 屏蔽测回消息 */
    e.isRecall = false

    if (e.eventType === 'PUBLIC_MESSAGE_DELETE') {
      e.eventType = 'DELETE'
      e.isRecall = true
      //只匹配类型函数
      typeMessage(e)
      return
    }

    if (e.eventType == 'AT_MESSAGE_CREATE') {
      /* 类型匹配 */
      e.eventType = 'CREATE'
      /* 消息方法 */
      guildMessges(e).catch((err: any) => console.error(err))
    }
  })
}

const guildMessges = async (e: Messagetype) => {
  /* 屏蔽其他机器人的消息 */
  if (e.msg.author.bot) return

  const BotPS = await channewlPermissions(e.msg.channel_id, botmsg.user.id)
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
    e.identity.grade = arr[0].split(/(?<=1)/)[1]
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
const DIRECT_MESSAGE = () => {
  ws.on('DIRECT_MESSAGE', async (e: Messagetype) => {
    if (cfg.sandbox) console.info(e)

    if (e.eventType === 'DIRECT_MESSAGE_DELETE') {
      e.eventType = 'DELETE'
      e.isRecall = true
      //只匹配类型函数
      typeMessage(e)
      return
    }

    /* 事件匹配 */
    e.event = 'MESSAGES'

    e.eventType = 'CREATE'

    /* 屏蔽测回消息 */
    e.isRecall = false

    /* 是私聊 */
    e.isGroup = true

    const BotPS = await channewlPermissions(e.msg.channel_id, botmsg.user.id)
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
const GUILD_MESSAGE_REACTIONS = () => {
  ws.on('GUILD_MESSAGE_REACTIONS', (e: Messagetype) => {
    if (cfg.sandbox) console.info(e)
    /* 事件匹配 */
    e.event = 'GUILD_MESSAGE_REACTIONS'
    //只匹配类型
    typeMessage(e)
  })
}

/**
INTERACTION (1 << 26)
  - INTERACTION_CREATE     // 互动事件创建时
 */
const INTERACTION = () => {
  ws.on('INTERACTION', (e: Messagetype) => {
    if (cfg.sandbox) console.info(e)
    /* 事件匹配 */
    e.event = 'INTERACTION'
    //只匹配类型
    typeMessage(e)
  })
}

/**
MESSAGE_AUDIT (1 << 27)
- MESSAGE_AUDIT_PASS     // 消息审核通过
- MESSAGE_AUDIT_REJECT   // 消息审核不通过
 */
const MESSAGE_AUDIT = () => {
  ws.on('MESSAGE_AUDIT', (e: Messagetype) => {
    if (cfg.sandbox) console.info(e)
    /* 事件匹配 */
    e.event = 'MESSAGE_AUDIT'
    //只匹配类型
    typeMessage(e)
  })
}

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
const FORUMS_EVENT = () => {
  ws.on('FORUMS_EVENT', (e: Messagetype) => {
    if (cfg.sandbox) console.info(e)
    /* 事件匹配 */
    e.event = 'FORUMS'
    //是私域
    e.isPrivate = true
    //只匹配类型
    typeMessage(e)
  })
}

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
const OPEN_FORUMS_EVENT = () => {
  ws.on('OPEN_FORUMS_EVENT', (e: Messagetype) => {
    if (cfg.sandbox) console.info(e)
    /* 事件匹配 */
    e.event = 'FORUMS'
    //是私域
    e.isPrivate = false
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
const AUDIO_ACTION = () => {
  ws.on('AUDIO_ACTION', (e: Messagetype) => {
    if (cfg.sandbox) console.info(e)
    /* 事件匹配 */
    e.event = 'AUDIO_ACTION'
    //只匹配类型
    typeMessage(e)
  })
}

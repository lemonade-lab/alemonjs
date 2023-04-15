import { green } from 'kolorist'
import { IOpenAPI } from 'qq-guild-bot'

/* 非依赖引用 */
import { init, InstructionMatching } from './dealmsg'
import { messgetype } from './types'
import { sendImage } from './tool'
import { segment } from './segment'

declare global {
  var segment: any //快捷方法
  var bot: any //本机信息
  var client: IOpenAPI
}

/**
 * ws.on方法可以监听机器人所在频道的所有事件
 * 根据其e.eventType，判断出事件的具体类型
 */
export const createConversation = () => {
  /* 会话就绪 */
  READY()

  //会话失败
  ERROR()

  //私
  {
    /* 频道会话消息 */
    GUILD_MESSAGES()
    /* 论坛消息 */
    FORUMS_EVENT()
  }

  //公
  {
    /* 频道会话消息 */
    PUBLIC_GUILD_MESSAGES()
    /* 论坛消息 */
    OPEN_FORUMS_EVENT()
  }


  /* 机器人进出频道消息 */
  GUILDS()

  /* 成员频道进出变动消息 */
  GUILD_MEMBERS()

  /* 频道表情点击会话消息 */
  GUILD_MESSAGE_REACTIONS()

  /* 私聊会话消息 */
  DIRECT_MESSAGE()

  /* 互动事件监听 */
  INTERACTION()


  /* 音频事件 */
  AUDIO_ACTION()
}

const READY = () => {
  /* 监听登录事件 */
  ws.on('READY', (e: messgetype) => {
    global.segment = segment
    /* 记录本机 */
    global.bot = e.msg.user
    /* 初始化指令 */
    init()
    console.info(green('[READY]'), ` 欢迎回来 ${bot.username} ~`)
  })
}

const ERROR = () => {
  /* 监听登录失败事件 */
  ws.on('ERROR', (e: any) => {
    console.log('[ERROR]  :', e)
  })
}

/**
GUILDS (1 << 0)
  - GUILD_CREATE           // 当机器人加入新guild时
  - GUILD_UPDATE           // 当guild资料发生变更时
  - GUILD_DELETE           // 当机器人退出guild时
  - CHANNEL_CREATE         // 当channel被创建时
  - CHANNEL_UPDATE         // 当channel被更新时
  - CHANNEL_DELETE         // 当channel被删除时
 */
const GUILDS = () => {
  ws.on('GUILDS', (e: messgetype) => {
    /* 事件匹配 */
    e.event = 'GUILDS'
    console.log(e.eventType)
  })
}

/**
GUILD_MEMBERS (1 << 1)
  - GUILD_MEMBER_ADD       // 当成员加入时
  - GUILD_MEMBER_UPDATE    // 当成员资料变更时
  - GUILD_MEMBER_REMOVE    // 当成员被移除时
 */
const GUILD_MEMBERS = () => {
  /*监听新人事件*/
  ws.on('GUILD_MEMBERS', async (e: messgetype) => {
    /* 事件匹配 */
    e.event = 'GUILD_MEMBERS'
    console.log(e.eventType)

    /* 消息类型*/
    switch (e.eventType) {
      case 'DIRECT_MESSAGE_CREATE': {
        await client.directMessageApi.postDirectMessage(e.msg.guild_id, {
          msg_id: e.msg.id,
          content: '请在子频道中使用'
        })
        break
      }
      /* 进群 */
      case 'GUILD_MEMBER_ADD': {
        await client.messageApi.postMessage(e.msg.channel_id, {
          msg_id: e.msg.id, // 可选,消息id,如果指定则会回复该消息
          content: `${segment.at(e.msg.user.id)} 欢迎新人 ~ `,
          image: 'http://tva1.sinaimg.cn/bmiddle/6af89bc8gw1f8ub7pm00oj202k022t8i.jpg'
        })
        break
      }
      /* 退群 */
      case 'GUILD_MEMBER_REMOVE': {
        await client.messageApi.postMessage(e.msg.channel_id, {
          content: `${segment.at(e.msg.user.id)}${e.msg.user.username} 离开了我们...`
        })
        break
      }
      default: {
      }
    }
  })
}

/** 
GUILD_MESSAGES (1 << 9)    // 消息事件，仅 *私域* 机器人能够设置此 intents。
  - MESSAGE_CREATE         // 发送消息事件，代表频道内的全部消息，而不只是 at 机器人的消息。内容与 AT_MESSAGE_CREATE 相同
  - MESSAGE_DELETE         // 删除（撤回）消息事件
 * */
const GUILD_MESSAGES = () => {
  ws.on('GUILD_MESSAGES', async (e: messgetype) => {
    /* 屏蔽测回消息 */
    if (e.eventType === 'MESSAGE_DELETE') return
    /* 事件匹配 */
    e.event = 'GUILD_MESSAGES'
    guildMessges(e)
  })
}



/**
 PUBLIC_GUILD_MESSAGES (1 << 30) // 消息事件，此为公域的消息事件
 AT_MESSAGE_CREATE       // 当收到@机器人的消息时
 PUBLIC_MESSAGE_DELETE   // 当频道的消息被删除时
 */
const PUBLIC_GUILD_MESSAGES = () => {
  ws.on('PUBLIC_GUILD_MESSAGES', async (e: messgetype) => {
    /* 屏蔽测回消息 */
    if (e.eventType === 'PUBLIC_MESSAGE_DELETE') return
    /* 事件匹配 */
    e.event = 'PUBLIC_GUILD_MESSAGES'
    guildMessges(e)
  })
}



const guildMessges = async (e: messgetype) => {

  /* 屏蔽其他机器人的消息 */
  if (e.msg.author.bot) return

  /* 自身机器人权限检测 */
  const authority: any = await client.channelPermissionsApi
    .channelPermissions(e.msg.channel_id, bot.id)
    .catch((err) => {
      console.log(err)
    })

  /* 查看报错 */
  if (!authority) return

  /* 权限不通过则不反馈 */
  const { data: { permissions: botmiss } }: any = authority
  if (botmiss < 7) return

  /* 查看当前用户权限 */
  const {
    data: { permissions: usermiss }
  }: any = await client.channelPermissionsApi
    .channelPermissions(e.msg.channel_id, e.msg.author.id)
    .catch((err) => {
      console.log(err)
    })

  if (usermiss < 7) {
    e.isMaster = false
  } else {
    e.isMaster = true
  }

  /* 不是私聊 */
  e.isGroup = false

  /**
   * 消息发送机制
   * @param content 消息内容
   * @param obj 额外消息 可选
   */
  e.reply = async (content?: any, obj?: any): Promise<boolean> => {
    await client.messageApi
      .postMessage(e.msg.channel_id, {
        msg_id: e.msg.id,
        content,
        ...obj
      })
      .catch((err) => {
        console.log(err)
      })
    return true
  }

  /**
   * 表情表态
   * @param boj 表情对象
   * @param swich 是否转为删除  可选
   */
  e.deleteEmoji = async (boj: any): Promise<boolean> => {
    await client.reactionApi
      .deleteReaction(e.msg.channel_id, boj)
      .catch((err) => {
        console.log(err)
      })
      .catch((err) => {
        console.log(err)
      })
    return true
  }

  e.postEmoji = async (boj: any): Promise<boolean> => {
    await client.reactionApi
      .postReaction(e.msg.channel_id, boj)
      .catch((err) => {
        console.log(err)
      })
      .catch((err) => {
        console.log(err)
      })
    return true
  }

  /**
   * 发送本地图片
   * @param content 消息内容  可选
   * @param file_image 消息图片
   * @returns
   */
  e.sendImage = async (content: any, file_image: any): Promise<boolean> => {
    /* 私聊不能用 */
    if (e.isGroup) return
    await sendImage(e.msg.channel_id, {
      msg_id: e.msg.id, //消息id, 必须
      content,
      file_image //本地图片 路径 必须
    }).catch((err) => {
      console.log(err)
    })
    return true
  }

  //获得频道名
  const {
    data: { name }
  }: any = await client.channelApi.channel(e.msg.channel_id).catch((err) => {
    console.log(err)
  })
  console.info(
    green(
      `[${e.msg.channel_id}] [${name}] [${e.msg.author.username}] [${e.msg.author.id}] : ${e.msg.content ? e.msg.content : ''
      }`
    )
  )

  /* 消息 */
  e.cmd_msg = e.msg.content

  /* 艾特消息处理 */
  e.at = false
  if (e.msg.mentions) {
    // 去掉@ 转为纯消息
    e.atuid = e.msg.mentions
    e.at = true
    /* 循环删除文本中的ati信息 */
    e.atuid.forEach((item) => {
      e.cmd_msg = e.cmd_msg.replace(`<@!${item.id}>`, '').trim()
    })
  }

  /* 消息处理 */
  InstructionMatching(e)
}

/**
DIRECT_MESSAGE (1 << 12)
  - DIRECT_MESSAGE_CREATE   // 当收到用户发给机器人的私信消息时
  - DIRECT_MESSAGE_DELETE   // 删除（撤回）消息事件
 */
const DIRECT_MESSAGE = () => {
  ws.on('DIRECT_MESSAGE', async (e: messgetype) => {
    console.log(e)
    /* 屏蔽测回消息 */
    if (e.eventType === 'DIRECT_MESSAGE_DELETE') return
    /* 事件匹配 */
    e.event = 'DIRECT_MESSAGE' 

    /* 是私聊 */
    e.isGroup = true

    /**
     * 私聊交互仅能发表情，发文字,发图片，发特殊消息
     * 
     * 缺失发送本地图片
     */

    /* 消息发送机制 */
    e.reply = async (content?: string,boj?:any) => {
      await client.directMessageApi
        .postDirectMessage(e.msg.guild_id, {
          msg_id: e.msg.id,
          content,
          ...boj
        })
        .catch((err) => {
          console.log(err)
        })
      return true
    }

    console.info(
      green(
        `[isGroup] [${e.msg.author.username}] [${e.msg.author.id}] : ${e.msg.content ? e.msg.content : ''
        }`
      )
    )

    
  /* 消息 */
  e.cmd_msg = e.msg.content

    /* 消息处理 */
    InstructionMatching(e)
  })
}


/**
GUILD_MESSAGE_REACTIONS (1 << 10)
  - MESSAGE_REACTION_ADD    // 为消息添加表情表态
  - MESSAGE_REACTION_REMOVE // 为消息删除表情表态
 */
const GUILD_MESSAGE_REACTIONS = () => {
  ws.on('GUILD_MESSAGE_REACTIONS', (e: messgetype) => {
    /* 事件匹配 */
    e.event = 'GUILD_MESSAGE_REACTIONS'
    console.log(e.eventType)
  })
}

/**
INTERACTION (1 << 26)
  - INTERACTION_CREATE     // 互动事件创建时
 */
const INTERACTION = () => {
  ws.on('INTERACTION', (e: messgetype) => {
    /* 事件匹配 */
    e.event = 'INTERACTION'
    console.log(e.eventType)
  })
}

/**
MESSAGE_AUDIT (1 << 27)
- MESSAGE_AUDIT_PASS     // 消息审核通过
- MESSAGE_AUDIT_REJECT   // 消息审核不通过
 */
const MESSAGE_AUDIT = () => {
  ws.on('MESSAGE_AUDIT', (e: messgetype) => {
    /* 事件匹配 */
    e.event = 'MESSAGE_AUDIT'
    console.log(e.eventType)
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
  ws.on('FORUMS_EVENT', (e: messgetype) => {
    /* 事件匹配 */
    e.event = 'FORUMS_EVENT'
    console.log(e.eventType)
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
  ws.on('OPEN_FORUMS_EVENT', (e: messgetype) => {
    /* 事件匹配 */
    e.event = 'OPEN_FORUMS_EVENT'
    console.log(e.eventType)
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
  ws.on('AUDIO_ACTION', (e: messgetype) => {
    /* 事件匹配 */
    e.event = 'AUDIO_ACTION'
    console.log(e.eventType)
  })
}

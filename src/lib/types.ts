import { IMessage, IUser } from 'qq-guild-bot'
interface READY {
  id: string
  username: string
  status: number
}
interface msgType extends IMessage {
  user: {
    id: string
    username: string
  }
}
/* 核心处理e消息对象类型 */
interface messgetype {
  event: string //事件类型
  eventType: string //消息类型
  msg: msgType //消息对象
  isGroup: boolean //是否是私聊
  recall: boolean //是否是撤回
  atuid: IUser[] // 艾特得到的qq
  at: boolean // 是否艾特
  isMaster: boolean //是否是管理员
  cmd_msg: string
  //消息发送机制
  reply: (content?: any, obj?: any) => Promise<boolean>
  //发送本地图片机制
  sendImage: (content: any, file_image: any) => Promise<boolean>
  //删除表态
  deleteEmoji: (boj: any) => Promise<boolean>
  //发送表态
  postEmoji: (boj: any) => Promise<boolean>
}

interface ruleType {
  reg: string
  fnc: string
}

interface cmdTyoe {
  belong: string //导出类型
  type: string //插件类型
  name: string //插件名
  rule: ruleType[] //对象数组
  event: string //事件类型
  eventType: string //消息类型
  dsc: any //指令说明
  priority: number //优先级
}
type pluginType = string | any[] | Number | ((e: messgetype, content: string) => Promise<boolean>)
export { READY, messgetype, pluginType, cmdTyoe }

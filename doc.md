# 设计稿

频道/别野 -> GUILD/villa

子频道/房间 -> CHANNEL/room

# alemon

写法模板

```ts
// example/word.ts
import { plugin, Messagetype } from 'alemon'
export class word extends plugin {
  constructor() {
    super({
      rule: [
        {
          reg: /^\/你好$/,
          fnc: 'helloWord'
        }
      ]
    })
  }
  async helloWord(e: Messagetype): Promise<boolean> {
    e.reply('你好')
    return false
  }
}
```

# 事件类型

```ts
export enum EType {
  /* 别野消息 */
  GUILD = 'GUILD',
  /* 房间消息 */
  CHANNEL = 'CHANNEL',
  /* 成员进出别野变动消息 */
  GUILD_MEMBERS = 'GUILD_MEMBERS',
  /* 审核消息 */
  MESSAGE_AUDIT = 'MESSAGE_AUDIT',
  /* 会话消息 */
  MESSAGES = 'MESSAGES',
  /* 会话消息 */
  message = 'message',
  /* 表态消息 */
  GUILD_MESSAGE_REACTIONS = 'GUILD_MESSAGE_REACTIONS'
}
```

# 消息类型

```ts
export enum EventType {
  CREATE = 'CREATE', // 创建/进入
  UPDATE = 'UPDATE', // 更新/变动
  DELETE = 'DELETE' // 删除/退出
}
```

# 基础字段

```ts
  /**
   * 事件编号
   */
  eventId: string;
  /**
   * 事件类型
   */
  event: EType;
  /**
   * 消息类型
   */
  eventType: EventType;
  /**
   * 消息对象
   */
  msg: MsgType;
  /**
   * 是否是私域
   */
  isPrivate: boolean;
  /**
   *是否是群聊
   */
  isGroup: boolean;
  /**
   * 是否是撤回
   */
  isRecall: boolean;
  /**
   * 是否是艾特
   */
  at: boolean;
  /**
   * 艾特得到的qq
   */
  atuid: IUser[];
  /**
   * 是否是机器人主人
   */
  isMaster: boolean;
  /**
   * 去除了艾特后的消息
   */
  cmd_msg: string;
```

# 消息发送

```ts
/**
* 消息发送机制
* @param content 消息 | buffer
* @param obj  消息对象 | buffer
* @returns
*/
export type reply: (content?: string | object | Array<string> | Buffer, obj?: object | Buffer) =>
  Promise<boolean>

```

# 表情表态哦

```ts
/**
 * 删除表态
 * @param boj 表情对象
 * @returns
 */
export type deleteEmoji: (boj: ReactionObj) => Promise<boolean>
/**
 * 发送表态
 * @param boj 表情对象
 * @returns
 */
export type postEmoji: (boj: ReactionObj) => Promise<boolean>
```

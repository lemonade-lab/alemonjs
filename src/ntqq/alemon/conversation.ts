import { GROUP_AT_MESSAGE_CREATE } from './message/GROUP_AT_MESSAGE_CREATE.js'
import { C2C_MESSAGE_CREATE } from './message/C2C_MESSAGE_CREATE.js'
import { ExampleObject } from './types.js'

/**
 * 会话事件分类
 * @param ws
 */
export async function callBack(data: ExampleObject) {
  if (data.group_id == '0') {
    // 私聊
    console.log('私聊data=', data)
    C2C_MESSAGE_CREATE(data)
  } else {
    console.log('群聊data=', data)
    GROUP_AT_MESSAGE_CREATE(data)
  }
}

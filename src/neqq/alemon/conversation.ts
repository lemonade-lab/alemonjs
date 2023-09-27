import { setBotMsgByQQ } from './bot.js'
import { getBotConfigByKey } from '../../login.js'
import { GROUP_AT_MESSAGE_CREATE } from './message/GROUP_AT_MESSAGE_CREATE.js'
import { C2C_MESSAGE_CREATE } from './message/C2C_MESSAGE_CREATE.js'

/**
 * 会话事件分类
 * @param ws
 */
export const callback = data => {}

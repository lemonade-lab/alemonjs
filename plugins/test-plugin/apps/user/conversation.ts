import { plugin, PluginType, Messgetype } from '../../api'
import {
  conversationHandlers,
  setConversationState,
  deleteConversationState
} from '../../../../src/lib/dialogue'

export class conversation extends plugin {
  [parameter: string]: PluginType
  constructor() {
    super({
      dsc: '对话机示范',
      rule: [
        {
          reg: '^/开始对话$',
          fnc: 'startConversation'
        }
      ]
    })
  }

  async startConversation(e: Messgetype) {
    /**
     * 匹配指令后,会以普通函数处理状态执行该方法
     */

    e.reply('好的,现在开始你的个人对话')

    /**
     * 设置对话机
     */

    conversationHandlers.set(e.msg.author.id, async (e, state) => {
      console.log('新对话', e)
      /* 对话次数 */
      state.step += 1

      e.reply(`当前对话次数:${state.step}`)

      if (state.step <= 3) {
        await setConversationState(e.msg.author.id, state)
        return
      }

      e.reply(`对话次数已达上限~`)
      await deleteConversationState(e.msg.author.id)
    })

    const state = {
      step: 0,
      data: '携带的数据'
    }

    /**
     * 开始监听对话
     */
    await setConversationState(e.msg.author.id, state)
    return false
  }
}

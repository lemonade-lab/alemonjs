import { Client } from 'discord.js'
import { checkRobotByDiscord } from './login.js'
import { callBackByDisdord } from './alemon/conversation.js'
import { setBotMsgByDiscord } from './alemon/bot.js'
import { getBotConfigByKey } from '../login.js'
export async function createAlemonByDiscord() {
  /**
   * 登录
   */
  if (
    await checkRobotByDiscord().catch(err => {
      console.error(err)
      process.exit()
    })
  ) {
    /**
     * 读取配置
     */
    const cfg = getBotConfigByKey('discord')
    /**
     * 创建程序
     */
    const client = new Client({
      intents: cfg.intents
    })
    /**
     * 启动准备
     */
    client.on('ready', () => {
      setBotMsgByDiscord({
        id: client.user?.id ?? '',
        name: client.user?.username ?? '',
        avatar:
          client.user?.avatarURL({
            extension: 'png',
            forceStatic: true,
            size: 1024
          }) ?? ''
      })
      console.info(`欢迎回来 ${client.user?.username}`)
    })
    /**
     * 监听消息创建
     */
    client.on('messageCreate', callBackByDisdord)
    /**
     * 登录
     */
    client.login(cfg.token)
    return true
  }
  return false
}

import { GatewayIntentBits } from '../default/types.js'
export default {
  token: '',
  masterID: '',
  password: '',
  intents: [
    GatewayIntentBits.DirectMessageReactions, // 直接消息反应
    GatewayIntentBits.DirectMessageTyping, // 直接消息键入
    GatewayIntentBits.DirectMessages, // 直接消息
    GatewayIntentBits.GuildMessageReactions, // 帮会消息反应，
    GatewayIntentBits.GuildMessageTyping, // 帮会消息打字，
    GatewayIntentBits.GuildMessages, // 帮会消息
    GatewayIntentBits.Guilds, // 帮会监听
    GatewayIntentBits.MessageContent // 消息内容
  ] as GatewayIntentBits[]
}

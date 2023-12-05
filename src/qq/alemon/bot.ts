interface BotMessage {
  id: string
  name: string
  avatar?: string
}

let bot: BotMessage = {
  id: '',
  name: '',
  avatar: ''
}
export function setBotMsgByQQ(val: BotMessage) {
  bot = val
}

export function getBotMsgByQQ() {
  return bot
}

interface BotMessage {
  id: string
  name: string
  avatar?: string
}

let bot: BotMessage = {
  id: '',
  name: '',
  avatar: 'string'
}

export function setBotMsgByDISOCRD(val: BotMessage) {
  bot = val
}

export function getBotMsgByDISCORD() {
  return bot
}

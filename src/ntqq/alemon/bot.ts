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

export function setBotMsgByNtqq(val: BotMessage) {
  bot = val
}

export function getBotMsgByNtqq() {
  return bot
}

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

export function setBotMsgByKOOK(val: BotMessage) {
  bot = val
}

export function getBotMsgByKOOK() {
  return bot
}

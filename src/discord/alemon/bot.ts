let bot = {
  id: '',
  name: '',
  avatar: 'string'
}

export function setBotMsgByDiscord(val) {
  bot = val
}

export function getBotMsgByDiscord() {
  return bot
}

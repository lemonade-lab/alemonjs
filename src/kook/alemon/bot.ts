let bot = {
  id: '',
  name: '',
  avatar: 'string'
}

export function setBotMsgByKOOK(val) {
  bot = val
}

export function getBotMsgByKOOK() {
  return bot
}

let bot = {
  id: '',
  name: '',
  avatar: 'string'
}

export function setBotMsgByQQ(val) {
  bot = val
}

export function getBotMsgByQQ() {
  return bot
}

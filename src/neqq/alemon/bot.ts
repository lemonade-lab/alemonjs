let bot = {
  id: '',
  name: '',
  avatar: 'string'
}

export function setBotMsgByQQ(val: any) {
  bot = val
}

export function getBotMsgByQQ() {
  return bot
}

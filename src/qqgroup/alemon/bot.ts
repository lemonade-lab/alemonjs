let bot = {
  id: '',
  name: '',
  avatar: 'string'
}

export function setBotMsgByQQGroup(val) {
  bot = val
}

export function getBotMsgByQQGroup() {
  return bot
}

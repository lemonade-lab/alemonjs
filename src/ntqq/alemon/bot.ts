let bot = {
  id: '',
  name: '',
  avatar: 'string'
}

export function setBotMsgByNtqq(val: any) {
  bot = val
}

export function getBotMsgByNtqq() {
  return bot
}

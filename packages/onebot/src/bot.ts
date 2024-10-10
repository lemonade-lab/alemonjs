let bot = {
  id: '',
  name: '',
  avatar: ''
}
export function setBotMsgByONE(val: typeof bot) {
  bot = val
}
export function getBotMsgByONE() {
  return bot
}

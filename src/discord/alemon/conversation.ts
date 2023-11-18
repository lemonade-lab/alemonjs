import { MESSAGES } from './message/MESSAGES.js'
export function conversation(t: string, d: any) {
  console.log(t)
  if (t == 'READY') {
    console.log('机器人', d.user)
  } else if (t == 'GUILD_CREATE') {
    // console.log(d)
  } else if (t == 'MESSAGE_CREATE') {
    MESSAGES(d)
  } else {
    console.log('数据', d)
  }
}

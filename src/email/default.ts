import { EmailOptions } from './types.js'
export const DefaultEmailOptions: EmailOptions = {
  smt: {
    // 平台
    service: 'qq',
    // 账号密码
    auth: {
      user: '',
      pass: ''
    }
  },
  to: ''
}

import { createTransport, SendMailOptions } from 'nodemailer'
import { EmailOptions } from './types.js'
import { ABotConfig } from '../config/index.js'
export class Email {
  options: EmailOptions
  constructor(options?: EmailOptions) {
    if (options) {
      this.options = options
    } else {
      this.options = ABotConfig.get('email')
    }
  }
  /**
   * 发送消息
   * @param options
   * @returns
   */
  send(options: SendMailOptions) {
    if (!options) return
    if (
      !this.options ||
      this.options.smt.auth.user == '' ||
      this.options.smt.auth.pass == ''
    ) {
      return
    }
    if (!options.from) options.from = this.options.smt.auth.user
    if (!options.to) options.to = this.options.to
    if (!options.to || options.to == '') return
    // 发送
    createTransport(this.options.smt).sendMail(options)
  }
}

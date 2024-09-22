export interface EmailOptions {
  smt: {
    // 平台
    service: string
    // 账号密码
    auth: {
      user: string
      pass: string
    }
  }
  to: string
}

import {
  createClient,
  segment,
  FriendRequestEvent,
  GroupInviteEvent,
  GroupRequestEvent,
  GroupMessageEvent
} from 'icqq'

/**
 * 登录
 * @param account
 * @param password
 * @param platform
 */
export function createLogin(account: number, password: string, platform = 1, callBack: any) {
  /**
   * 创建客户端
   */
  const client = createClient({
    platform
  })

  /**
   * 监听滑块
   */
  client.on('system.login.slider', e => {
    console.log('PC按[CTRA+鼠标左键]以路径方式打开')
    console.log('正在等待输入 ticket: ')
    process.stdin.once('data', data => {
      client.submitSlider(data.toString().trim())
    })
  })

  /**
   * 监听扫码
   */
  client.on('system.login.qrcode', e => {
    console.log('扫码完成后回车继续...')
    process.stdin.once('data', () => {
      client.login()
    })
  })

  /**
   * 监听验证
   */
  client.on('system.login.device', e => {
    console.log('请选择验证方式:')
    console.log('1：短信验证')
    console.log('其他:扫码验证)')
    process.stdin.once('data', data => {
      if (data.toString().trim() === '1') {
        client.sendSmsCode()
        console.log('请输入短信验证码:')
        process.stdin.once('data', res => {
          client.submitSmsCode(res.toString().trim())
        })
      } else {
        console.log(e.url)
        console.log('扫码完成后回车继续...')
        process.stdin.once('data', () => {
          client.login()
        })
      }
    })
  })

  /**
   * 上线监听
   */
  client.on('system.online', () => {
    /**
     * 你的账号已上线
     * 你可以做任何事
     */
    console.log(`欢迎回来 ~ ${this.nickname}(${this.uin} ${this.fl.size}个好友 ${this.gl.size}个群`)
  })

  /**
   * 监听普通消息
   */
  client.on('message', callBack)

  /**
   * 撤回和发送群消息
   */
  client.on('message.group', (event: GroupMessageEvent) => {
    if (event.raw_message === 'dice') {
      /**
       * 撤回这条消息
       */
      event.recall()
      /**
       * 发送一个骰子
       */
      event.group.sendMsg(segment.dice())
      /**
       * 发送一个戳一戳
       */
      event.member.poke()
    }
  })

  /**
   * 同意好友申请
   */
  client.on('request.friend', (event: FriendRequestEvent) => {
    event.approve()
  })

  /**
   * 同意群邀请
   */
  client.on('request.group.invite', (event: GroupInviteEvent) => event.approve())

  /**
   * 同意加群申请
   * 拒绝`event.approve(false)`
   */
  client.on('request.group.add', (event: GroupRequestEvent) => event.approve())

  client.login(account, password)
}

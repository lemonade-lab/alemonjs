import {
  createClient,
  segment,
  FriendRequestEvent,
  GroupInviteEvent,
  GroupRequestEvent,
  GroupMessageEvent
} from 'icqq'
import axios from 'axios'
import prompts from 'prompts'

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
   * 挂块监听
   * @param url
   * @returns
   *
   * https://hlhs-nb.cn/captcha/slider
   *
   */
  async function getTicket(url) {
    const urlReq = `https://hlhs-nb.cn/captcha/slider?key=${client.uin}`
    const urlRes = await axios
      .post(urlReq, { url })
      .then(res => res.data)
      .catch()
    if (urlRes.message != 'OK') {
      return
    }
    console.log(urlReq)
    console.log('请60s内打开链接以完成验证...')
    console.log('完成后将自动进行登录...')
    /**
     * 休眠函数
     * @param ms 毫秒
     */
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    }
    for (let i = 0; i < 20; i++) {
      await sleep(3000)
      const res: any = await axios
        .post(urlReq, { submit: client.uin })
        .then(res => res.data)
        .catch(err => {
          console.error(err)
        })
      if (res.data != null) {
        return res.data?.ticket
      }
    }
    return
  }

  /**
   * 监听滑块
   */
  client.on('system.login.slider', async e => {
    /**
     * 存在挂块验证,可询问验证方式
     */
    const { select } = await prompts([
      {
        type: 'select',
        name: 'select',
        message: '请选择滑块验证获取方式 :',
        choices: [
          { title: '自动验证获取', value: 1 },
          { title: '手动验证获取', value: 2 },
          { title: '滑动助手获取', value: 3 }
        ],
        initial: 0 // 默认安卓
      }
    ]).catch((err: any) => {
      console.log(err)
      process.exit()
    })
    if (!select) process.exit()
    console.log('PC按[CTRA+鼠标左键]以外链方式打开')
    const map = {
      1: async () => {
        const ticket$0 = await getTicket(e.url)
        if (!ticket$0) {
          console.log('请求错误,请手动获取\n')
          const { ticket } = await prompts([
            {
              type: 'password',
              name: 'ticket',
              message: 'ticket: ',
              validate: value => (value !== '' && typeof value === 'string' ? true : 'ticket: ')
            }
          ]).catch((err: any) => {
            console.log(err)
            process.exit()
          })
          if (!ticket) process.exit()
          client.submitSlider(ticket.trim())
          return
        }
        client.submitSlider(ticket$0.trim())
        return
      },
      2: async () => {
        console.log('滑动验证app下载地址\nhttps://wwp.lanzouy.com/i6w3J08um92h\n密码:3kuu')
        const { ticket } = await prompts([
          {
            type: 'password',
            name: 'ticket',
            message: 'ticket: ',
            validate: value => (value !== '' && typeof value === 'string' ? true : 'ticket: ')
          }
        ]).catch((err: any) => {
          console.log(err)
          process.exit()
        })
        if (!ticket) process.exit()
        client.submitSlider(ticket.trim())
      },
      3: async () => {
        const { ticket } = await prompts([
          {
            type: 'password',
            name: 'ticket',
            message: 'ticket: ',
            validate: value => (value !== '' && typeof value === 'string' ? true : 'ticket: ')
          }
        ]).catch((err: any) => {
          console.log(err)
          process.exit()
        })
        if (!ticket) process.exit()
        client.submitSlider(ticket.trim())
      }
    }
    if (map[select]) {
      map[select]()
    }
    return
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
  client.on('system.login.device', async e => {
    const { select } = await prompts([
      {
        type: 'select',
        name: 'select',
        message: '请选择滑块验证获取方式 :',
        choices: [
          { title: '短信验证', value: 1 },
          { title: '扫码验证', value: 2 }
        ],
        initial: 0 // 默认安卓
      }
    ]).catch((err: any) => {
      console.log(err)
      process.exit()
    })
    if (!select) process.exit()
    if (select == 1) {
      client.sendSmsCode()
      const { code } = await prompts([
        {
          type: 'password',
          name: 'code',
          message: '请输入短信验证码: ',
          validate: value => (value !== '' && typeof value === 'string' ? true : 'ticket: ')
        }
      ]).catch((err: any) => {
        console.log(err)
        process.exit()
      })
      if (!code) process.exit()
      client.submitSmsCode(code.trim())
    } else {
      console.log(e.url)
      console.log('扫码完成后回车继续...')
      process.stdin.once('data', () => {
        client.login()
      })
    }
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

  /**
   * 登录
   */
  client.login(account, password)
}

import inquirer from 'inquirer'
import { trim } from 'lodash-es'
import fetch from 'node-fetch'
import { promisify } from 'util'
import chalk from 'chalk'
const sleep = promisify(setTimeout)

/**
 * 监听上线事件
 */
let inSlider = false

/**
 * 扫码登录现在仅能在同一ip下进行
 * @param event
 */
export async function qrcode(client) {
  console.info(`\n`)
  console.info(`请使用登录当前QQ的手机${chalk.green('扫码')}完成登录`)
  console.info(`如果显示二维码过期,可以按${chalk.green('回车键（Enter）')}刷新`)
  console.info(`\n`)

  // 次数
  let time = 0

  let timeout = null

  const start = async () => {
    // 积累次数
    time++

    // 得到扫码结果
    const res = await client.queryQrcodeResult()

    // 成功
    if (res.retcode === 0) {
      inSlider = true

      console.info(chalk.green('\n扫码成功,开始登录...\n'))

      // 阻塞1秒
      await sleep(1000)

      // 二维码登录
      client.qrcodeLogin()
    }

    if (time >= 150) {
      console.error('等待扫码超时,已停止运行\n')
      process.exit()
    } else {
      timeout = setTimeout(start, 1000 * 3)
    }
  }

  timeout = setTimeout(start, 2000)

  // 未完成
  if (!inSlider) {
    // 刷新二维码
    inquirer
      .prompt({
        type: 'input',
        message: '回车刷新二维码,等待扫码中...\n',
        name: 'enter'
      })
      .then(async () => {
        // 完成登录了
        if (inSlider) return
        // 取消任务
        timeout && clearTimeout(timeout)

        console.log('\n重新刷新二维码...\n\n')

        // 阻塞1秒
        await sleep(1000)

        // 刷新二维码
        client.fetchQrcode()
      })
      .catch(() => {
        timeout && clearTimeout(timeout)
      })
  }
}

/**
 * 收到滑动验证码提示后,必须使用手机拉动,PC浏览器已经无效
 * @param event
 */
export async function slider(client, event, uin) {
  inSlider = true
  console.log(`\n\n------------------${chalk.green('↓↓滑动验证链接↓↓')}----------------------\n`)
  console.log(chalk.green(event.url))
  console.log('\n--------------------------------------------------------')
  console.log(`提示：打开上面链接获取ticket,可使用${chalk.green('【滑动验证app】')}获取`)
  console.log(`链接存在${chalk.green('有效期')},请尽快操作,多次操作失败可能会被冻结`)
  console.log('滑动验证app下载地址：https://wwp.lanzouy.com/i6w3J08um92h 密码:3kuu\n')

  const ret = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: '触发滑动验证,需要获取ticket通过验证,请选择获取方式:',
      choices: ['0.自动获取ticket', '1.手动获取ticket', '2.滑动验证app请求码获取']
    }
  ])

  await sleep(200)

  let ticket

  if (ret.type == '0.自动获取ticket') {
    ticket = await this.getTicket(event.url, uin)
    if (!ticket) console.log('\n请求错误,返回手动获取ticket方式\n')
  }

  if (ret.type == '2.滑动验证app请求码获取') {
    ticket = await this.requestCode(event.url)
    if (!ticket) console.log('\n请求错误,返回手动获取ticket方式\n')
  }

  if (!ticket) {
    const res = await inquirer.prompt({
      type: 'input',
      message: '请输入ticket:',
      name: 'ticket',
      validate(value) {
        if (!value) return 'ticket不能为空'
        if (value.toLowerCase() == 'ticket') return '请输入获取的ticket'
        if (value == event.url) return '请勿输入滑动验证链接'
        return true
      }
    })
    ticket = trim(res.ticket, '"')
  }

  global.inputTicket = true

  client.submitSlider(ticket.trim())
}

/**
 *
 * @param url
 * @returns
 */
export async function getTicket(url, uin) {
  const req = `https://hlhs-nb.cn/captcha/slider?key=${uin}`

  await fetch(req, {
    method: 'POST',
    body: JSON.stringify({ url })
  })

  console.log('\n----请打开下方链接并在2分钟内进行验证----')
  console.log(`${chalk.green(req)}\n----完成后将自动进行登录----`)

  for (let i = 0; i < 40; i++) {
    const res: {
      data?: {
        ticket: null
      }
    } = await fetch(req, {
      method: 'POST',
      body: JSON.stringify({ submit: uin })
    }).then(res => res.json())
    if (res.data?.ticket) return res.data.ticket
    await sleep(3000)
  }
}

/**
 *
 * @param url
 * @returns
 */
export async function requestCode(url) {
  const txhelper = {
    req: null,
    res: null,
    code: null,
    url: url.replace('ssl.captcha.qq.com', 'txhelper.glitch.me')
  }
  txhelper.req = await fetch(txhelper.url).catch(err => console.log(err.toString()))

  if (!txhelper.req?.ok) return false

  txhelper.req = await txhelper.req.text()
  if (!txhelper.req.includes('使用请求码')) return false

  txhelper.code = /\d+/g.exec(txhelper.req)
  if (!txhelper.code) return false

  console.log(
    `\n请打开滑动验证app,输入请求码${chalk.green('【' + txhelper.code + '】')},然后完成滑动验证\n`
  )

  await sleep(200)

  //
  await inquirer.prompt({
    type: 'input',
    message: '验证完成后按回车确认,等待在操作中...',
    name: 'enter'
  })

  //
  txhelper.res = await fetch(txhelper.url).catch(err => console.log(err.toString()))

  //
  if (!txhelper.res) return false

  //
  txhelper.res = await txhelper.res.text()

  if (!txhelper.res) return false
  if (txhelper.res == txhelper.req) {
    console.log('\n未完成滑动验证')
    return false
  }

  console.log(`\n获取ticket成功：\n${txhelper.res}\n`)
  return trim(txhelper.res)
}

/**
 * 设备锁
 * @param event
 */
export async function device(client, event) {
  global.inputTicket = false
  console.log(`\n\n------------------${chalk.green('↓↓设备锁验证↓↓')}----------------------\n`)
  const ret = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: '触发设备锁验证,请选择验证方式:',
      choices: ['1.网页扫码验证', '2.发送短信验证码到密保手机']
    }
  ])

  await sleep(200)

  if (ret.type == '1.网页扫码验证') {
    console.log('\n' + chalk.green(event.url) + '\n')
    console.log('请打开上面链接,完成验证后按回车')
    await inquirer.prompt({
      type: 'input',
      message: '等待操作中...',
      name: 'enter'
    })
    await client.login()
  } else {
    console.log('\n')
    client.sendSmsCode()
    await sleep(200)
    console.info(`验证码已发送：${event.phone}\n`)
    let res = await inquirer.prompt({
      type: 'input',
      message: '请输入短信验证码:',
      name: 'sms'
    })
    await client.submitSmsCode(res.sms)
  }
}

/**
 * 登录错误
 * @param event
 */
export function error(event) {
  if (Number(event.code) === 1) console.error('QQ密码错误,运行命令重新登录')
  if (global.inputTicket && event.code == 237) {
    console.error(`${chalk.red('ticket')}输入错误或者已失效,已停止运行,请重新登录验证`)
  } else if (event?.message.includes('冻结')) {
    console.error('账号已被冻结,已停止运行')
  } else {
    console.error('登录错误,已停止运行')
  }
  process.exit()
}

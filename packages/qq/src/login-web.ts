import chalk from 'chalk'
import { trim } from 'lodash-es'
// import { unMount } from './start'

let qrcodeCount = 0

/**
 * 监听二维码
 * @param event
 */
function onQrcode(event: { image: Buffer }) {
  qrcodeCount++
  process.send({
    type: 'qq.login.qrcode',
    data: event.image?.toString('base64')
  })
  // 超时提醒
  if (qrcodeCount >= 150) {
    process.send({
      type: 'qq.login.qrcode.expired',
      data: '扫码刷新超时...'
    })
    qrcodeCount = 0
    // unMount('@alemonjs/qq')
  }
}

/**
 * 监听图形验证链接
 * @param event
 */
function onSlider(event: { url: string }) {
  console.log(`\n\n------------------${chalk.green('↓↓滑动验证链接↓↓')}----------------------\n`)
  console.log(chalk.green(event.url))
  console.log('\n--------------------------------------------------------')
  console.log(`提示：打开上面链接获取ticket,可使用${chalk.green('【滑动验证app】')}获取`)
  console.log(
    `【滑动验证app】下载地址：${chalk.green('https://wwp.lanzouy.com/i6w3J08um92h')} 密码:3kuu\n`
  )
  console.log(`链接存在${chalk.green('有效期')},请尽快操作,多次操作失败可能会被冻结`)
  process.send({
    type: 'qq.login.slider',
    data: 'http://127.0.0.1:25660/captcha?url=' + encodeURIComponent(event.url)
  })
}

/**
 * 监听设备锁
 * @param event
 */
function onDevice(event: { url: string; phone: string }) {
  global.inputTicket = false
  process.send({
    type: 'qq.device.validate',
    data: {
      msg: '触发设备锁验证,请选择验证方式:',
      url: event.url,
      phone: event.phone,
      choices: ['1.网页验证', '2.发送短信验证码到密保手机']
    }
  })
}

/**
 * 登录错误
 * @param event
 */
function onError(event: { code: number; message: string }) {
  console.log('QQ.error:', event)

  let msg = `[code:${event.code}]`
  if (event?.code == 1) {
    msg = 'QQ密码错误,运行命令重新登录'
  } else if (event?.code == 237) {
    msg = `ticket输入错误或者已失效,已停止运行,请重新登录验证`
  } else if (event?.code == 40 || event?.message?.includes('冻结')) {
    msg = '账号已被冻结,已停止运行'
  } else if (event?.code == 162) {
    msg = '短信发送过频繁'
  } else if (event?.code == 163) {
    msg = '输入验证码错误'
  } else {
    msg = '登录错误,已停止运行'
  }

  msg = msg + ':\n' + event.message || ''
  process.send({
    type: 'qq.error',
    data: msg
  })
  // unMount('@alemonjs/qq')
}

/**
 * @deprecated
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

  process.send({
    type: 'qq.slider.confirm',
    data: '是否已经使用滑块验证app验证完成'
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
  process.send({
    type: 'qq.slider.success',
    data: '是否已经使用滑块验证app验证完成'
  })
  return trim(txhelper.res)
}

export { onDevice, onError, onQrcode, onSlider }

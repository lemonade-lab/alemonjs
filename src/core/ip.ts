import { publicIp } from 'public-ip'

let myIp: string | false

/**
 * 得到ip地址
 * @returns
 */
export async function getIP() {
  if (myIp) {
    return myIp
  }
  myIp = await publicIp({
    onlyHttps: true,
    timeout: 10000
  })
    .then(ip => {
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
        myIp = ip
        return myIp
      } else {
        return false
      }
    })
    .catch(err => {
      console.error('[AlemonJS]IP获取错误', err)
      process.exit()
    })
  return myIp
}

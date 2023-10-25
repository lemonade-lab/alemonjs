import { publicIp } from 'public-ip'
let myIp: string | false
/**
 * 得到本机IP地址
 * @returns
 */
export async function getIP() {
  if (myIp) return myIp
  return await publicIp({
    onlyHttps: true,
    timeout: 10000
  }).then(ip => {
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      myIp = ip
      return myIp
    }
    return false
  })
}

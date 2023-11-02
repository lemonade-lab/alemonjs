import { publicIp, Options } from 'public-ip'
let myIp: string | false
/**
 * 得到本机IP地址
 * @returns
 */
export async function getIP(options: Options = {}) {
  if (myIp) return myIp
  return await publicIp({
    onlyHttps: true,
    ...options
  }).then(ip => {
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) myIp = ip
    return myIp ?? false
  })
}

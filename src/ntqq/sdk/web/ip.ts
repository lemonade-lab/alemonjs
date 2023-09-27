import { publicIp } from 'public-ip'
/**
 * 得到ip地址
 * @returns
 */
export async function getIP() {
  const ip = await publicIp({
    onlyHttps: true,
    timeout: 10000
  })
    .then((ip: any) => {
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
        return ip
      } else {
        return false
      }
    })
    .catch(err => {
      console.error(err)
      process.exit()
    })
  return ip
}
